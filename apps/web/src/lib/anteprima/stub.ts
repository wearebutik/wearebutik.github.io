// Moduli che l'anteprima delle bozze non porta nel worker: sharp (segnaposto
// LQIP), satori/resvg e il generatore delle card OG, che legge i font da
// disco appena caricato. Nessuna di queste cose serve a chi rilegge i testi;
// chiamarli è un errore.
function assente(): never {
  throw new Error("non disponibile nell'anteprima delle bozze");
}

export default assente;
export const Resvg = assente;
export const renderCardPng = assente;
