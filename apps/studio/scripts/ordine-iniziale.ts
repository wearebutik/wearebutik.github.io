// Una tantum: dà a progetti e servizi la posizione nell'elenco riordinabile
// dello Studio (`orderRank`, @sanity/orderable-document-list), partendo dal
// vecchio campo numerico `order`. Così il sito tiene l'ordine di prima finché
// non lo si cambia trascinando. Scrive sui documenti pubblicati: l'ordine non
// passa dalle bozze, come fa il plugin quando si trascina.
//
//   pnpm --filter @butik/studio ordine-iniziale
//
// Idempotente: rieseguito, riassegna gli stessi rank nello stesso ordine.
import { getCliClient } from 'sanity/cli';
import { LexoRank } from 'lexorank';

const client = getCliClient({ apiVersion: '2026-09-01' });

for (const type of ['progetto', 'servizio']) {
  const docs = await client.fetch<{ _id: string; title: string }[]>(
    `*[_type == $type && !(_id in path("drafts.**"))] | order(coalesce(order, 0) asc, title asc){_id, title}`,
    { type },
  );
  let rank = LexoRank.min();
  const tx = client.transaction();
  for (const d of docs) {
    rank = rank.genNext().genNext();
    tx.patch(d._id, (p) => p.set({ orderRank: rank.toString() }));
    console.log(`${type}: ${rank.toString()}  ${d.title}`);
  }
  await tx.commit();
}
