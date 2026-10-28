// Service Worker dell'anteprima: ogni pagina del sito la renderizza qui,
// nel browser, lo stesso server del binario. I file statici passano alla rete.
/// <reference lib="webworker" />
import { render } from '../dist-preview/server/entry.mjs';

declare const self: ServiceWorkerGlobalScope;
// La versione del codice (commit), messa da build.ts e letta su /_version.
declare const __VERSION__: string;

// Prova: quello che il worker scrive in console, leggibile su /_log.
const log: string[] = [];
for (const livello of ['error', 'warn', 'log'] as const) {
  const originale = console[livello].bind(console);
  console[livello] = (...a: unknown[]) => {
    log.push(`[${livello}] ${a.map((x) => (x instanceof Error ? x.stack : typeof x === 'string' ? x : JSON.stringify(x))).join(' ')}`);
    originale(...a);
  };
}

self.addEventListener('install', () => self.skipWaiting());
// Un worker nuovo prende subito le schede aperte e le ricarica: le pagine
// renderizzate dal vecchio puntano a CSS e JS che il deploy ha tolto.
self.addEventListener('activate', (e) =>
  e.waitUntil(
    self.clients.claim().then(async () => {
      for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url);
    }),
  ),
);

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.pathname === '/_version') return e.respondWith(new Response(__VERSION__));
  if (url.pathname === '/_log') return e.respondWith(new Response(log.join('\n')));
  if (url.origin !== location.origin || e.request.method !== 'GET') return;
  if (url.pathname.startsWith('/_astro/') || url.pathname === '/sw.js' || /\.[a-z0-9]+$/i.test(url.pathname)) return;
  e.respondWith(
    render(e.request).catch((err) => new Response(`errore nel Service Worker: ${err?.stack ?? err}`, { status: 500 })),
  );
});
