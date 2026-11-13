// Elementi del sito: i contenuti che non sono pagine ma compaiono in tutte, o
// in più d'una. Header, footer, banner dei cookie, testimonianze (un blocco
// che le pagine mostrano con la sezione «Testimonianze»), la pagina non
// trovata (404), che risponde a ogni indirizzo che non esiste, e la
// descrizione per gli agenti AI (/llms.txt). Come le pagine sono
// documenti fissi, uno per tipo (_id in ELEMENTI), senza "crea" né "elimina"
// (structure.ts, sanity.config.ts). Ogni tipo rispecchia il ramo
// corrispondente dello schema Zod `elementi` in apps/web/src/content.config.ts.
import { defineArrayMember, defineField, defineType } from 'sanity';
import { RETI_SOCIAL } from '@butik/site-config/social';
import { hrefField } from './testo';
import { str, txt } from './pagine';

// Header: le voci del menu e il pulsante a destra. Il logo resta nel codice.
// Una voce che porta a una pagina che non esiste (o nascosta) non compare sul
// sito, come ogni altro link.
export const header = defineType({
  name: 'header',
  title: 'Header',
  type: 'document',
  fields: [
    defineField({
      name: 'voci',
      title: 'Voci del menu',
      description: 'Nell’ordine del menu. Un link a una pagina che non esiste o segnaposto non compare sul sito.',
      type: 'array',
      of: [defineArrayMember({ type: 'link' })],
      validation: (r) => r.required().min(1),
    }),
    str('ctaLabel', 'Pulsante: etichetta'),
    str('ctaHref', 'Pulsante: link'),
  ],
  preview: { prepare: () => ({ title: 'Header' }) },
});

// Footer: condiviso da tutte le pagine (e i social anche dalla pagina
// Contatti). Le icone dei social restano nel codice (apps/web/src/data/socials.ts),
// qui si sceglie la rete fra quelle che il sito sa mostrare
// (@butik/site-config/social).
export const footer = defineType({
  name: 'footer',
  title: 'Footer',
  type: 'document',
  groups: [
    { name: 'azienda', title: 'Dati aziendali', default: true },
    { name: 'link', title: 'Link' },
  ],
  fields: [
    str('ragioneSociale', 'Ragione sociale', 'azienda'),
    txt('indirizzo', 'Indirizzo', 'azienda'),
    str('partitaIva', 'Partita IVA', 'azienda'),
    str('contattiLabel', 'Etichetta dei contatti (es. "PEC & Email")', 'azienda'),
    str('pec', 'PEC', 'azienda'),
    str('email', 'Email', 'azienda'),
    defineField({
      name: 'social',
      title: 'Social',
      description: 'Anche nella pagina Contatti. Un indirizzo segnaposto (es. "#") non compare sul sito.',
      type: 'array',
      group: 'azienda',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'profiloSocial',
          fields: [
            defineField({
              name: 'rete',
              title: 'Rete',
              type: 'string',
              options: { list: [...RETI_SOCIAL] },
              validation: (r) => r.required(),
            }),
            defineField(hrefField({ title: 'Indirizzo del profilo' })),
          ],
          preview: { select: { title: 'rete', subtitle: 'href' } },
        }),
      ],
    }),
    defineField({
      name: 'colonna1',
      title: 'Link, prima colonna',
      description: 'Un link a una pagina che non esiste o segnaposto non compare sul sito.',
      type: 'array',
      group: 'link',
      of: [defineArrayMember({ type: 'link' })],
    }),
    defineField({
      name: 'colonna2',
      title: 'Link, seconda colonna',
      description: 'Un link a una pagina che non esiste o segnaposto non compare sul sito.',
      type: 'array',
      group: 'link',
      of: [defineArrayMember({ type: 'link' })],
    }),
    defineField({
      name: 'linkLegali',
      title: 'Link legali (in fondo)',
      type: 'array',
      group: 'link',
      of: [defineArrayMember({ type: 'link' })],
    }),
    str('cookieLabel', 'Pulsante preferenze cookie', 'link'),
    str('copyright', 'Copyright (l’anno lo aggiunge il sito)', 'link'),
  ],
  preview: { prepare: () => ({ title: 'Footer' }) },
});

// I testi del banner dei cookie a biglietto, che contiene anche le
// preferenze (ADR-0006, PDR-0006). Le categorie e l'elenco tecnico dei cookie
// (nome, fornitore, durata) restano nel codice, in
// apps/web/src/lib/consent/cookie.ts: devono coincidere con quello che il sito
// scrive davvero, e tools/consent-audit lo verifica.
export const bannerCookie = defineType({
  name: 'bannerCookie',
  title: 'Banner dei cookie',
  type: 'document',
  groups: [
    { name: 'avviso', title: 'Avviso', default: true },
    { name: 'preferenze', title: 'Preferenze' },
  ],
  fields: [
    str('occhiello', 'Occhiello', 'avviso'),
    str('titolo', 'Titolo', 'avviso'),
    defineField({
      name: 'testo',
      title: 'Testo',
      description: 'Deve dire con chiarezza cosa si accetta e cosa si rifiuta, e portare alla Cookie Policy.',
      type: 'testoFormattato',
      group: 'avviso',
      validation: (r) => r.required(),
    }),
    str('accetta', 'Pulsante: accetta tutti', 'avviso'),
    str('rifiuta', 'Pulsante: rifiuta tutti', 'avviso'),
    str('preferenze', 'Link: apre le preferenze', 'avviso'),
    str('necessariTitolo', 'Necessari: titolo', 'preferenze'),
    txt('necessariTesto', 'Necessari: descrizione', 'preferenze'),
    str('sempreAttivi', 'Necessari: timbro «sempre attivi»', 'preferenze'),
    str('analisiTitolo', 'Analisi: titolo', 'preferenze'),
    txt('analisiTesto', 'Analisi: descrizione', 'preferenze'),
    str('elencoCookie', 'Apre l’elenco dei cookie di ogni categoria', 'preferenze'),
    str('salva', 'Link: salva le scelte', 'preferenze'),
    str('chiudi', 'Etichetta del pulsante di chiusura (per i lettori di schermo)', 'preferenze'),
    defineField({
      name: 'informazioniTesto',
      title: 'Testo in fondo alle preferenze',
      description: 'Con i link a Privacy & Cookie Policy e Termini di utilizzo.',
      type: 'testoFormattato',
      group: 'preferenze',
      validation: (r) => r.required(),
    }),
  ],
  preview: { prepare: () => ({ title: 'Banner dei cookie' }) },
});

// Testimonianze: le mostra la sezione «Testimonianze» delle pagine (home,
// Chi siamo), sempre le stesse.
export const testimonials = defineType({
  name: 'testimonials',
  title: 'Testimonianze',
  type: 'document',
  fields: [
    str('eyebrow', 'Intestazione'),
    str('sectionTitle', 'Titolo'),
    defineField({
      name: 'testimonials',
      title: 'Testimonianze (home e Chi siamo)',
      description: 'Facoltative: senza testimonianze la sezione non compare sul sito.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'testimonianza',
          fields: [
            defineField({ name: 'rating', title: 'Stelle', type: 'number', validation: (r) => r.required().min(1).max(5) }),
            txt('quote', 'Citazione'),
            str('name', 'Nome'),
            str('role', 'Ruolo'),
          ],
          preview: { select: { title: 'name', subtitle: 'role' } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Testimonianze' }) },
});

// Pagina non trovata (404): i testi della pagina che il sito mostra per un
// indirizzo che non esiste. Il disegno (il giradischi, la scaletta) e il suono
// restano nel codice (apps/web/src/pages/404.astro); qui le parole e le
// tracce, cioè i link per tornare nel sito.
export const paginaNonTrovata = defineType({
  name: 'paginaNonTrovata',
  title: 'Pagina non trovata (404)',
  type: 'document',
  groups: [
    { name: 'testo', title: 'Testo', default: true },
    { name: 'giradischi', title: 'Giradischi' },
  ],
  fields: [
    str('metaTitle', 'Titolo nella scheda del browser', 'testo'),
    str('occhiello', 'Occhiello', 'testo'),
    str('titolo', 'Titolo', 'testo'),
    txt('testo', 'Testo', 'testo'),
    str('tracceTitolo', 'Titolo della scaletta', 'testo'),
    defineField({
      name: 'tracce',
      title: 'Scaletta',
      description: 'Le pagine da cui ripartire, una traccia per link. Un link a una pagina che non esiste non compare.',
      type: 'array',
      group: 'testo',
      of: [defineArrayMember({ type: 'link' })],
      validation: (r) => r.required().min(1),
    }),
    str('play', 'Pulsante: fa girare il disco', 'giradischi'),
    str('stop', 'Pulsante: ferma il disco', 'giradischi'),
    str('suonoAcceso', 'Interruttore del suono, acceso', 'giradischi'),
    str('suonoSpento', 'Interruttore del suono, spento', 'giradischi'),
  ],
  preview: { prepare: () => ({ title: 'Pagina non trovata (404)' }) },
});

// Descrizione per gli agenti AI: l'apertura di /llms.txt, il file che
// presenta butik agli assistenti (ChatGPT, Claude, Perplexity…). Il resto del
// file (servizi, progetti, pagine, contatti) il sito lo genera dai contenuti
// (apps/web/src/lib/seo/llms.ts, PDR-0007).
export const agentiAi = defineType({
  name: 'agentiAi',
  title: 'Descrizione per gli agenti AI',
  type: 'document',
  fields: [
    defineField({
      name: 'descrizione',
      title: 'Chi è butik, in breve',
      description: "Due o tre frasi che un assistente AI può citare: cosa fa butik, per chi, dove. Apre il file /llms.txt.",
      type: 'text',
      rows: 3,
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'dettagli',
      title: 'Da sapere',
      description: 'Facoltativo: un paragrafo con quello che serve per raccontare bene butik (storia, approccio, numeri).',
      type: 'text',
      rows: 6,
    }),
  ],
  preview: { prepare: () => ({ title: 'Descrizione per gli agenti AI' }) },
});

// tipo Sanity → _id del documento, che è anche l'id dell'entry `elementi` sul sito.
export const ELEMENTI = {
  header: 'header',
  footer: 'footer',
  bannerCookie: 'banner-cookie',
  testimonials: 'testimonials',
  paginaNonTrovata: 'pagina-non-trovata',
  agentiAi: 'agenti-ai',
} as const;

export const elementiTypes = [header, footer, bannerCookie, testimonials, paginaNonTrovata, agentiAi];
