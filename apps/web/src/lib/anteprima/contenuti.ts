// `astro:content` dell'anteprima delle bozze: le pagine chiamano getCollection
// e getEntry come nel sito, ma i dati arrivano da Sanity a ogni richiesta e non
// dallo store scritto a build time. Riusa i loader e gli schemi Zod di
// content.config.ts, così l'anteprima valida i testi come il build vero.
import type { SanityClient } from '@sanity/client';
import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import { sanityPubblicati } from '#lib/sanity';
import { registra, type Problema } from './problemi';

export { z };

type Collezione = { loader: Loader; schema: z.ZodTypeAny };
type Entry = { id: string; collection: string; data: Record<string, unknown> };

// Astro, al build, esegue i loader della content layer: qui non devono
// partire (le bozze si leggono solo a runtime, con il token di chi scrive),
// quindi ad Astro arriva un loader vuoto e quello vero resta da parte.
const LOADER = Symbol('loader');

export function defineCollection(c: Collezione) {
  // `type` come lo mette il defineCollection di Astro: senza, Astro 7 rifiuta la collection.
  return { ...c, type: 'content_layer', loader: { name: 'anteprima', load: async () => {} }, [LOADER]: c.loader };
}

// Una pagina chiama getEntry più volte (header, footer, sezioni): entro un
// paio di secondi la stessa collection non si rilegge.
const DURATA_MS = 2000;
const cache = new Map<string, { scade: number; entries: Promise<Map<string, Entry>> }>();

type Esito = { data: Record<string, unknown> } | { errori: string[] };

/** Esegue il loader della collection con `client` e valida ogni documento. */
async function leggi(collezione: Collezione & { [LOADER]: Loader }, client: SanityClient | undefined) {
  const esiti = new Map<string, Esito>();
  await collezione[LOADER].load({
    client,
    store: {
      clear: () => esiti.clear(),
      set: (e: { id: string; data: Esito }) => {
        esiti.set(e.id, e.data);
        return true;
      },
    },
    // Non lancia: una bozza non valida non deve fermare le altre.
    parseData: async ({ data }: { data: unknown }): Promise<Esito> => {
      const esito = collezione.schema.safeParse(data);
      if (esito.success) return { data: esito.data };
      return { errori: esito.error.issues.map((i) => `${i.path.join('.') || '(documento)'}: ${i.message}`) };
    },
    generateDigest: (v: unknown) => String(v),
    logger: console,
  } as unknown as Parameters<Loader['load']>[0]);
  return esiti;
}

// Una bozza che non rispetta lo schema non rompe la pagina: al suo posto va la
// versione pubblicata, se c'è, e il banner dell'anteprima segnala il problema.
async function carica(nome: string): Promise<Map<string, Entry>> {
  const { collections } = (await import('../../content.config')) as unknown as {
    collections: Record<string, Collezione & { [LOADER]: Loader }>;
  };
  const collezione = collections[nome];
  if (!collezione) throw new Error(`collection sconosciuta: ${nome}`);
  const esiti = await leggi(collezione, undefined);
  const nonValidi = [...esiti].filter((e): e is [string, { errori: string[] }] => 'errori' in e[1]);
  const pubblicati = nonValidi.length ? await leggi(collezione, sanityPubblicati) : new Map<string, Esito>();

  const entries = new Map<string, Entry>();
  const problemi: Problema[] = [];
  for (const [id, esito] of esiti) {
    const ripiego = 'errori' in esito ? pubblicati.get(id) : esito;
    if (ripiego && 'data' in ripiego) entries.set(id, { id, collection: nome, data: ripiego.data });
    if ('errori' in esito) {
      problemi.push({ collezione: nome, id, errori: esito.errori, ripiego: ripiego && 'data' in ripiego ? 'pubblicata' : 'nascosta' });
    }
  }
  registra(nome, problemi);
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
