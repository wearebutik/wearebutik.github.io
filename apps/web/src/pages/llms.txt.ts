// /llms.txt: la presentazione di butik per gli agenti AI (PDR-0007, testo in
// lib/seo/llms.ts). Solo nel sito pubblicato e con `site`, che dà gli
// indirizzi assoluti; la beta è comunque chiusa dal suo robots.txt.
import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { testoLlms } from '#lib/seo/llms';
import { linkValido } from '#lib/links';
import { progettiVisibili } from '#lib/pubblicazione';

export const prerender = true;

// Le pagine da presentare, nell'ordine del menu; quelle non generate si saltano.
const PAGINE = ['chi-siamo', 'servizi', 'progetti', 'partners', 'contatti'] as const;

export const GET: APIRoute = async ({ site }) => {
  if (!site) return new Response('', { status: 404 });
  const [agenti, home, servizi, footer] = await Promise.all([
    getEntry('elementi', 'agenti-ai'),
    getEntry('pagine', 'home'),
    getEntry('pagine', 'servizi'),
    getEntry('elementi', 'footer'),
  ]);
  if (!footer || footer.data.type !== 'footer' || !home) throw new Error('llms.txt: mancano il footer o la home su Sanity.');
  // Senza la descrizione per gli agenti si usa quella della home.
  const descrizione = agenti?.data.type === 'agenti-ai' ? agenti.data : { descrizione: home.data.metaDescription, dettagli: undefined };

  const card =
    servizi?.data && 'sezioni' in servizi.data
      ? servizi.data.sezioni.flatMap((s) => (s._type === 'sezioneElencoServizi' ? s.card : []))
      : [];
  const pagine = await getCollection('pagine', (e) => (PAGINE as readonly string[]).includes(e.id));
  const visibili = (
    await Promise.all(pagine.map(async (p) => ((await linkValido(`/${p.id}`)) ? p : undefined)))
  ).filter((p) => p !== undefined);
  visibili.sort((a, b) => PAGINE.indexOf(a.id as (typeof PAGINE)[number]) - PAGINE.indexOf(b.id as (typeof PAGINE)[number]));

  const testo = testoLlms({
    site,
    nome: 'Butik',
    descrizione: descrizione.descrizione,
    dettagli: descrizione.dettagli,
    servizi: card.map((c) => ({ title: c.title, desc: c.desc, ancora: c.ancora })),
    progetti: (await progettiVisibili()).map((p) => ({ id: p.id, title: p.data.title, subtitle: p.data.subtitle })),
    pagine: visibili.map((p) => ({ percorso: `/${p.id}`, titolo: p.data.metaTitle, descrizione: p.data.metaDescription })),
    contatti: footer.data,
  });
  return new Response(testo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
