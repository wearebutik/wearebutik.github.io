// Una tantum: toglie dai documenti pubblicati i valori dei campi che lo Studio
// non ha più (nello Studio comparirebbero come "campi sconosciuti"):
//   servizio  card.statValue, card.statLabel (statistica della card, mai
//             mostrata), audience (filtro di /servizi), order; card.desc e
//             orderRank (card e ordine passati nelle sezioni)
//   progetto  order, featuredOrder (sostituiti dall'ordine a trascinamento),
//             featured (progetti in evidenza scelti nel blocco della home)
//   pagina-servizi  filtri
//   pagina-home     i campi fissi, passati nella lista `sezioni`
//                   (home-a-sezioni), anche nella bozza se c'è
//   pagina-chi-siamo, pagina-servizi, pagina-progetti
//                   i campi fissi passati nelle `sezioni`
//                   (pagine-a-sezioni), anche nelle bozze; Servizi tiene il
//                   metodo
//
//   pnpm --filter @butik/studio pulizia-campi
//
// Da lanciare solo dopo che il sito senza questi campi è online: la versione
// precedente del sito li richiede ancora in build. E dopo `ordine-iniziale`,
// che legge `order`. Idempotente: unset di un campo assente non fa nulla.
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2026-09-01', perspective: 'raw' });

const daTogliere: { filtro: string; campi: string[] }[] = [
  // card.desc e orderRank: le card sono nel blocco Hero, l'ordine nel blocco
  // Elenco dei servizi (card-e-elenco-servizi).
  { filtro: '_type == "servizio"', campi: ['card.statValue', 'card.statLabel', 'card.desc', 'audience', 'order', 'orderRank'] },
  // featured: i progetti in evidenza sono nel blocco della home (progetti-in-evidenza).
  { filtro: '_type == "progetto"', campi: ['order', 'featuredOrder', 'featured'] },
  { filtro: '_id == "pagina-servizi"', campi: ['filtri'] },
  // Il banner a biglietto (PDR-0006) ha le preferenze dentro di sé: niente
  // titolo, pulsanti e tabella della finestra separata.
  {
    filtro: '_id in ["pagina-banner-cookie", "drafts.pagina-banner-cookie"]',
    campi: ['preferenzeTitolo', 'accettaTutti', 'rifiutaTutti', 'colonnaCookie', 'colonnaDurata', 'colonnaDescrizione', 'informazioniTitolo'],
  },
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
  {
    filtro: '_id in ["pagina-chi-siamo", "drafts.pagina-chi-siamo"]',
    campi: [
      'heroTitle', 'heroSubtitle', 'heroImage', 'heroImageAlt',
      'introEyebrow', 'introP1', 'introP2', 'introP3', 'introP4',
      'missionEyebrow', 'missionStatement', 'sdgEyebrow', 'sdgIntro', 'sdg', 'sdgObiettivoLabel',
      'teamEyebrow', 'teamP1', 'teamP2', 'teamP3', 'founders', 'linkedinLabel',
      'testimonialQuote', 'testimonialAuthor', 'ctaTitle', 'ctaBody', 'ctaLabel', 'ctaHref',
    ],
  },
  {
    filtro: '_id in ["pagina-servizi", "drafts.pagina-servizi"]',
    campi: [
      'headerEyebrow', 'headerTitle', 'headerIntro1', 'headerIntro2',
      'ctaTitle', 'ctaPrimaryLabel', 'ctaPrimaryHref', 'ctaSecondaryLabel', 'ctaSecondaryHref',
    ],
  },
  {
    filtro: '_id in ["pagina-progetti", "drafts.pagina-progetti"]',
    // clienteLabel del blocco: l'etichetta ora è di ciascun progetto.
    campi: ['eyebrow', 'title', 'clienteLabel', 'sezioni[_type=="sezioneElencoProgetti"].clienteLabel'],
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
