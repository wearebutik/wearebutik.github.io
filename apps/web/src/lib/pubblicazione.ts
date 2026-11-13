// Che cosa il sito mostra, a partire dall'interruttore «Pubblicata» della tab
// Pubblicazione dello Studio (il campo `pubblicata`, letto dai loader in
// lib/sanity.ts).
//
// - Progetti: non pubblicato → nessuna scheda, nessuna card, nessun link.
// - Servizi: «Pubblicata» comanda solo la scheda /servizi/<slug>. Le card
//   dell'Elenco dei servizi sono contenuti a sé e decidono da sé il link
//   (lib/cardServizi.ts), che sparisce se la scheda non esiste.
// - Pagine Sostienici e Trasparenza: non pubblicata → la pagina non si genera
//   e i link che ci portano spariscono. Una pagina che esiste solo in bozza
//   conta come non pubblicata: il sito legge i pubblicati.
//
// L'anteprima delle bozze (BUTIK_ANTEPRIMA) mostra tutto; le pagine non
// pubblicate lo dicono con una fascia in cima (components/anteprima/
// AvvisoNonPubblicata.astro).
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export const PAGINE_PUBBLICABILI = ['sostienici', 'trasparenza'] as const;
export type PaginaPubblicabile = (typeof PAGINE_PUBBLICABILI)[number];

const siVede = (pubblicata: boolean) => __BUTIK_ANTEPRIMA__ || pubblicata;

/** I progetti che il sito mostra (schede, card, elenchi): in anteprima tutti. */
export function progettiVisibili(): Promise<CollectionEntry<'progetti'>[]> {
  return getCollection('progetti', (e) => siVede(e.data.pubblicata));
}

/** I servizi che hanno la scheda /servizi/<slug>: in anteprima tutti. */
export function serviziConScheda(): Promise<CollectionEntry<'servizi'>[]> {
  return getCollection('servizi', (e) => siVede(e.data.pubblicata));
}

/** true se la pagina è pubblicata (lo stato vero, anche in anteprima). */
export async function paginaPubblicata(id: PaginaPubblicabile): Promise<boolean> {
  const entry = await getEntry('pagine', id);
  return entry !== undefined && 'pubblicata' in entry.data && entry.data.pubblicata;
}

/** true se il sito genera la pagina: pubblicata, o in anteprima. */
export async function paginaVisibile(id: PaginaPubblicabile): Promise<boolean> {
  return __BUTIK_ANTEPRIMA__ || (await paginaPubblicata(id));
}

/** I percorsi delle pagine che il sito non genera, es. `/trasparenza`. */
export async function pagineNonVisibili(): Promise<string[]> {
  const esiti = await Promise.all(PAGINE_PUBBLICABILI.map(async (id) => ((await paginaVisibile(id)) ? null : `/${id}`)));
  return esiti.filter((p): p is string => p !== null);
}
