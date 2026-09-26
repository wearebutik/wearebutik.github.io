// Link interni con la barra finale. Le pagine sono cartelle (servizi/index.html)
// e GitHub Pages risponde a /servizi con un 301 verso /servizi/: un giro di
// rete in più a ogni navigazione e a ogni prefetch, ~150 ms su una rete mobile
// lenta. I link sono scritti a mano nel codice e arrivano anche da Sanity (i
// CTA), quindi si correggono qui, a fine build: un <a href="/percorso"> che
// porta a una pagina esistente diventa "/percorso/". Gira dopo basePath, così
// sotto /b/ vede gli href già prefissati.
import type { AstroIntegration } from 'astro';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

async function pagineHtml(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true, recursive: true })) {
    if (e.isFile() && e.name.endsWith('.html')) out.push(join(e.parentPath, e.name));
  }
  return out;
}

const esiste = (p: string) => stat(p).then(() => true, () => false);

export function linkConBarra(): AstroIntegration {
  let base = '';
  return {
    name: 'link-con-barra',
    hooks: {
      'astro:config:done': ({ config }) => {
        base = config.base.replace(/\/$/, '');
      },
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const cartelle = new Map<string, boolean>();
        const pagina = async (percorso: string) => {
          if (!cartelle.has(percorso)) {
            const locale = base && percorso.startsWith(`${base}/`) ? percorso.slice(base.length) : percorso;
            cartelle.set(percorso, await esiste(join(root, locale, 'index.html')));
          }
          return cartelle.get(percorso)!;
        };
        let corretti = 0;
        for (const file of await pagineHtml(root)) {
          const html = await readFile(file, 'utf8');
          // href interni (non //host) senza barra finale né estensione; solo
          // l'attributo href, non data-href o xlink:href.
          const percorsi = new Set(
            [...html.matchAll(/<a\s(?:[^>]*?\s)?href="(\/(?!\/)[^"?#]*?[^/"?#])(?:[?#][^"]*)?"/g)].map((m) => m[1]),
          );
          let out = html;
          for (const percorso of percorsi) {
            if (/\.[a-z0-9]+$/i.test(percorso) || !(await pagina(percorso))) continue;
            const prima = out;
            out = out.replace(
              new RegExp(`(<a\\s(?:[^>]*?\\s)?href=")${percorso.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([?#"])`, 'g'),
              (_, prima: string, dopo: string) => `${prima}${percorso}/${dopo}`,
            );
            if (out !== prima) corretti++;
          }
          if (out !== html) await writeFile(file, out);
        }
        logger.info(`${corretti} link interni portati alla forma con la barra finale`);
      },
    },
  };
}
