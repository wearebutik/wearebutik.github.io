// Le pagine del sito dove compare ogni documento. Lo Studio le mostra in cima
// al form («Usato in…»): un clic apre la scheda «Anteprima web» su quella
// pagina, con il documento accanto. `mainDocuments` fa il giro inverso:
// navigando nell'anteprima, lo Studio apre il documento della pagina.
// I percorsi vengono da @butik/site-config, lo stesso elenco che il build del
// sito confronta con le rotte vere (apps/web/src/lib/pagineGuard.ts).
import { defineLocations, type PresentationPluginOptions } from 'sanity/presentation';
import { PAGINE_STATICHE, SEZIONI_CON_SCHEDE } from '@butik/site-config/links';
import { PAGINE } from './schemaTypes/pagine';
import { ELEMENTI } from './schemaTypes/elementi';

// Il percorso di ogni pagina dello Studio: la home è `/`, le altre `/<id>`. Se
// un id non corrisponde a una pagina del sito, il typecheck fallisce qui.
const percorsoPagina = (id: (typeof PAGINE)[keyof typeof PAGINE]): (typeof PAGINE_STATICHE)[number] =>
  id === 'home' ? '/' : (`/${id}` as const);

// La sezione del sito che ha una scheda per ogni documento del tipo.
const SCHEDE = {
  progetto: 'progetti',
  servizio: 'servizi',
} as const satisfies Record<string, (typeof SEZIONI_CON_SCHEDE)[number]>;

const scheda = (sezione: (typeof SEZIONI_CON_SCHEDE)[number], titoloElenco: string) =>
  defineLocations({
    select: { title: 'title', slug: 'slug.current' },
    resolve: (doc) => ({
      locations: [
        ...(doc?.slug ? [{ title: doc.title || doc.slug, href: `/${sezione}/${doc.slug}` }] : []),
        { title: titoloElenco, href: `/${sezione}` },
      ],
    }),
  });

const pagine = Object.fromEntries(
  Object.entries(PAGINE).map(([tipo, id]) => [
    tipo,
    defineLocations({
      select: { title: 'pageTitle' },
      resolve: (doc) => ({ locations: [{ title: doc?.title || id, href: percorsoPagina(id) }] }),
    }),
  ]),
);

// Header, footer, banner dei cookie e testimonianze compaiono su più pagine:
// si apre la home. La pagina 404 e i testi per gli agenti AI hanno il loro
// indirizzo, fuori dalle pagine di PAGINE_STATICHE.
const elementi: Record<keyof typeof ELEMENTI, { title: string; href: string }> = {
  header: { title: 'Home', href: '/' },
  footer: { title: 'Home', href: '/' },
  bannerCookie: { title: 'Home', href: '/' },
  testimonials: { title: 'Home', href: '/' },
  paginaNonTrovata: { title: 'Pagina non trovata', href: '/404' },
  agentiAi: { title: 'llms.txt', href: '/llms.txt' },
};

export const resolve: PresentationPluginOptions['resolve'] = {
  locations: {
    ...pagine,
    ...Object.fromEntries(
      Object.entries(elementi).map(([tipo, luogo]) => [tipo, defineLocations({ locations: [luogo] })]),
    ),
    progetto: scheda(SCHEDE.progetto, 'Progetti'),
    servizio: scheda(SCHEDE.servizio, 'Servizi'),
  },
  mainDocuments: [
    ...Object.entries(PAGINE).map(([tipo, id]) => ({
      route: percorsoPagina(id),
      filter: `_type == "${tipo}"`,
    })),
    ...Object.entries(SCHEDE).map(([tipo, sezione]) => ({
      route: `/${sezione}/:slug`,
      filter: `_type == "${tipo}" && slug.current == $slug`,
    })),
  ],
};
