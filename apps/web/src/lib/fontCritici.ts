// Font critici dentro la pagina. Alla prima visita i font arrivano dopo il
// primo disegno e il testo in vista passa dal ripiego al font vero (il
// "flash"). Per le sezioni marcate con data-font-critici (l'hero della home)
// questa integrazione, a fine build, raccoglie i caratteri di quelle sezioni e
// dell'header, ritaglia i font su quei soli caratteri (pochi KB) e li scrive
// nella pagina come data: URI. Le facce aggiunte hanno gli stessi descrittori
// di quelle di styles/fonts.css e un unicode-range con i soli caratteri ritagliati:
// dichiarate dopo, vincono per quei caratteri, e il resto della pagina usa i
// file completi come prima.
import type { AstroIntegration } from 'astro';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';
import subsetFont from 'subset-font';

// Le facce che il testo in cima alla home usa davvero (misurato nel browser):
// League Spartan (titoli, menu, pulsanti; il menu anche in maiuscolo via CSS)
// e Clear Sans regolare (sottotitoli). League Spartan resta variabile e
// dichiarato 100 900 come in fonts.css: fissato a 700 e dichiarato 700 pesa
// ~5 KB in meno, ma con descrittori diversi il browser non compone le due
// facce e il titolo dell'hero compariva ~300 ms più tardi (LCP, Slow 4G).
const FACCE = [
  { family: 'League Spartan', file: 'league-spartan-latin.woff2', weight: '100 900', maiuscole: true },
  { family: 'Clear Sans', file: 'clear-sans-latin-400.woff2', weight: '400' },
];

async function paginaHtml(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true, recursive: true })) {
    if (e.isFile() && e.name.endsWith('.html')) out.push(join(e.parentPath, e.name));
  }
  return out;
}

/** Testo delle sezioni critiche e dell'header, o nulla se la pagina non ne ha. */
function testoCritico(html: string): string | undefined {
  const root = parse(html);
  const sezioni = root.querySelectorAll('[data-font-critici]');
  if (!sezioni.length) return undefined;
  return [...sezioni, ...root.querySelectorAll('header')]
    .map((el) => {
      el.querySelectorAll('style, script, noscript').forEach((n) => n.remove());
      return el.textContent;
    })
    .join(' ');
}

/** Caratteri distinti del testo, spazio compreso, senza gli altri spazi bianchi. */
const caratteri = (testo: string) => [...new Set([...testo].filter((c) => c === ' ' || c.trim()))].sort().join('');

const unicodeRange = (chars: string) =>
  [...chars].map((c) => `U+${c.codePointAt(0)!.toString(16).toUpperCase()}`).join(', ');

export function fontCritici(): AstroIntegration {
  let fontDir = '';
  return {
    name: 'font-critici',
    hooks: {
      'astro:config:done': ({ config }) => {
        fontDir = join(fileURLToPath(config.publicDir), 'fonts');
      },
      'astro:build:done': async ({ dir, logger }) => {
        const sorgenti = new Map(
          await Promise.all(FACCE.map(async (f) => [f.file, await readFile(join(fontDir, f.file))] as const)),
        );
        for (const file of await paginaHtml(fileURLToPath(dir))) {
          const html = await readFile(file, 'utf8');
          const testo = testoCritico(html);
          if (!testo) continue;
          const regole = await Promise.all(
            FACCE.map(async (f) => {
              // Il menu è in maiuscolo solo via CSS: l'HTML non lo dice.
              const chars = caratteri(f.maiuscole ? testo + testo.toUpperCase() : testo);
              const woff2 = await subsetFont(sorgenti.get(f.file)!, chars, { targetFormat: 'woff2' });
              return (
                `@font-face{font-family:"${f.family}";font-style:normal;font-weight:${f.weight};font-display:swap;` +
                `src:url(data:font/woff2;base64,${woff2.toString('base64')}) format("woff2");` +
                `unicode-range:${unicodeRange(chars)}}`
              );
            }),
          );
          const style = `<style data-font-critici>${regole.join('')}</style>`;
          await writeFile(file, html.replace('</head>', `${style}</head>`));
          logger.info(`${file.slice(fileURLToPath(dir).length)}: ${(style.length / 1024).toFixed(1)} KB di font nella pagina`);
        }
      },
    },
  };
}
