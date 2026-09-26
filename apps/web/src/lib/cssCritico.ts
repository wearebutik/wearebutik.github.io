// CSS critico nella pagina, il resto in file esterni. Astro scrive il CSS in
// file (/_astro/*.css, `inlineStylesheets: 'never'`); a fine build, per ogni
// pagina, beasties lascia nella pagina solo le regole che corrispondono a un
// elemento dell'HTML e carica i file completi senza bloccare il disegno
// (media=print → all al load). I file restano interi: la seconda pagina, o
// quella precaricata, trova in cache il CSS condiviso da tutte (token, reset,
// header, footer, prose) invece di riceverlo di nuovo dentro l'HTML.
import type { AstroIntegration } from 'astro';
import Beasties from 'beasties';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Regole di stati che l'HTML statico non contiene: attributi e classi che gli
// script aggiungono a runtime (foto arrivata, header allo scroll, entrate,
// pausa del loop, carosello, filtri) e il menu mobile aperto (<details open>).
// Senza di loro nel CSS critico un elemento resterebbe nel suo stato iniziale
// — anche nascosto — finché non arriva il file completo. data-astro-cid-* no: è lo scoping di Astro, già
// presente nell'HTML.
const STATI = [/\[data-(?!astro-cid)/, /\[aria-/, /\[open\]/, /\.is-[a-z]/, /--(?:active|inactive)\b/, /\.hidden\b/, /\.text-butik-/];

async function pagineHtml(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true, recursive: true })) {
    if (e.isFile() && e.name.endsWith('.html')) out.push(join(e.parentPath, e.name));
  }
  return out;
}

export function cssCritico(): AstroIntegration {
  let base = '/';
  return {
    name: 'css-critico',
    hooks: {
      'astro:config:done': ({ config }) => {
        base = config.base.endsWith('/') ? config.base : `${config.base}/`;
      },
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const beasties = new Beasties({
          path: root,
          publicPath: base,
          preload: 'media',
          noscriptFallback: true,
          // Le <style> che Astro lascia nella pagina (keyframes generati,
          // stili is:inline) non si toccano: sono già solo di quella pagina.
          reduceInlineStyles: false,
          pruneSource: false,
          allowRules: STATI,
          fonts: true,
          keyframes: 'critical',
          logLevel: 'warn',
        });
        let prima = 0;
        let dopo = 0;
        for (const file of await pagineHtml(root)) {
          const html = await readFile(file, 'utf8');
          const out = await beasties.process(html);
          await writeFile(file, out);
          prima += html.length;
          dopo += out.length;
        }
        logger.info(`CSS critico nelle pagine: HTML ${Math.round(prima / 1024)} → ${Math.round(dopo / 1024)} KB in totale`);
      },
    },
  };
}
