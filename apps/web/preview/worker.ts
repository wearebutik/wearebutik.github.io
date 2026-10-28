// Service Worker dell'anteprima delle bozze (ADR-0004, Draft preview): ogni
// pagina del sito la renderizza qui, nel browser. I file statici passano alla
// rete.
/// <reference lib="webworker" />
import { render } from '../dist-preview/server/entry.mjs';
import { gestisci, html, prospettiva, sessione, type Sessione } from './session';

declare const self: ServiceWorkerGlobalScope;
// La versione del codice (commit), messa da build.ts e letta su /_version.
declare const __VERSION__: string;

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

// Nelle pagine aperte nello Studio (scheda Anteprima web): la pagina chiede il
// token alla finestra dello Studio, che risponde solo a questa origine
// (apps/studio/anteprimaWeb.tsx), e lo passa al worker. Un token rifiutato
// (chi non è nel progetto) lascia il messaggio nella pagina.
const script = `<script>(() => {
  if (window.parent === window) return;
  addEventListener('message', (e) => {
    if (e.source !== window.parent || e.data?.type !== 'butik-preview/token' || !e.data.token) return;
    fetch('/_token', { method: 'POST', body: e.data.token }).then(async (r) => {
      if (r.status === 201) location.reload();
      else if (!r.ok) document.getElementById('butik-attesa')?.replaceChildren(await r.text());
    });
  });
  window.parent.postMessage({ type: 'butik-preview/token-request' }, '*');
})();</script>`;

// Il ClientRouter di Astro cambia pagina con fetch, non con una navigazione,
// e Chrome cerca un worker nuovo solo alle navigazioni: lo chiede la pagina a
// ogni cambio, una volta per scheda.
const aggiorna = `<script>(() => {
  if (window.__butikAggiorna) return;
  window.__butikAggiorna = true;
  document.addEventListener('astro:page-load', () => navigator.serviceWorker.getRegistration().then((r) => r?.update()));
})();</script>`;

const angolo = (s: Sessione) =>
  `<div style="position:fixed;left:8px;bottom:8px;z-index:2147483647;font:12px system-ui;background:#111;color:#fff;padding:4px 8px;border-radius:4px">Bozze di ${s.nome}${
    s.nostra ? ' · <a href="/_logout" style="color:inherit">esci</a>' : ''
  }</div>`;

// Il sito si vede solo con una sessione Sanity di un membro del progetto
// (session.ts). Senza: in una scheda, la pagina di login; nello Studio
// (iframe), l'attesa del token che lo Studio passa; per ogni altra richiesta
// (le pagine che il router di Astro scarica in anticipo), un 401.
async function senzaSessione(request: Request) {
  if (request.destination === 'document') return Response.redirect(new URL('/_login', request.url).href, 303);
  if (request.destination === 'iframe') {
    return html(`<h1>Anteprima delle bozze</h1><p id="butik-attesa">In attesa della sessione dello Studio…</p>${script}`);
  }
  return new Response('Accedi a Sanity per vedere l’anteprima.', { status: 401 });
}

async function pagina(request: Request) {
  const s = await sessione();
  if (!s) return senzaSessione(request);
  const risposta = await render(request, s.token, await prospettiva());
  if (!risposta.headers.get('Content-Type')?.includes('text/html')) return risposta;
  const testo = (await risposta.text()).replace(/<\/body>/i, `${angolo(s)}${script}${aggiorna}</body>`);
  return new Response(testo, { status: risposta.status, headers: risposta.headers });
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname === '/_version') return e.respondWith(new Response(__VERSION__));
  if (['/_login', '/_callback', '/_logout', '/_token', '/_perspective'].includes(url.pathname)) {
    return e.respondWith(gestisci(e.request).then((r) => r ?? new Response(null, { status: 404 })));
  }
  if (e.request.method !== 'GET') return;
  // Alla rete: i file statici (gli stessi del sito pubblico), il worker stesso
  // e gli indirizzi di Cloudflare (/cdn-cgi/…).
  if (/^\/(_astro|cdn-cgi)\//.test(url.pathname) || url.pathname === '/sw.js' || /\.[a-z0-9]+$/i.test(url.pathname)) return;
  e.respondWith(
    pagina(e.request).catch((err) => new Response(`errore nel Service Worker: ${err?.stack ?? err}`, { status: 500 })),
  );
});
