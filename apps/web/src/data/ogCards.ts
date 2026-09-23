// Fonte unica delle card Open Graph generate a build-time.
// Mappa "rotta della pagina" → dati della card. La usano DUE consumatori:
//   1. l'endpoint /og/[...path].png.ts → genera le PNG (una per rotta)
//   2. BaseLayout.astro → emette il <meta og:image> verso la PNG giusta
// Tenendo qui l'unica sorgente, non serve cablare nulla sulle singole pagine:
// progetti e servizi arrivano dalle collection, le pagine statiche dalla
// mappa qui sotto. Una pagina non elencata ricade sul logo (nessun link rotto).
import { getCollection } from 'astro:content';

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

// Pagine statiche (non-collection): card OG curate a mano.
const staticCards: Record<string, OgCard> = {
  '/': {
    kind: 'Butik · Impresa sociale',
    title: 'Cultura e territori attraverso la musica',
    subtitle:
      'La prima impresa sociale italiana specializzata in progettazione culturale e sviluppo territoriale attraverso la musica.',
    cta: 'Parliamone',
    layout: 'home',
  },
  '/chi-siamo': {
    kind: 'Chi siamo',
    title: 'Un team di professioniste della musica',
    subtitle:
      'Abbiamo fatto della musica uno strumento concreto di sviluppo culturale, sociale e territoriale.',
    cta: 'Conosci il team',
  },
  '/contatti': {
    kind: 'Contatti',
    title: 'Costruiamo qualcosa insieme',
    subtitle:
      'Comune, DMO, operatore culturale o festival: scrivici e mettiamo a terra il prossimo progetto.',
    cta: 'Scrivici',
  },
};

/** Mappa completa rotta → card, unendo statiche + collection. */
export async function getAllOgCards(): Promise<Map<string, OgCard>> {
  const map = new Map<string, OgCard>();
  for (const [route, card] of Object.entries(staticCards)) map.set(route, card);

  const progetti = await getCollection('progetti', (e) => !e.data.draft);
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

  const servizi = await getCollection('servizi', (e) => !e.data.draft);
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
