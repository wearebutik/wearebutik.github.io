// Regole dei link condivise da sito e Studio: quali pagine interne esistono e
// quali indirizzi sono segnaposto. Lo Studio le usa per l'avviso giallo sui
// campi (apps/studio/schemaTypes/testo.ts), il sito per non mostrare i link che
// non portano da nessuna parte (apps/web/src/lib/links.ts).

/**
 * Pagine statiche del sito (apps/web/src/pages, senza lab e og). Il build del
 * sito fallisce se l'elenco non corrisponde alle pagine vere
 * (apps/web/src/lib/pagineGuard.ts).
 */
export const PAGINE_STATICHE = ['/', '/chi-siamo', '/servizi', '/progetti', '/contatti', '/partners', '/privacy', '/termini'] as const;

/** Sezioni con una scheda per documento: /servizi/<slug>, /progetti/<slug>. */
export const SEZIONI_CON_SCHEDE = ['servizi', 'progetti'] as const;

// Link che non portano da nessuna parte: `#` da solo, indirizzi di esempio,
// promemoria.
const SEGNAPOSTO = /^(#!?|javascript:void\(0\);?|https?:\/\/(www\.)?example\.(com|org)\b.*|todo|tbd|xxx)$/i;

/**
 * Indirizzo email (anche PEC): lo Studio lo chiede con questa regola e lo
 * schema Zod del sito la ripete, così un valore pubblicato non fa fallire il
 * build.
 */
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** true se l'indirizzo è vuoto o un segnaposto, e il link non va mostrato. */
export function isLinkSegnaposto(href: string | undefined | null): boolean {
  return !href || SEGNAPOSTO.test(href.trim());
}

/**
 * Il percorso di un link interno, senza query, ancora e barra finale; `null`
 * se il link non è interno (esterno, mailto:, ancora, `//host`).
 */
export function percorsoInterno(href: string): string | null {
  const h = href.trim();
  if (!h.startsWith('/') || h.startsWith('//')) return null;
  return h.replace(/[?#].*$/, '').replace(/(.)\/$/, '$1');
}

/**
 * true se il percorso ha la forma di una pagina del sito: una pagina statica o
 * la scheda di una sezione. Se la scheda esiste davvero lo sa solo il sito,
 * che conosce i documenti pubblicati.
 */
export function haFormaDiPagina(percorso: string): boolean {
  if ((PAGINE_STATICHE as readonly string[]).includes(percorso)) return true;
  const [, sezione, slug, resto] = percorso.split('/');
  return (SEZIONI_CON_SCHEDE as readonly string[]).includes(sezione) && /^[a-z0-9-]+$/.test(slug ?? '') && resto === undefined;
}
