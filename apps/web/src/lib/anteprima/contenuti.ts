// `astro:content` dell'anteprima delle bozze: le pagine chiamano getCollection
// e getEntry come nel sito, ma i dati arrivano da Sanity a ogni richiesta e non
// dallo store scritto a build time. Riusa i loader e gli schemi Zod di
// content.config.ts, così l'anteprima valida i testi come il build vero.
import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';

export { z };

type Collezione = { loader: Loader; schema: z.ZodTypeAny };
type Entry = { id: string; collection: string; data: Record<string, unknown> };

// Astro, al build, esegue i loader della content layer: qui non devono
// partire (le bozze si leggono solo a runtime, con il token di chi scrive),
// quindi ad Astro arriva un loader vuoto e quello vero resta da parte.
const LOADER = Symbol('loader');

export function defineCollection(c: Collezione) {
  return { ...c, loader: { name: 'anteprima', load: async () => {} }, [LOADER]: c.loader };
}

// Una pagina chiama getEntry più volte (header, footer, sezioni): entro un
// paio di secondi la stessa collection non si rilegge.
const DURATA_MS = 2000;
const cache = new Map<string, { scade: number; entries: Promise<Map<string, Entry>> }>();

async function carica(nome: string): Promise<Map<string, Entry>> {
  const { collections } = (await import('../../content.config')) as unknown as {
    collections: Record<string, Collezione & { [LOADER]: Loader }>;
  };
  const collezione = collections[nome];
  if (!collezione) throw new Error(`collection sconosciuta: ${nome}`);
  const entries = new Map<string, Entry>();
  await collezione[LOADER].load({
    store: {
      clear: () => entries.clear(),
      set: (e: { id: string; data: Record<string, unknown> }) => {
        entries.set(e.id, { id: e.id, collection: nome, data: e.data });
        return true;
      },
    },
    parseData: async ({ id, data }: { id: string; data: unknown }) => {
      const esito = collezione.schema.safeParse(data);
      if (!esito.success) throw new Error(`${nome}/${id} non valido: ${esito.error.message}`);
      return esito.data;
    },
    generateDigest: (v: unknown) => String(v),
    logger: console,
  } as unknown as Parameters<Loader['load']>[0]);
  return entries;
}

function entries(nome: string) {
  const ora = Date.now();
  const voce = cache.get(nome);
  if (voce && voce.scade > ora) return voce.entries;
  const nuova = { scade: ora + DURATA_MS, entries: carica(nome) };
  nuova.entries.catch(() => cache.delete(nome));
  cache.set(nome, nuova);
  return nuova.entries;
}

export async function getCollection(nome: string, filtro?: (e: Entry) => unknown) {
  const tutte = [...(await entries(nome)).values()];
  return filtro ? tutte.filter(filtro) : tutte;
}

export async function getEntry(nome: string | { collection: string; id: string }, id?: string) {
  const [c, i] = typeof nome === 'string' ? [nome, id!] : [nome.collection, nome.id];
  return (await entries(c)).get(i);
}
