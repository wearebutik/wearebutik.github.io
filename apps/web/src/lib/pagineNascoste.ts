// Le pagine che si possono nascondere dallo Studio («Pagina nascosta»): il
// sito pubblico non le genera e i link che ci portano spariscono. Una pagina
// che esiste solo in bozza conta come nascosta: il sito legge i pubblicati.
// L'anteprima delle bozze (BUTIK_ANTEPRIMA) le mostra tutte.
import { getEntry } from 'astro:content';

const NASCONDIBILI = ['sostienici', 'trasparenza'] as const;
export type PaginaNascondibile = (typeof NASCONDIBILI)[number];

/** true se il sito pubblico non deve generare la pagina. */
export async function paginaNascosta(id: PaginaNascondibile): Promise<boolean> {
  if (__BUTIK_ANTEPRIMA__) return false;
  const entry = await getEntry('pagine', id);
  return !entry || ('nascosta' in entry.data && entry.data.nascosta === true);
}

/** I percorsi delle pagine nascoste, es. `/trasparenza`. */
export async function pagineNascoste(): Promise<string[]> {
  const nascoste = await Promise.all(NASCONDIBILI.map(async (id) => ((await paginaNascosta(id)) ? `/${id}` : null)));
  return nascoste.filter((p): p is string => p !== null);
}
