// Link interni sotto una base (la versione B su /b/, ADR-0004). Astro prefissa
// da solo quello che passa dalla sua pipeline (/_astro/, url() nel CSS), non gli
// href scritti nel codice né quelli che arrivano da Sanity. A fine build, se la
// base non è '/', si riscrivono gli attributi href/src/action che iniziano con
// '/' in tutto l'HTML di dist/ (e i link <a> assoluti verso il sito stesso,
// che un contenuto può contenere), poi una guardia fa fallire la build se un
// link porta ancora fuori dalla base. L'unica eccezione voluta è un tag marcato
// `data-versione-a` (il rimando alla versione pubblicata).
import type { AstroIntegration } from 'astro';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ECCEZIONE = 'data-versione-a';
const TAG = /<[a-zA-Z][^>]*>/g;
const LINK = /^<a\s/i;

async function* html(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* html(path);
    else if (entry.name.endsWith('.html')) yield path;
  }
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function basePath(): AstroIntegration {
  let base = '/';
  let origin: string | undefined;
  return {
    name: 'base-path',
    hooks: {
      'astro:config:done': ({ config }) => {
        base = config.base.replace(/\/$/, '') || '/';
        origin = config.site ? new URL(config.site).origin : undefined;
      },
      'astro:build:done': async ({ dir, logger }) => {
        if (base === '/') return;
        const root = fileURLToPath(dir);
        const b = escape(base.slice(1));
        // '/x' → '/b/x', '/' → '/b/'; lascia stare '//host' e ciò che è già sotto la base.
        const daPrefissare = new RegExp(`(\\s(?:href|src|action)=["'])/(?!/|${b}(?:[/"'?#]))`, 'g');
        const radice = new RegExp(`\\s(?:href|src|action)=["'](/(?!/|${b}(?:[/"'?#]))[^"']*)`, 'g');
        const assoluto = origin
          ? new RegExp(`\\shref=["']${escape(origin)}(/(?!${b}(?:[/"'?#]))[^"']*)`, 'g')
          : undefined;
        const assolutoDaPrefissare = origin
          ? new RegExp(`(\\shref=["']${escape(origin)})/(?!${b}(?:[/"'?#]))`, 'g')
          : undefined;

        const fuori: string[] = [];
        let riscritti = 0;
        for await (const file of html(root)) {
          const prima = await readFile(file, 'utf8');
          const dopo = prima.replace(TAG, (tag) => {
            if (tag.includes(ECCEZIONE)) return tag;
            let t = tag.replace(daPrefissare, (_, attr) => (riscritti++, `${attr}${base}/`));
            if (assolutoDaPrefissare && LINK.test(t)) {
              t = t.replace(assolutoDaPrefissare, (_, attr) => (riscritti++, `${attr}${base}/`));
            }
            return t;
          });
          if (dopo !== prima) await writeFile(file, dopo);

          for (const tag of dopo.match(TAG) ?? []) {
            if (tag.includes(ECCEZIONE)) continue;
            for (const m of tag.matchAll(radice)) fuori.push(`${relative(root, file)}: ${m[1]}`);
            if (assoluto && LINK.test(tag)) {
              for (const m of tag.matchAll(assoluto)) fuori.push(`${relative(root, file)}: ${origin}${m[1]}`);
            }
          }
        }
        if (fuori.length) {
          throw new Error(`link che escono da ${base}/ nell'output della build:\n  ${fuori.join('\n  ')}`);
        }
        logger.info(`${riscritti} percorsi interni prefissati con ${base}/; nessun link fuori da ${base}/`);
      },
    },
  };
}
