// Una tantum: porta le card dell'hero e l'ordine dei servizi dentro le
// sezioni delle pagine, con gli stessi testi, link e ordine di prima.
//   - Hero (Home): la lista `card`, dalla card di ciascun servizio (titolo,
//     descrizione), con il link che il sito calcolava e l'icona del servizio.
//   - Elenco dei servizi (Servizi): la lista `servizi` di riferimenti.
// L'ordine è quello dell'elenco Servizi a trascinamento (`orderRank`).
// Vale per la versione pubblicata e per la bozza, se c'è.
//
//   pnpm --filter @butik/studio card-e-elenco-servizi
//
// Non tocca una sezione che ha già la sua lista (setIfMissing), e non toglie
// i campi vecchi dei servizi: li toglie `pulizia-campi` dopo il deploy.
import { randomUUID } from 'node:crypto';
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2026-09-01', perspective: 'raw' });

type Doc = Record<string, any>;
const key = () => randomUUID().slice(0, 12);

// L'icona che la card di ogni servizio aveva, scelta dallo slug.
const ICONA: Record<string, string> = {
  'progettazione-culturale': 'stella',
  'consulenza-strategica': 'bussola',
  'formazione-capacity-building': 'tocco',
  'eventi-culturali-musicali': 'equalizzatore',
  'prodotti-turistico-musicali': 'luogo',
};

const servizi = await client.fetch<Doc[]>(
  `*[_type == "servizio" && !(_id in path("drafts.**")) && draft != true] | order(orderRank asc){_id, "slug": slug.current, card, paginaRaggiungibile}`,
);

const card = () =>
  servizi.map((s) => ({
    _key: key(),
    _type: 'cardHero',
    title: s.card?.title,
    desc: s.card?.desc,
    href: s.paginaRaggiungibile ? `/servizi/${s.slug}` : `/servizi/#${s.slug}`,
    ...(ICONA[s.slug] && { icona: ICONA[s.slug] }),
  }));
const riferimenti = () => servizi.map((s) => ({ _key: key(), _type: 'reference', _ref: s._id }));

const pagine = await client.fetch<Doc[]>(
  `*[_id in ["pagina-home", "drafts.pagina-home", "pagina-servizi", "drafts.pagina-servizi"]]{_id, sezioni[]{_key, _type}}`,
);
const tx = client.transaction();
for (const p of pagine) {
  for (const s of p.sezioni ?? []) {
    if (s._type === 'sezioneHero') {
      tx.patch(p._id, (q) => q.setIfMissing({ [`sezioni[_key=="${s._key}"].card`]: card() }));
      console.log(`${p._id}: Hero ← ${servizi.length} card`);
    }
    if (s._type === 'sezioneElencoServizi') {
      tx.patch(p._id, (q) => q.setIfMissing({ [`sezioni[_key=="${s._key}"].servizi`]: riferimenti() }));
      console.log(`${p._id}: Elenco dei servizi ← ${servizi.map((x) => x.slug).join(', ')}`);
    }
  }
}
await tx.commit();
