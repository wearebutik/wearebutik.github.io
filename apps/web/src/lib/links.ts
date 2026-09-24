// Link segnaposto: `#` da solo, indirizzi di esempio, promemoria. Stessa
// regola dell'avviso nello Studio (apps/studio/schemaTypes/testo.ts,
// `linkSegnaposto`): lì il valore resta e viene segnalato in giallo finché
// qualcuno non mette la destinazione vera; qui il sito non lo mostra, perché
// un link che non porta da nessuna parte è peggio dell'assenza del link.
const SEGNAPOSTO = /^(#!?|javascript:void\(0\);?|https?:\/\/(www\.)?example\.(com|org)\b.*|todo|tbd|xxx)$/i;

/** true se l'indirizzo è un segnaposto e il link non va mostrato. */
export function isLinkSegnaposto(href: string | undefined | null): boolean {
  return !href || SEGNAPOSTO.test(href.trim());
}
