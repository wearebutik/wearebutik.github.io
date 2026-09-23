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

const PROGETTI_QUERY = /* groq */ `*[_type == "progetto" && defined(slug.current) && draft != true]{
  "id": slug.current,
  _updatedAt,
  title, subtitle, heroImage, heroAlt, client, year, category,
  metaTitle, metaDescription, ogImage, ogCta,
  order, featured, featuredOrder, draft,
  body
}`;

/** Loader della content layer: un'entry per documento `progetto`, id = slug. */
export function progettiLoader(): Loader {
  return {
    name: 'sanity-progetti',
    load: async ({ store, parseData, generateDigest, logger }) => {
      const docs = await sanity.fetch<Array<Record<string, unknown> & { id: string }>>(PROGETTI_QUERY);
      store.clear();
      for (const { id, _updatedAt, heroImage, ogImage, ...rest } of docs) {
        const data = await parseData({
          id,
          data: {
            // GROQ restituisce null per i campi vuoti; Zod `.optional()` vuole undefined
            ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== null)),
            heroImage: heroImage ? sanityImageUrl(heroImage as SanityImage) : undefined,
            ogImage: ogImage ? sanityImageUrl(ogImage as SanityImage) : undefined,
          },
        });
        store.set({ id, data, digest: generateDigest(String(_updatedAt)) });
      }
      logger.info(`${docs.length} progetti da Sanity`);
    },
  };
}
