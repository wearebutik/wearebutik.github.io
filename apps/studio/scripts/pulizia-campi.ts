// Una tantum: toglie dai documenti pubblicati i valori dei campi che lo Studio
// non ha più (nello Studio comparirebbero come "campi sconosciuti"):
//   servizio  card.statValue, card.statLabel (statistica della card, mai
//             mostrata), audience (filtro di /servizi), order
//   progetto  order, featuredOrder (sostituiti dall'ordine a trascinamento)
//   pagina-servizi  filtri
//
//   pnpm --filter @butik/studio pulizia-campi
//
// Da lanciare solo dopo che il sito senza questi campi è online: la versione
// precedente del sito li richiede ancora in build. E dopo `ordine-iniziale`,
// che legge `order`. Idempotente: unset di un campo assente non fa nulla.
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2026-09-01' });

const daTogliere: { filtro: string; campi: string[] }[] = [
  { filtro: '_type == "servizio"', campi: ['card.statValue', 'card.statLabel', 'audience', 'order'] },
  { filtro: '_type == "progetto"', campi: ['order', 'featuredOrder'] },
  { filtro: '_id == "pagina-servizi"', campi: ['filtri'] },
];

const tx = client.transaction();
for (const { filtro, campi } of daTogliere) {
  const ids = await client.fetch<string[]>(`*[${filtro} && !(_id in path("drafts.**"))]._id`);
  for (const id of ids) tx.patch(id, (p) => p.unset(campi));
  console.log(`${filtro}: ${ids.length} documenti, via ${campi.join(', ')}`);
}
await tx.commit();
