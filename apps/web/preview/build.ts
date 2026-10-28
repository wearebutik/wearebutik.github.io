// Build dell'anteprima nel Service Worker, in dist-preview/client:
// - il sito compilato per il server (BUTIK_ANTEPRIMA=1) e impacchettato per il
//   browser in _astro/preview.<hash>.js, minificato e con l'hash nel nome, che
//   la cache HTTP tiene per sempre;
// - sw.js, poche righe che importano quel file: il browser lo riscarica a ogni
//   controllo e, quando cambia l'hash, installa il worker nuovo;
// - index.html, la pagina che registra il worker, e robots.txt, che tiene
//   l'anteprima fuori dai motori di ricerca come il noindex di _headers;
// - _headers, per Cloudflare Pages: la cache dei file e il noindex (l'anteprima
//   non va nei motori di ricerca).
import { createHash } from 'node:crypto';
import { $ } from 'bun';

const web = new URL('../', import.meta.url).pathname;
const client = `${web}dist-preview/client/`;
const version = (await $`git rev-parse --short HEAD`.cwd(web).text()).trim();

await $`pnpm exec astro build`.cwd(web).env({ ...process.env, BUTIK_ANTEPRIMA: '1' });

const build = await Bun.build({
  entrypoints: [new URL('./worker.ts', import.meta.url).pathname],
  target: 'browser',
  format: 'iife',
  minify: true,
  // Il codice di Astro legge process.env, che nel worker non c'è.
  banner: 'self.process ??= { env: {} };',
  define: { __VERSION__: JSON.stringify(version) },
});
if (!build.success) throw new AggregateError(build.logs, 'build del worker non riuscita');
const preview = await build.outputs[0].text();
const nome = `_astro/preview.${createHash('sha256').update(preview).digest('hex').slice(0, 10)}.js`;

await Bun.write(client + nome, preview);
await Bun.write(`${client}sw.js`, `importScripts('/${nome}');\n`);
await Bun.write(`${client}index.html`, Bun.file(new URL('./index.html', import.meta.url)));
await Bun.write(`${client}robots.txt`, 'User-agent: *\nDisallow: /\n');
await Bun.write(
  `${client}_headers`,
  `/*\n  X-Robots-Tag: noindex\n/sw.js\n  Cache-Control: no-cache\n/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n`,
);
console.log(`${nome} (${(preview.length / 1024).toFixed(0)} KB), versione ${version}`);
