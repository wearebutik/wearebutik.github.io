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
import { notaSezione, type Fonte } from '../notaSezione';
import { ICONE_CARD } from '@butik/site-config/icone';

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

// I blocchi che mostrano contenuti presi altrove non hanno testi propri: il
// loro unico campo è una nota che dice da dove arrivano i contenuti, con il
// link al documento da modificare. Il campo non salva niente e il sito non lo
// legge (un oggetto Sanity vuole almeno un campo).
const daAltrove = (name: string, title: string, sottotitolo: string, fonte: Fonte) =>
  defineType({
    name,
    title,
    type: 'object',
    fields: [
      defineField({
        name: 'segnaposto',
        title: 'Da dove arrivano i contenuti',
        type: 'boolean',
        readOnly: true,
        components: { field: notaSezione(fonte) },
      }),
    ],
    preview: { prepare: () => ({ title, subtitle: sottotitolo }) },
  });

export const sezioneHero = defineType({
  name: 'sezioneHero',
  title: 'Hero',
  type: 'object',
  description: 'Il titolo principale della pagina, con le card in basso. Va messo per primo.',
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
    // Card in basso sulle foto (da mobile una lista compatta). Vicine ai
    // servizi, ma sono contenuto della home: si scrivono qui.
    defineField({
      name: 'card',
      title: 'Card',
      description: "In basso sulle foto, nell'ordine della lista. Di solito una per servizio, con il link al servizio nella pagina Servizi (/servizi/#nome-del-servizio).",
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'cardHero',
          fields: [
            str('title', 'Titolo'),
            str('desc', 'Descrizione'),
            url('href', 'Link'),
            defineField({
              name: 'icona',
              title: 'Icona',
              type: 'string',
              description: 'Facoltativa: il disegno in filigrana nell\'angolo della card.',
              options: { list: ICONE_CARD.map(({ id, title }) => ({ value: id, title })) },
            }),
          ],
          preview: { select: { title: 'title', subtitle: 'href' } },
        }),
      ],
    }),
  ],
  preview: { select: { subtitle: 'title' }, prepare: ({ subtitle }) => ({ title: 'Hero', subtitle }) },
});

export const sezioneLoghi = daAltrove('sezioneLoghi', 'Loghi dei partner', 'Dalla pagina Partner', {
  testo: 'I loghi e il loro ordine si modificano nella pagina Partner: lo stesso elenco compare qui e su /partners. Questo blocco decide solo dove mostrarli.',
  documento: { id: 'pagina-partners', type: 'paginaPartners', etichetta: 'Apri la pagina Partner' },
});

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

export const sezioneMetodo = daAltrove('sezioneMetodo', 'Metodo', 'Dalla pagina Servizi', {
  testo: 'Intestazione, titolo e passi del metodo si modificano nella pagina Servizi, scheda "Metodo (anche in home)". Questo blocco decide solo dove mostrarli.',
  documento: { id: 'pagina-servizi', type: 'paginaServizi', etichetta: 'Apri la pagina Servizi' },
});

export const sezioneTestimonianze = daAltrove('sezioneTestimonianze', 'Testimonianze', 'Dal documento Testimonianze', {
  testo: 'Intestazione, titolo e testimonianze si modificano nel documento Testimonianze. Senza testimonianze la sezione non compare. Questo blocco decide solo dove mostrarle.',
  documento: { id: 'pagina-testimonials', type: 'paginaTestimonials', etichetta: 'Apri le Testimonianze' },
});

export const sezioneProgetti = defineType({
  name: 'sezioneProgetti',
  title: 'Progetti in evidenza',
  type: 'object',
  fields: [
    str('eyebrow', 'Intestazione'),
    str('title', 'Titolo'),
    defineField({ name: 'intro', title: 'Sottotitolo', type: 'string', description: 'Facoltativo.' }),
    defineField({
      name: 'progetti',
      title: 'Progetti',
      description: "Quali progetti mostrare, nell'ordine della lista (trascinateli per riordinarli), fino a 4. Indipendente dall'ordine del portfolio.",
      type: 'array',
      validation: (r) => r.required().min(1).max(4).unique(),
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'progetto' }] })],
    }),
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

export const sezioneElencoServizi = defineType({
  name: 'sezioneElencoServizi',
  title: 'Elenco dei servizi',
  type: 'object',
  fields: [
    defineField({
      name: 'servizi',
      title: 'Servizi',
      description:
        "Quali servizi mostrare, nell'ordine della lista: trascinateli per riordinarli. Un servizio nuovo compare solo dopo averlo aggiunto qui. I testi si modificano nel servizio (Scheda e Hero).",
      type: 'array',
      validation: (r) => r.required().min(1).unique(),
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'servizio' }] })],
    }),
  ],
  preview: {
    select: { n: 'servizi.length' },
    prepare: ({ n }) => ({ title: 'Elenco dei servizi', subtitle: n ? `${n} servizi` : 'Nessun servizio scelto' }),
  },
});

export const sezioneElencoProgetti = daAltrove('sezioneElencoProgetti', 'Elenco dei progetti', "Dall'elenco Progetti", {
  testo:
    "Mostra tutti i progetti pubblicati, nell'ordine dell'elenco Progetti: lì si riordinano trascinandoli. I testi delle card (titolo, sottotitolo, categoria, anno, cliente) si modificano in ciascun progetto.",
});

export const sezioneRiquadri = defineType({
  name: 'sezioneRiquadri',
  title: 'Riquadri con foto',
  type: 'object',
  description: 'Una griglia di foto, ciascuna con il suo titolo sotto (tre per riga).',
  fields: [
    defineField({ name: 'eyebrow', title: 'Intestazione', type: 'string', description: 'Facoltativa.' }),
    defineField({
      name: 'riquadri',
      title: 'Riquadri',
      type: 'array',
      validation: (r) => r.required().min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'riquadro',
          fields: [
            str('title', 'Titolo'),
            defineField({ name: 'image', title: 'Foto', type: 'image', options: { hotspot: true }, validation: (r) => r.required() }),
            str('alt', 'Testo alternativo della foto'),
          ],
          preview: { select: { title: 'title', media: 'image' } },
        }),
      ],
    }),
  ],
  preview: { select: { n: 'riquadri.length' }, prepare: ({ n }) => ({ title: 'Riquadri con foto', subtitle: n ? `${n} riquadri` : undefined }) },
});

export const sezioneDonazioni = defineType({
  name: 'sezioneDonazioni',
  title: 'Donazioni',
  type: 'object',
  description: 'Il pulsante PayPal e i dati per il bonifico, affiancati. IBAN e BIC vuoti non si mostrano.',
  fields: [
    str('paypalTitle', 'PayPal: titolo'),
    str('paypalLabel', 'PayPal: etichetta del pulsante'),
    url('paypalHref', 'PayPal: link della donazione'),
    str('bonificoTitle', 'Bonifico: titolo'),
    str('beneficiario', 'Bonifico: beneficiario'),
    str('banca', 'Bonifico: banca e filiale'),
    defineField({ name: 'iban', title: 'Bonifico: IBAN', type: 'string' }),
    defineField({ name: 'bic', title: 'Bonifico: BIC/SWIFT', type: 'string' }),
    str('causale', 'Bonifico: causale'),
  ],
  preview: { prepare: () => ({ title: 'Donazioni', subtitle: 'PayPal e bonifico' }) },
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
  sezioneRiquadri,
  sezioneDonazioni,
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
  'sezioneRiquadri',
  'sezioneDonazioni',
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
