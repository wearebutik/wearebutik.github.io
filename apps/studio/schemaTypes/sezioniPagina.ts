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

export const sezioniPagina = [
  sezioneHero,
  sezioneLoghi,
  sezioneNumeri,
  sezioneMetodo,
  sezioneTestimonianze,
  sezioneProgetti,
  sezioneChiSiamo,
  sezioneNewsletter,
];

// Blocchi ammessi nella home, nell'ordine del menu "Aggiungi".
export const sezioniHome = [
  'sezioneHero',
  'sezioneLoghi',
  'sezioneNumeri',
  'sezioneMetodo',
  'sezioneTestimonianze',
  'sezioneProgetti',
  'ctaBanner',
  'sezioneChiSiamo',
  'sezioneNewsletter',
];

// L'hero porta l'H1 della pagina: al massimo uno, e in cima.
type Blocco = { _type?: string };
export const validaSezioni = (r: ArrayRule<Blocco[]>) =>
  r.required().min(1).custom((sezioni) => {
    const hero = (sezioni ?? []).map((s, i) => (s._type === 'sezioneHero' ? i : -1)).filter((i) => i >= 0);
    if (hero.length > 1) return 'Una sola sezione Hero per pagina.';
    if (hero.length === 1 && hero[0] !== 0) return 'La sezione Hero va messa per prima.';
    return true;
  });
