// Ordine di progetti e servizi: quello dell'elenco riordinabile dello Studio
// (@sanity/orderable-document-list), salvato in `orderRank` come LexoRank, che
// si ordina confrontando le stringhe. Un documento senza rank va in fondo.
export const perOrdine = (
  a: { data: { orderRank?: string } },
  b: { data: { orderRank?: string } },
): number => {
  const ra = a.data.orderRank;
  const rb = b.data.orderRank;
  if (ra === rb) return 0;
  if (ra === undefined) return 1;
  if (rb === undefined) return -1;
  return ra < rb ? -1 : 1;
};
