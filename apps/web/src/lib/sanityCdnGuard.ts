// Guardia di build: il sito pubblicato non contiene mai un URL di cdn.sanity.io
// (ADR-0004). Le immagini da Sanity passano dalla pipeline di Astro e sono
// servite da /_astro/; un URL della CDN nell'output vorrebbe dire traffico
// pubblico sulla quota di banda del piano Free, che se superata blocca il
// progetto. A fine build si scansiona dist/ e, se il dominio compare, la build
// fallisce indicando i file.
import type { AstroIntegration } from 'astro';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOMAIN = 'cdn.sanity.io';
// Solo file di testo: le immagini non possono contenere un URL da servire.
const TEXT = new Set(['.html', '.xml', '.txt', '.json', '.js', '.mjs', '.css', '.svg', '.webmanifest']);

async function* files(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else yield path;
  }
}

export function sanityCdnGuard(): AstroIntegration {
  return {
    name: 'sanity-cdn-guard',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const hits: string[] = [];
        for await (const file of files(root)) {
          if (!TEXT.has(extname(file))) continue;
          if ((await readFile(file, 'utf8')).includes(DOMAIN)) hits.push(relative(root, file));
        }
        if (hits.length) {
          throw new Error(
            `${DOMAIN} compare nell'output della build (ADR-0004: le immagini da Sanity ` +
              `passano da getImage/<Image> e sono servite da /_astro/):\n  ${hits.join('\n  ')}`,
          );
        }
        logger.info(`nessun URL ${DOMAIN} nell'output`);
      },
    },
  };
}
