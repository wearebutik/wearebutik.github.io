// Reti social che il footer sa mostrare: lo Studio le offre come scelta, lo
// schema Zod del sito rifiuta le altre, e il sito ha un'icona per ciascuna
// (apps/web/src/data/socials.ts).
export const RETI_SOCIAL = ['facebook', 'instagram', 'linkedin', 'youtube', 'spotify', 'tiktok'] as const;

export type ReteSocial = (typeof RETI_SOCIAL)[number];
