import { getCollection } from 'astro:content';

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


// Pagine statiche del sito (src/pages, senza lab e og).
const PAGINE_STATICHE = ['/', '/chi-siamo', '/servizi', '/progetti', '/contatti', '/partners', '/privacy', '/termini'];

let pagine: Promise<Set<string>> | undefined;

/** Percorsi interni che esistono: pagine statiche + schede servizio e progetto. */
function pagineEsistenti(): Promise<Set<string>> {
  pagine ??= (async () => {
    const servizi = await getCollection('servizi', (e) => !e.data.draft);
    const progetti = await getCollection('progetti', (e) => !e.data.draft);
    return new Set([
      ...PAGINE_STATICHE,
      ...servizi.map((e) => `/servizi/${e.id}`),
      ...progetti.map((e) => `/progetti/${e.id}`),
    ]);
  })();
  return pagine;
}

/**
 * true se il link porta da qualche parte: non è un segnaposto e, se è un
 * percorso interno, la pagina esiste. Gli altri non si mostrano (su Sanity lo
 * Studio li segnala in giallo).
 */
export async function linkValido(href: string | undefined | null): Promise<boolean> {
  if (isLinkSegnaposto(href)) return false;
  const h = href!.trim();
  if (!h.startsWith('/') || h.startsWith('//')) return true;
  const percorso = h.replace(/[?#].*$/, '').replace(/(.)\/$/, '$1');
  return (await pagineEsistenti()).has(percorso);
}

/** Filtra una lista di link lasciando solo quelli validi. */
export async function soloLinkValidi<T extends { href: string }>(links: T[]): Promise<T[]> {
  const ok = await Promise.all(links.map((l) => linkValido(l.href)));
  return links.filter((_, i) => ok[i]);
}
