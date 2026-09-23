import type { CollectionEntry } from 'astro:content';

/** Testi degli hero A/B/C di un servizio (campo `hero` del documento Sanity). */
export type ServiceHeroContent = NonNullable<CollectionEntry<'servizi'>['data']['hero']>;
