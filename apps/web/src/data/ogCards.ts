// Fonte unica delle card Open Graph generate a build-time.
// Mappa "rotta della pagina" → dati della card. La usano DUE consumatori:
//   1. l'endpoint /og/[...path].png.ts → genera le PNG (una per rotta)
//   2. BaseLayout.astro → emette il <meta og:image> verso la PNG giusta
// Tenendo qui l'unica sorgente, non serve cablare nulla sulle singole pagine:
// progetti e servizi arrivano dalle loro collection, le pagine dalla «Card di
// condivisione» della loro tab SEO nello Studio (sottotitolo = meta
// description). Una pagina senza la card completa ricade sul logo.
import { getCollection } from 'astro:content';
import { pagineNonVisibili, progettiVisibili, serviziConScheda } from '#lib/pubblicazione';

export interface OgCard {
  kind: string;        // eyebrow: tipo/categoria mostrato in alto
  title: string;
  subtitle: string;
  meta?: string[];     // metadati (progetti: cliente · anno)
  cta: string;         // call-to-action scelta dalla pagina
  layout?: 'plain' | 'home' | 'bleed'; // default plain
  hero?: string;       // URL dell'immagine hero (layout bleed)
}

// Handle mostrato in basso nella card (profilo Instagram).
export const CARD_HANDLE = '@wearebutik';

// CTA di default per tipo (le singole pagine possono sovrascriverle: i
// progetti/servizi via campo `ogCta` nel frontmatter, le statiche qui sotto).
const CTA_PROGETTO = 'Scopri il progetto';
const CTA_SERVIZIO = 'Richiedi una consulenza';

/** Mappa completa rotta → card: pagine, progetti e servizi. */
export async function getAllOgCards(): Promise<Map<string, OgCard>> {
  const map = new Map<string, OgCard>();

  const nonVisibili = new Set(await pagineNonVisibili());
  for (const e of await getCollection('pagine')) {
    const route = e.id === 'home' ? '/' : `/${e.id}`;
    const card = e.data.ogCard;
    if (!card?.title || !card.eyebrow || !card.cta || nonVisibili.has(route)) continue;
    map.set(route, {
      kind: card.eyebrow,
      title: card.title,
      subtitle: e.data.metaDescription,
      cta: card.cta,
      // La home ha il suo impianto grafico (lib/og/render.ts).
      layout: e.id === 'home' ? 'home' : 'plain',
    });
  }

  const progetti = await progettiVisibili();
  for (const e of progetti) {
    const meta = [e.data.client, e.data.year ? String(e.data.year) : null].filter(
      (x): x is string => Boolean(x),
    );
    map.set(`/progetti/${e.id}`, {
      kind: e.data.category ? `Progetto · ${e.data.category}` : 'Progetto',
      title: e.data.title,
      subtitle: e.data.subtitle,
      meta: meta.length ? meta : undefined,
      cta: e.data.ogCta ?? CTA_PROGETTO,
      layout: 'bleed',
      hero: e.data.heroImage,
    });
  }

  const servizi = await serviziConScheda();
  for (const e of servizi) {
    map.set(`/servizi/${e.id}`, {
      kind: 'Servizio',
      title: e.data.title,
      subtitle: e.data.subtitle,
      cta: e.data.ogCta ?? CTA_SERVIZIO,
    });
  }

  return map;
}

/** '/' → 'index', '/progetti/x' → 'progetti/x' (parametro dell'endpoint). */
export function routeToParam(route: string): string {
  if (route === '/') return 'index';
  return route.replace(/^\//, '').replace(/\/$/, '');
}

/** Percorso del file PNG generato per una rotta. */
export function ogPngPathForRoute(route: string): string {
  return `/og/${routeToParam(route)}.png`;
}

/** Normalizza un pathname (toglie lo slash finale, tranne la root). */
export function normalizeRoute(pathname: string): string {
  return pathname === '/' ? '/' : pathname.replace(/\/$/, '');
}
