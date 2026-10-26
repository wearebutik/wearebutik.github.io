// Pacchetti nativi che l'anteprima delle bozze non porta nel binario: sharp
// (segnaposto LQIP) e satori/resvg (card OG). Nessuna delle due cose serve a
// chi rilegge i testi; chiamarli è un errore.
function assente(): never {
  throw new Error("non disponibile nell'anteprima delle bozze");
}

export default assente;
export const Resvg = assente;
