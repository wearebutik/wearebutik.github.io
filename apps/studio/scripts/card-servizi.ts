// Una tantum: le card dell'Elenco dei servizi diventano contenuti a sé,
// separati dalla scheda del servizio. In ogni blocco Elenco dei servizi
// (pubblicato e bozza) scrive la lista `card` con i testi che la card mostra
// oggi dal servizio a cui punta:
//   ancora    lo slug del servizio (i link della home puntano a /servizi/#slug)
//   icona     quella del servizio, come nelle card della home
//   perChi    hero.eyebrow     title  card.title
//   desc      hero.sub (o il sottotitolo)    punti  hero.outcomes
//   link      spento, con destinazione /servizi/<slug> e testo «Scopri …»
//             già pronti per quando si accende
//
//   pnpm --filter @butik/studio card-servizi [--prova]
//
// Da lanciare PRIMA del merge: aggiunge `card` accanto ai riferimenti
// `servizi`, che il sito di oggi continua a leggere. Non tocca un blocco che
// ha già `card` (setIfMissing). Dopo il deploy `pulizia-campi` toglie i
// riferimenti `servizi` e il campo `card` dei servizi.
import { randomUUID } from 'node:crypto';
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2026-09-01', perspective: 'raw' });
const prova = process.argv.includes('--prova');

type Doc = Record<string, any>;
const key = () => randomUUID().slice(0, 12);

// L'icona di ogni servizio, la stessa delle card della home (card-e-elenco-servizi).
const ICONA: Record<string, string> = {
  'progettazione-culturale': 'stella',
  'consulenza-strategica': 'bussola',
  'formazione-capacity-building': 'tocco',
  'eventi-culturali-musicali': 'equalizzatore',
  'prodotti-turistico-musicali': 'luogo',
};

const servizi = new Map(
  (
    await client.fetch<Doc[]>(
      `*[_type == "servizio" && !(_id in path("drafts.**"))]{_id, "slug": slug.current, subtitle, card, hero}`,
    )
  ).map((s) => [s._id, s]),
);

const cardDa = (ref: string) => {
  const s = servizi.get(ref);
  if (!s) throw new Error(`servizio ${ref} non trovato`);
  const title = s.card?.title ?? s.title;
  return {
    _key: key(),
    _type: 'cardServizio',
    ancora: s.slug,
    icona: ICONA[s.slug] ?? 'stella',
    perChi: s.hero?.eyebrow,
    title,
    desc: s.hero?.sub ?? s.subtitle,
    punti: s.hero?.outcomes ?? [],
    mostraLink: false,
    href: `/servizi/${s.slug}`,
    linkLabel: `Scopri ${title}`,
  };
};

const pagine = await client.fetch<Doc[]>(
  `*[count(sezioni[_type == "sezioneElencoServizi"]) > 0]{_id, sezioni[_type == "sezioneElencoServizi"]{_key, "refs": servizi[]._ref, "haCard": defined(card)}}`,
);
const tx = client.transaction();
for (const p of pagine) {
  for (const s of p.sezioni) {
    if (s.haCard) {
      console.log(`${p._id}: Elenco dei servizi ha già le card, lo lascio`);
      continue;
    }
    const card = (s.refs ?? []).map(cardDa);
    tx.patch(p._id, (q) => q.setIfMissing({ [`sezioni[_key=="${s._key}"].card`]: card }));
    console.log(`${p._id}: Elenco dei servizi ← ${card.map((c: Doc) => `${c.title} (${c.perChi})`).join(' · ')}`);
  }
}
if (prova) console.log('--prova: niente scritto.');
else {
  await tx.commit();
  console.log('Fatto.');
}
