// Integrazione e adapter del build dell'anteprima delle bozze
// (astro.config.mjs): le pagine del sito leggono `astro:content` dal
// sostituto di contenuti.ts e i pacchetti nativi da stub.ts, senza toccare il
// codice delle pagine; il server è server.ts.
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';

const qui = (f: string) => fileURLToPath(new URL(f, import.meta.url));

const NATIVI = new Set(['sharp', 'satori', '@resvg/resvg-js']);

export function bozze(): AstroIntegration {
  const contenuti = qui('./contenuti.ts');
  const stub = qui('./stub.ts');
  return {
    name: 'butik-anteprima-bozze',
    hooks: {
      'astro:config:setup': ({ updateConfig, config }) => {
        const src = fileURLToPath(config.srcDir);
        updateConfig({
          // Le foto passano da /_image, che le richiede al binario stesso
          // (locali) o alla CDN Sanity (remote), senza trasformarle.
          image: { endpoint: { route: '/_image', entrypoint: 'astro/assets/endpoint/generic' } },
          vite: {
            plugins: [
              {
                name: 'butik-anteprima-sostituti',
                enforce: 'pre',
                // `astro:content` lo risolve un plugin di Astro che viene
                // prima di questo: l'import si riscrive nel sorgente.
                transform(codice, id) {
                  if (!id.startsWith(src) || !codice.includes('astro:content')) return null;
                  return codice.replace(/(['"])astro:content\1/g, JSON.stringify(contenuti));
                },
                resolveId(id, importer) {
                  return importer?.startsWith(src) && NATIVI.has(id) ? stub : null;
                },
              },
            ],
          },
        });
      },
      'astro:config:done': ({ setAdapter }) => {
        setAdapter({
          name: 'butik-anteprima',
          entrypointResolution: 'auto',
          serverEntrypoint: qui('./server.ts'),
          adapterFeatures: { buildOutput: 'server' },
          supportedAstroFeatures: { serverOutput: 'stable', staticOutput: 'stable', hybridOutput: 'stable' },
        });
      },
    },
  };
}
