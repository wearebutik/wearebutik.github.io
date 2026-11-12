// Sezioni di una pagina: la pagina è una lista di blocchi che l'editor
// aggiunge, toglie e riordina (ADR-0004, *Pages as sections*). Ogni blocco
// corrisponde a un componente del sito (apps/web/src/components/sezioni/
// Sezioni.astro). Il Banner riusa `ctaBanner` delle sezioni dei servizi.
//
// Alcuni blocchi mostrano contenuti che vivono altrove (loghi dalla pagina
// Partner, metodo dalla pagina Servizi, testimonianze dal loro documento,
// progetti con "In evidenza in home"): il blocco dice solo *dove* stanno
// nella pagina.
import { defineArrayMember, defineField, defineType, type ArrayRule } from 'sanity';
import { urlSicuro } from './testo';
import { EMAIL } from '@butik/site-config/links';

const str = (name: string, title: string, description?: string) =>
  defineField({ name, title, type: 'string', description, validation: (r) => r.required() });
const txt = (name: string, title: string) =>
  defineField({ name, title, type: 'text', rows: 3, validation: (r) => r.required() });
const url = (name: string, title: string) =>
  defineField({ name, title, type: 'string', validation: (r) => r.required().custom(urlSicuro) });

const metriche = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    type: 'array',
    description,
    validation: (r) => r.required().min(1),
    of: [
      defineArrayMember({
        type: 'object',
        name: 'metrica',
        fields: [str('value', 'Valore'), str('label', 'Etichetta')],
        preview: { select: { title: 'value', subtitle: 'label' } },
      }),
    ],
  });

// Un oggetto Sanity vuole almeno un campo: i blocchi che mostrano contenuti
// presi altrove ne hanno uno nascosto, mai letto dal sito.
const senzaCampi = defineField({ name: 'segnaposto', type: 'boolean', hidden: true });

const daAltrove = (name: string, title: string, fonte: string) =>
  defineType({
    name,
    title,
    type: 'object',
    description: `I contenuti arrivano da ${fonte}.`,
    fields: [senzaCampi],
    preview: { prepare: () => ({ title, subtitle: `Da ${fonte}` }) },
  });

export const sezioneHero = defineType({
  name: 'sezioneHero',
  title: 'Hero',
  type: 'object',
  description: 'Il titolo principale della pagina, con le card dei servizi. Va messo per primo.',
  fields: [
    str('title', 'Titolo'),
    txt('subtitle', 'Sottotitolo'),
    str('ctaLabel', 'Pulsante: etichetta'),
    url('ctaHref', 'Pulsante: URL'),
    str('exploreLabel', 'Link servizi: etichetta'),
    url('exploreHref', 'Link servizi: URL'),
    defineField({
      name: 'fotoSfondo',
      title: 'Foto di sfondo',
      description:
        "Scorrono in loop con dissolvenza, nell'ordine della lista. La prima resta ferma per chi riduce le animazioni. Sono decorative: il testo dell'hero dice già tutto, quindi non servono testo alternativo né didascalia.",
      type: 'array',
      of: [defineArrayMember({ type: 'figura' })],
    }),
  ],
  preview: { select: { subtitle: 'title' }, prepare: ({ subtitle }) => ({ title: 'Hero', subtitle }) },
});

export const sezioneLoghi = daAltrove('sezioneLoghi', 'Loghi dei partner', 'la pagina Partner');

export const sezioneNumeri = defineType({
  name: 'sezioneNumeri',
  title: 'Numeri',
  type: 'object',
  fields: [
    metriche('butikMetrics', 'Numeri butik'),
    str('mmwLabel', 'Etichetta Milano Music Week'),
    metriche('mmwMetrics', 'Numeri Milano Music Week', 'Si mostra l’ultima voce, accanto ai numeri di butik: mettete per ultimo il dato più forte.'),
  ],
  preview: { prepare: () => ({ title: 'Numeri' }) },
});

export const sezioneMetodo = daAltrove('sezioneMetodo', 'Metodo', 'la pagina Servizi (gruppo Metodo)');

export const sezioneTestimonianze = daAltrove(
  'sezioneTestimonianze',
  'Testimonianze',
  'il documento Testimonianze; senza testimonianze la sezione non compare',
);

export const sezioneProgetti = defineType({
  name: 'sezioneProgetti',
  title: 'Progetti in evidenza',
  type: 'object',
  description: 'Mostra i primi 4 progetti con "In evidenza in home", nell\'ordine dell\'elenco Progetti.',
  fields: [
    str('eyebrow', 'Intestazione'),
    str('title', 'Titolo'),
    defineField({ name: 'intro', title: 'Sottotitolo', type: 'string', description: 'Facoltativo.' }),
    str('ctaLabel', 'Pulsante verso tutti i progetti: etichetta'),
  ],
  preview: { select: { subtitle: 'title' }, prepare: ({ subtitle }) => ({ title: 'Progetti in evidenza', subtitle }) },
});

export const sezioneChiSiamo = defineType({
  name: 'sezioneChiSiamo',
  title: 'Chi siamo',
  type: 'object',
  fields: [
    str('title', 'Titolo'),
    txt('p1', 'Paragrafo 1'),
    txt('p2', 'Paragrafo 2'),
    txt('p3', 'Paragrafo 3'),
    str('ctaLabel', 'Link: etichetta'),
    url('ctaHref', 'Link: URL'),
    defineField({
      name: 'image',
      title: 'Immagine',
      type: 'image',
      options: { hotspot: true },
      description: 'Facoltativa: senza, il sito usa la foto predefinita.',
    }),
    str('imageAlt', 'Testo alternativo immagine'),
  ],
  preview: { select: { subtitle: 'title', media: 'image' }, prepare: ({ subtitle, media }) => ({ title: 'Chi siamo', subtitle, media }) },
});

export const sezioneNewsletter = defineType({
  name: 'sezioneNewsletter',
  title: 'Newsletter',
  type: 'object',
  description: 'Per ora il sito non la mostra: il form non è ancora collegato a un servizio di invio della newsletter.',
  fields: [
    str('title', 'Titolo'),
    txt('body', 'Testo'),
    str('placeholder', 'Segnaposto email'),
    str('button', 'Pulsante'),
    defineField({ name: 'privacy', title: 'Nota privacy', type: 'testoFormattato' }),
    str('success', 'Messaggio di conferma'),
  ],
  preview: { select: { subtitle: 'title' }, prepare: ({ subtitle }) => ({ title: 'Newsletter', subtitle }) },
});

const testo = (title = 'Testo') =>
  defineField({ name: 'testo', title, type: 'testoFormattato', description: 'Un paragrafo per blocco.', validation: (r) => r.required() });

export const sezioneTestataFoto = defineType({
  name: 'sezioneTestataFoto',
  title: 'Testata con foto',
  type: 'object',
  description: 'Il titolo principale della pagina su una foto. Va messa per prima.',
  fields: [
    str('title', 'Titolo'),
    txt('subtitle', 'Sottotitolo'),
    defineField({
      name: 'image',
      title: 'Immagine',
      type: 'image',
      options: { hotspot: true },
      description: 'Facoltativa: senza, il sito usa la foto predefinita.',
    }),
    str('imageAlt', 'Testo alternativo immagine'),
  ],
  preview: { select: { subtitle: 'title', media: 'image' }, prepare: ({ subtitle, media }) => ({ title: 'Testata con foto', subtitle, media }) },
});

export const sezioneIntestazione = defineType({
  name: 'sezioneIntestazione',
  title: 'Intestazione',
  type: 'object',
  description: 'Il titolo principale della pagina con un\'introduzione. Va messa per prima.',
  fields: [str('eyebrow', 'Intestazione'), str('title', 'Titolo'), testo('Introduzione')],
  preview: { select: { subtitle: 'title' }, prepare: ({ subtitle }) => ({ title: 'Intestazione', subtitle }) },
});

export const sezioneTitolo = defineType({
  name: 'sezioneTitolo',
  title: 'Titolo',
  type: 'object',
  description: 'Il titolo principale della pagina, centrato, senza testo. Va messo per primo.',
  fields: [str('eyebrow', 'Intestazione'), str('title', 'Titolo')],
  preview: { select: { subtitle: 'title' }, prepare: ({ subtitle }) => ({ title: 'Titolo', subtitle }) },
});

export const sezioneTesto = defineType({
  name: 'sezioneTesto',
  title: 'Testo',
  type: 'object',
  fields: [str('eyebrow', 'Intestazione'), testo()],
  preview: { select: { subtitle: 'eyebrow' }, prepare: ({ subtitle }) => ({ title: 'Testo', subtitle }) },
});

export const sezioneMissione = defineType({
  name: 'sezioneMissione',
  title: 'Missione e SDG',
  type: 'object',
  fields: [
    str('missionEyebrow', 'Intestazione missione'),
    txt('missionStatement', 'Missione'),
    str('sdgEyebrow', 'Intestazione SDG'),
    txt('sdgIntro', 'Introduzione SDG'),
    str('sdgObiettivoLabel', 'Etichetta "Obiettivo"'),
    defineField({
      name: 'sdg',
      title: 'Obiettivi SDG',
      type: 'array',
      validation: (r) => r.required().min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'obiettivo',
          fields: [defineField({ name: 'num', title: 'Numero', type: 'number', validation: (r) => r.required() }), str('title', 'Titolo')],
          preview: { select: { title: 'title', subtitle: 'num' } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Missione e SDG' }) },
});

export const sezioneTeam = defineType({
  name: 'sezioneTeam',
  title: 'Team',
  type: 'object',
  fields: [
    str('eyebrow', 'Intestazione'),
    testo(),
    defineField({
      name: 'founders',
      title: 'Persone',
      type: 'array',
      validation: (r) => r.required().min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'founder',
          fields: [
            str('name', 'Nome'),
            str('role', 'Ruolo'),
            txt('bio', 'Bio'),
            defineField({
              name: 'email',
              title: 'Email',
              type: 'string',
              validation: (r) => r.required().regex(EMAIL, { name: 'email', invert: false }).error('Indirizzo email non valido'),
            }),
            url('linkedin', 'LinkedIn (URL)'),
            defineField({ name: 'photo', title: 'Foto', type: 'image', options: { hotspot: true } }),
          ],
          preview: { select: { title: 'name', subtitle: 'role', media: 'photo' } },
        }),
      ],
    }),
    str('linkedinLabel', 'Etichetta link LinkedIn'),
  ],
  preview: { select: { subtitle: 'eyebrow' }, prepare: ({ subtitle }) => ({ title: 'Team', subtitle }) },
});

export const sezioneCitazione = defineType({
  name: 'sezioneCitazione',
  title: 'Citazione',
  type: 'object',
  description: 'Una frase in evidenza su fondo scuro.',
  fields: [txt('quote', 'Citazione'), str('author', 'Autore')],
  preview: { select: { subtitle: 'author' }, prepare: ({ subtitle }) => ({ title: 'Citazione', subtitle }) },
});

export const sezioneElencoServizi = daAltrove('sezioneElencoServizi', 'Elenco dei servizi', "l'elenco Servizi");

export const sezioneElencoProgetti = defineType({
  name: 'sezioneElencoProgetti',
  title: 'Elenco dei progetti',
  type: 'object',
  description: 'Tutti i progetti pubblicati, nell\'ordine dell\'elenco Progetti.',
  fields: [str('clienteLabel', 'Etichetta "Cliente"')],
  preview: { prepare: () => ({ title: 'Elenco dei progetti', subtitle: "Dall'elenco Progetti" }) },
});

export const sezioniPagina = [
  sezioneHero,
  sezioneLoghi,
  sezioneNumeri,
  sezioneMetodo,
  sezioneTestimonianze,
  sezioneProgetti,
  sezioneChiSiamo,
  sezioneNewsletter,
  sezioneTestataFoto,
  sezioneIntestazione,
  sezioneTitolo,
  sezioneTesto,
  sezioneMissione,
  sezioneTeam,
  sezioneCitazione,
  sezioneElencoServizi,
  sezioneElencoProgetti,
];

// Blocchi che ogni pagina a sezioni può usare, nell'ordine del menu
// "Aggiungi": prima le testate (portano l'H1), poi il resto.
export const sezioniAmmesse = [
  'sezioneHero',
  'sezioneTestataFoto',
  'sezioneIntestazione',
  'sezioneTitolo',
  'sezioneTesto',
  'sezioneLoghi',
  'sezioneNumeri',
  'sezioneMetodo',
  'sezioneMissione',
  'sezioneTeam',
  'sezioneCitazione',
  'sezioneTestimonianze',
  'sezioneProgetti',
  'sezioneElencoProgetti',
  'sezioneElencoServizi',
  'sezioneChiSiamo',
  'ctaBanner',
  'sezioneNewsletter',
];

// Le testate portano l'H1 della pagina: al massimo una, e in cima.
const TESTATE = new Set(['sezioneHero', 'sezioneTestataFoto', 'sezioneIntestazione', 'sezioneTitolo']);
type Blocco = { _type?: string };
export const validaSezioni = (r: ArrayRule<Blocco[]>) =>
  r.required().min(1).custom((sezioni) => {
    const testate = (sezioni ?? []).map((s, i) => (TESTATE.has(s._type ?? '') ? i : -1)).filter((i) => i >= 0);
    if (testate.length > 1) return 'Una sola testata per pagina (Hero, Testata con foto, Intestazione o Titolo).';
    if (testate.length === 1 && testate[0] !== 0) return 'La testata va messa per prima.';
    return true;
  });
