// Una tantum: porta progetti, servizi, Sostienici e Trasparenza
// all'interruttore «Pubblicata» (schemaTypes/pubblicazione.ts), sui
// pubblicati e sulle bozze:
//   progetto                pubblicata = !draft
//   servizio                pubblicata = !draft && paginaRaggiungibile
//                           (comanda solo la scheda /servizi/<slug>, che
//                           finora era online e linkata solo se raggiungibile)
//   pagina-sostienici,      pubblicata = !nascosta
//   pagina-trasparenza
// e toglie i campi vecchi (draft, paginaRaggiungibile, nascosta). Un documento
// che ha già `pubblicata` lo tiene. Eseguito il 2026-11-13: resta come
// traccia della migrazione.
//
//   pnpm --filter @butik/studio pubblicata [--depubblica-servizi] [--prova]
//
// --depubblica-servizi  mette pubblicata = false su tutti i servizi: le card
//                       restano, le schede /servizi/<slug> spariscono.
// --prova               stampa cosa farebbe, senza scrivere.
//
// Da lanciare dopo che il sito con «Pubblicata» è online (la versione
// precedente legge ancora draft e nascosta). Idempotente.
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2026-09-01', perspective: 'raw' });

const args = process.argv.slice(2);
const prova = args.includes('--prova');
const depubblicaServizi = args.includes('--depubblica-servizi');

interface Documento {
  _id: string;
  _type: string;
  pubblicata?: boolean;
  draft?: boolean;
  paginaRaggiungibile?: boolean;
  nascosta?: boolean;
}

function statoDa(doc: Documento): boolean {
  if (doc._type === 'servizio' && depubblicaServizi) return false;
  if (typeof doc.pubblicata === 'boolean') return doc.pubblicata;
  switch (doc._type) {
    case 'progetto':
      return doc.draft !== true;
    case 'servizio':
      return doc.draft !== true && doc.paginaRaggiungibile === true;
    default:
      return doc.nascosta !== true;
  }
}

const docs = await client.fetch<Documento[]>(
  `*[_type in ["progetto", "servizio"] || _id in ["pagina-sostienici", "drafts.pagina-sostienici", "pagina-trasparenza", "drafts.pagina-trasparenza"]]
    {_id, _type, pubblicata, draft, paginaRaggiungibile, nascosta}`,
);

const tx = client.transaction();
for (const doc of docs.sort((a, b) => a._id.localeCompare(b._id))) {
  const pubblicata = statoDa(doc);
  tx.patch(doc._id, (p) => p.set({ pubblicata }).unset(['draft', 'paginaRaggiungibile', 'nascosta']));
  console.log(`${doc._id}: pubblicata = ${pubblicata}`);
}
console.log(`${docs.length} documenti${depubblicaServizi ? ', servizi depubblicati' : ''}.`);

if (prova) console.log('--prova: niente scritto.');
else await tx.commit();
