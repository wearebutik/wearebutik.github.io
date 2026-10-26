// Bozze che non rispettano lo schema Zod, raccolte da contenuti.ts e mostrate
// dal banner dell'anteprima (components/anteprima/AvvisoBozze.astro).
export interface Problema {
  collezione: string;
  id: string;
  /** `campo: messaggio` per ogni errore di Zod. */
  errori: string[];
  /** Cosa mostra l'anteprima al posto della bozza. */
  ripiego: 'pubblicata' | 'nascosta';
}

const perCollezione = new Map<string, Problema[]>();

/** Sostituisce i problemi di una collection con quelli dell'ultima lettura. */
export function registra(collezione: string, problemi: Problema[]) {
  perCollezione.set(collezione, problemi);
}

export function elencoProblemi(): Problema[] {
  return [...perCollezione.values()].flat();
}
