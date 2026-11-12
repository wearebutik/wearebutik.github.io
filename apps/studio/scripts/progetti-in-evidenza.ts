// Una tantum: i progetti in evidenza della home passano dall'interruttore
// "In evidenza in home" dei progetti alla lista `progetti` del blocco
// "Progetti in evidenza": gli stessi 4, nello stesso ordine di prima (i primi
// 4 in evidenza, nell'ordine dell'elenco Progetti). Vale per la versione
// pubblicata e per la bozza, se c'è.
//
//   pnpm --filter @butik/studio progetti-in-evidenza
//
// Non tocca un blocco che ha già la sua lista (setIfMissing), e non toglie
// l'interruttore dai progetti: lo toglie `pulizia-campi` dopo il deploy.
import { randomUUID } from 'node:crypto';
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2026-09-01', perspective: 'raw' });

type Doc = Record<string, any>;
const key = () => randomUUID().slice(0, 12);

const inEvidenza = await client.fetch<Doc[]>(
  `*[_type == "progetto" && !(_id in path("drafts.**")) && featured == true && draft != true] | order(orderRank asc)[0...4]{_id, title}`,
);
const riferimenti = () => inEvidenza.map((p) => ({ _key: key(), _type: 'reference', _ref: p._id }));

const pagine = await client.fetch<Doc[]>(`*[_id in ["pagina-home", "drafts.pagina-home"]]{_id, sezioni[]{_key, _type}}`);
const tx = client.transaction();
for (const p of pagine) {
  for (const s of p.sezioni ?? []) {
    if (s._type !== 'sezioneProgetti') continue;
    tx.patch(p._id, (q) => q.setIfMissing({ [`sezioni[_key=="${s._key}"].progetti`]: riferimenti() }));
    console.log(`${p._id}: Progetti in evidenza ← ${inEvidenza.map((x) => x.title).join(', ')}`);
  }
}
await tx.commit();
