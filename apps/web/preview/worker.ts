// Service Worker dell'anteprima: ogni pagina del sito la renderizza qui,
// nel browser, lo stesso server del binario. I file statici passano alla rete.
/// <reference lib="webworker" />
import { render } from '../dist-preview/server/entry.mjs';
import { gestisci, sessione, type Sessione } from './session';

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

// In fondo a ogni pagina: il token che lo Studio passa nell'indirizzo
// (#token=…, sanity.config.ts) va al worker e sparisce dall'indirizzo; in un
// angolo, con chi si stanno leggendo le bozze. index.html tiene il token in
// sessionStorage se la pagina si apre prima che il worker ci sia.
const script = `<script>(() => {
  const t = new URLSearchParams(location.hash.slice(1)).get('token') ?? sessionStorage.getItem('butik-token');
  if (!t) return;
  sessionStorage.removeItem('butik-token');
  if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
  fetch('/_token', { method: 'POST', body: t }).then((r) => r.status === 201 && location.reload());
})();</script>`;

const angolo = (s: Sessione | undefined) =>
  `<div style="position:fixed;left:8px;bottom:8px;z-index:2147483647;font:12px system-ui;background:#111;color:#fff;padding:4px 8px;border-radius:4px">${
    s
      ? `Bozze di ${s.nome}${s.nostra ? ' · <a href="/_logout" style="color:inherit">esci</a>' : ''}`
      : 'Contenuti pubblicati · <a href="/_login" style="color:inherit">accedi per le bozze</a>'
  }</div>`;

async function pagina(request: Request) {
  const s = await sessione();
  const risposta = await render(request, s?.token);
  if (!risposta.headers.get('Content-Type')?.includes('text/html')) return risposta;
  const testo = (await risposta.text()).replace(/<\/body>/i, `${angolo(s)}${script}</body>`);
  return new Response(testo, { status: risposta.status, headers: risposta.headers });
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname === '/_version') return e.respondWith(new Response(__VERSION__));
  if (url.pathname === '/_log') return e.respondWith(new Response(log.join('\n')));
  if (['/_login', '/_callback', '/_logout', '/_token'].includes(url.pathname)) {
    return e.respondWith(gestisci(e.request).then((r) => r ?? new Response(null, { status: 404 })));
  }
  if (e.request.method !== 'GET') return;
  if (url.pathname.startsWith('/_astro/') || url.pathname === '/sw.js' || /\.[a-z0-9]+$/i.test(url.pathname)) return;
  e.respondWith(
    pagina(e.request).catch((err) => new Response(`errore nel Service Worker: ${err?.stack ?? err}`, { status: 500 })),
  );
});
