// Icone delle card nell'hero della home: lo Studio le offre come scelta, il
// sito ne disegna il glifo (apps/web/src/components/serviziCards/ServiceCard.astro).
// Un id nuovo va aggiunto qui e lì: il tipo IconaCard fa fallire il build del
// sito se manca il disegno.
export const ICONE_CARD = [
  { id: 'stella', title: 'Stella (raggi)' },
  { id: 'bussola', title: 'Bussola' },
  { id: 'tocco', title: 'Tocco (cappello di laurea)' },
  { id: 'equalizzatore', title: 'Equalizzatore' },
  { id: 'luogo', title: 'Luogo (segnaposto sulla mappa)' },
] as const;

export type IconaCard = (typeof ICONE_CARD)[number]['id'];
