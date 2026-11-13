// Lo stato «Pubblicata» di un documento Sanity (tab Pubblicazione nello
// Studio), letto dai loader in lib/sanity.ts. Che cosa il sito mostra a
// partire da questo stato lo decide lib/pubblicazione.ts.
//
// Transitorio: i documenti scritti prima del campo `pubblicata` portano
// ancora `draft` (progetti e servizi), `paginaRaggiungibile` (servizi) o
// `nascosta` (pagine). Finché lo script `pubblicata` dello Studio non li ha
// convertiti, lo stato si ricava da quelli; dopo la migrazione questi rami si
// possono togliere.

export type GenereDocumento = 'progetto' | 'servizio' | 'pagina';

interface CampiPubblicazione {
  pubblicata?: unknown;
  draft?: unknown;
  paginaRaggiungibile?: unknown;
  nascosta?: unknown;
}

export function ricavaPubblicata(genere: GenereDocumento, doc: CampiPubblicazione): boolean {
  if (typeof doc.pubblicata === 'boolean') return doc.pubblicata;
  switch (genere) {
    case 'progetto':
      return doc.draft !== true;
    case 'servizio':
      // La scheda del servizio era online solo se «raggiungibile».
      return doc.draft !== true && doc.paginaRaggiungibile === true;
    case 'pagina':
      return doc.nascosta !== true;
  }
}
