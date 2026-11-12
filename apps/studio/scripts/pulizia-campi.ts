// Una tantum: toglie dai documenti pubblicati i valori dei campi che lo Studio
// non ha più (nello Studio comparirebbero come "campi sconosciuti"):
//   servizio  card.statValue, card.statLabel (statistica della card, mai
//             mostrata), audience (filtro di /servizi), order
//   progetto  order, featuredOrder (sostituiti dall'ordine a trascinamento)
//   pagina-servizi  filtri
//   pagina-home     i campi fissi, passati nella lista `sezioni`
//                   (home-a-sezioni), anche nella bozza se c'è
//
//   pnpm --filter @butik/studio pulizia-campi
//
// Da lanciare solo dopo che il sito senza questi campi è online: la versione
// precedente del sito li richiede ancora in build. E dopo `ordine-iniziale`,
// che legge `order`. Idempotente: unset di un campo assente non fa nulla.
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2026-09-01', perspective: 'raw' });

const daTogliere: { filtro: string; campi: string[] }[] = [
  { filtro: '_type == "servizio"', campi: ['card.statValue', 'card.statLabel', 'audience', 'order'] },
  { filtro: '_type == "progetto"', campi: ['order', 'featuredOrder'] },
  { filtro: '_id == "pagina-servizi"', campi: ['filtri'] },
  {
    filtro: '_id in ["pagina-home", "drafts.pagina-home"]',
    campi: [
      'heroTitle', 'heroSubtitle', 'heroCtaLabel', 'heroCtaHref', 'heroExploreLabel', 'heroExploreHref', 'heroImages',
      'butikMetrics', 'mmwLabel', 'mmwMetrics',
      'ctaBanner1Title', 'ctaBanner1Body', 'ctaBanner1PrimaryLabel', 'ctaBanner1PrimaryHref', 'ctaBanner1SecondaryLabel', 'ctaBanner1SecondaryHref',
      'aboutTitle', 'aboutP1', 'aboutP2', 'aboutP3', 'aboutCtaLabel', 'aboutCtaHref', 'aboutImage', 'aboutImageAlt',
      'ctaBanner2Hidden', 'ctaBanner2Title', 'ctaBanner2PrimaryLabel', 'ctaBanner2PrimaryHref', 'ctaBanner2SecondaryLabel', 'ctaBanner2SecondaryHref',
      'newsletterHidden', 'newsletterTitle', 'newsletterBody', 'newsletterPlaceholder', 'newsletterButton', 'newsletterPrivacy', 'newsletterSuccess',
    ],
  },
];

const tx = client.transaction();
for (const { filtro, campi } of daTogliere) {
  // Solo i pubblicati, salvo dove il filtro nomina una bozza.
  const soloPubblicati = filtro.includes('drafts.') ? '' : ' && !(_id in path("drafts.**"))';
  const ids = await client.fetch<string[]>(`*[${filtro}${soloPubblicati}]._id`);
  for (const id of ids) tx.patch(id, (p) => p.unset(campi));
  console.log(`${filtro}: ${ids.length} documenti, via ${campi.join(', ')}`);
}
await tx.commit();
