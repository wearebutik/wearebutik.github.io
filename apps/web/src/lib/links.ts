import { getCollection } from 'astro:content';
import { PAGINE_STATICHE, isLinkSegnaposto, percorsoInterno } from '@butik/site-config/links';

// Le regole dei link (pagine statiche, segnaposto) sono condivise con lo
// Studio (@butik/site-config/links): lì un link che non porta da nessuna parte
// resta e viene segnalato in giallo finché qualcuno non mette la destinazione
// vera; qui il sito non lo mostra, perché un link che non porta da nessuna
// parte è peggio dell'assenza del link.
export { isLinkSegnaposto };

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
  const percorso = percorsoInterno(href!);
  return percorso === null || (await pagineEsistenti()).has(percorso);
}

/** Filtra una lista di link lasciando solo quelli validi. */
export async function soloLinkValidi<T extends { href: string }>(links: T[]): Promise<T[]> {
  const ok = await Promise.all(links.map((l) => linkValido(l.href)));
  return links.filter((_, i) => ok[i]);
}
