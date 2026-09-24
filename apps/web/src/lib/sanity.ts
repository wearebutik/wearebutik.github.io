// Sanity come sorgente della collection `progetti`. Si legge solo a build
// time: il sito resta statico e le immagini vengono scaricate e ottimizzate da
// Astro (vedi `image.domains` in astro.config.mjs), non servite dalla CDN.
import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import type { Loader } from 'astro/loaders';

// Il projectId non è un segreto: è nell'URL di ogni asset pubblico.
export const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID ?? 'uvzsc0vv';
export const SANITY_DATASET = process.env.SANITY_DATASET ?? 'production';

export const sanity = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: '2026-09-01',
  useCdn: false, // a build time vogliamo i contenuti appena pubblicati
  perspective: 'published',
});

const builder = createImageUrlBuilder({ projectId: SANITY_PROJECT_ID, dataset: SANITY_DATASET });

/** Riferimento immagine Sanity (`{ asset: { _ref } }`, con crop/hotspot opzionali). */
export type SanityImage = Parameters<typeof builder.image>[0];

/** URL dell'originale, rispettando il crop impostato nello Studio. */
export function sanityImageUrl(image: SanityImage): string {
  return builder.image(image).url();
}

/** GROQ restituisce null per i campi vuoti; Zod `.optional()` vuole undefined. */
function withoutNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutNulls);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).filter(([, v]) => v !== null).map(([k, v]) => [k, withoutNulls(v)]),
    );
  }
  return value;
}

type Doc = Record<string, unknown> & { id: string; _updatedAt: string };

/**
 * Loader della content layer per un tipo di documento Sanity: un'entry per
 * documento, id = slug. `query` restituisce `id` e `_updatedAt`; `map` adatta
 * il documento allo schema Zod (es. immagini → URL, che Astro scarica in build).
 */
function sanityLoader(name: string, query: string, map: (doc: Doc) => Record<string, unknown>): Loader {
  return {
    name: `sanity-${name}`,
    load: async ({ store, parseData, generateDigest, logger }) => {
      const docs = await sanity.fetch<Doc[]>(query);
      store.clear();
      for (const doc of docs) {
        const { id, _updatedAt, ...rest } = withoutNulls(doc) as Doc;
        const data = await parseData({ id, data: map({ id, _updatedAt, ...rest }) });
        store.set({ id, data, digest: generateDigest(String(_updatedAt)) });
      }
      logger.info(`${docs.length} ${name} da Sanity`);
    },
  };
}

const imageUrl = (image: unknown) => (image ? sanityImageUrl(image as SanityImage) : undefined);

const PROGETTI_QUERY = /* groq */ `*[_type == "progetto" && defined(slug.current) && draft != true]{
  "id": slug.current,
  _updatedAt,
  title, subtitle, heroImage, heroAlt, client, year, category,
  metaTitle, metaDescription, ogImage, ogCta,
  order, featured, featuredOrder, draft,
  body
}`;

export const progettiLoader = () =>
  sanityLoader('progetti', PROGETTI_QUERY, ({ id, _updatedAt, heroImage, ogImage, ...rest }) => ({
    ...rest,
    heroImage: imageUrl(heroImage),
    ogImage: imageUrl(ogImage),
  }));

const SERVIZI_QUERY = /* groq */ `*[_type == "servizio" && defined(slug.current) && draft != true]{
  "id": slug.current,
  _updatedAt,
  title, subtitle, heroImage, heroAlt, heroVariant, audience,
  metaTitle, metaDescription, ogImage, ogCta,
  order, draft, hero, card, body
}`;

export const serviziLoader = () =>
  sanityLoader('servizi', SERVIZI_QUERY, ({ id, _updatedAt, heroImage, ogImage, audience, ...rest }) => ({
    ...rest,
    heroImage: imageUrl(heroImage),
    ogImage: imageUrl(ogImage),
    // Nello Studio è una lista di id; lo schema Zod (e /servizi) vuole { id }.
    audience: ((audience as string[] | undefined) ?? []).map((a) => ({ id: a })),
  }));

// Pagine: un documento fisso per pagina (_id `pagina-<id>`, ADR-0004). Il tipo
// Sanity diventa il discriminante `type` dello schema Zod `pagine`.
const PAGINE_TYPE: Record<string, string> = {
  paginaHome: 'home',
  paginaChiSiamo: 'chi-siamo',
  paginaContatti: 'contatti',
  paginaPartners: 'partners',
  paginaServizi: 'servizi-index',
  paginaProgetti: 'progetti-index',
  paginaTestimonials: 'testimonials',
  paginaPrivacy: 'privacy',
  paginaTermini: 'termini',
};

const PAGINE_QUERY = /* groq */ `*[_type in ${JSON.stringify(Object.keys(PAGINE_TYPE))} && _id match "pagina-*"]{
  ...,
  "id": string::split(_id, "pagina-")[1]
}`;

type ConImmagine = Record<string, unknown>;

export const pagineLoader = () =>
  sanityLoader('pagine', PAGINE_QUERY, ({ id, _updatedAt, _id, _type, _rev, _createdAt, ...rest }) => ({
    ...rest,
    type: PAGINE_TYPE[_type as string],
    ...(Array.isArray(rest.founders) && {
      founders: (rest.founders as ConImmagine[]).map((f) => ({ ...f, photo: imageUrl(f.photo) ?? '' })),
    }),
    ...(Array.isArray(rest.partners) && {
      partners: (rest.partners as ConImmagine[]).map((p) => ({ ...p, logo: imageUrl(p.logo) ?? '' })),
    }),
  }));
