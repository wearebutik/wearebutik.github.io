import { getCollection } from 'astro:content';
import { PAGINE_STATICHE, SEZIONI_CON_SCHEDE, isLinkSegnaposto, percorsoInterno } from '@butik/site-config/links';

// Le regole dei link (pagine statiche, segnaposto) sono condivise con lo
// Studio (@butik/site-config/links): lì un link che non porta da nessuna parte
// resta e viene segnalato in giallo finché qualcuno non mette la destinazione
// vera; qui il sito non lo mostra, perché un link che non porta da nessuna
// parte è peggio dell'assenza del link.
export { isLinkSegnaposto };

let pagine: Promise<Set<string>> | undefined;

/**
 * Percorsi interni che esistono: pagine statiche + una scheda per documento
 * pubblicato di ogni sezione (ogni sezione è anche una collection).
 */
function pagineEsistenti(): Promise<Set<string>> {
  pagine ??= (async () => {
    const schede = await Promise.all(
      SEZIONI_CON_SCHEDE.map(async (s) =>
        (await getCollection(s, (e) => !e.data.draft)).map((e) => `/${s}/${e.id}`),
      ),
    );
    return new Set([...PAGINE_STATICHE, ...schede.flat()]);
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
