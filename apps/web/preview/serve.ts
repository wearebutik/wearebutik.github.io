// Server statico per provare in locale l'anteprima nel Service Worker, come la
// servirebbe Cloudflare Pages: i file di dist-preview/client con la cache di
// _headers e, per ogni altro indirizzo, index.html.
const radice = new URL('../dist-preview/client/', import.meta.url).pathname;

function cache(percorso: string) {
  if (percorso === '/sw.js') return 'no-cache';
  if (percorso.startsWith('/_astro/')) return 'public, max-age=31536000, immutable';
}

Bun.serve({
  port: Number(process.env.PORT ?? 4322),
  async fetch(req) {
    const percorso = decodeURIComponent(new URL(req.url).pathname);
    console.log(req.method, percorso);
    const file = Bun.file(radice + percorso.replace(/^\/+/, ''));
    if (!percorso.endsWith('/') && percorso !== '/_headers' && (await file.exists())) {
      const c = cache(percorso);
      return new Response(file, { headers: c ? { 'Cache-Control': c } : {} });
    }
    if (percorso.startsWith('/_astro/')) return new Response('non trovato', { status: 404 });
    return new Response(Bun.file(`${radice}index.html`), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  },
});
console.log(`Prova dell'anteprima nel Service Worker su http://localhost:${process.env.PORT ?? 4322}`);
