// Pagine del sito come documenti fissi, uno per pagina (_id `pagina-<id>`):
// nello Studio compaiono come voci singole, senza "crea" né "elimina" (vedi
// structure.ts). Ogni tipo rispecchia il ramo corrispondente dello schema Zod
// `pagine` in apps/web/src/content.config.ts: i due vanno tenuti allineati.
import { defineArrayMember, defineField, defineType, type FieldDefinition } from 'sanity';
import { campoPubblicata, gruppoPubblicazione } from './pubblicazione';
import { EMAIL } from '@butik/site-config/links';
import { RETI_SOCIAL } from '@butik/site-config/social';
import { hrefField, urlSicuro } from './testo';
import { sezioniAmmesse, validaSezioni } from './sezioniPagina';

// ── Mattoni ─────────────────────────────────────────────────────────────────
// Stringhe e testi sono obbligatori: lo schema Zod del sito li richiede tutti,
// e Sanity non pubblica un documento con un campo obbligatorio vuoto (ADR-0004).
const str = (name: string, title: string, group?: string) =>
  defineField({
    name,
    title,
    type: 'string',
    group,
    // I campi URL (…Href, LinkedIn) finiscono in un href: solo schemi ammessi.
    // Gli indirizzi email e PEC finiscono in un mailto: solo indirizzi validi.
    validation: (r) =>
      /Href$|^linkedin$/.test(name)
        ? r.required().custom(urlSicuro)
        : /^(email|pec)(Value)?$/.test(name)
          ? r.required().regex(EMAIL, { name: 'email', invert: false }).error('Indirizzo email non valido')
          : r.required(),
  });
const txt = (name: string, title: string, group?: string) =>
  defineField({ name, title, type: 'text', rows: 3, group, validation: (r) => r.required() });
// Liste: il sito le richiede, almeno una voce.
const lista = { validation: (r: any) => r.required().min(1) };
const rich = (name: string, title: string, group?: string) =>
  defineField({ name, title, type: 'testoFormattato', group });

const seo = [str('metaTitle', 'Meta title', 'seo'), txt('metaDescription', 'Meta description', 'seo')];
const seoGroup = { name: 'seo', title: 'SEO' };

const pagina = (name: string, title: string, fields: FieldDefinition[], groups: { name: string; title: string; default?: boolean }[] = []) =>
  defineType({
    name,
    title,
    type: 'document',
    groups: [...groups, seoGroup],
    fields: [...fields, ...seo],
    preview: { prepare: () => ({ title }) },
  });

// ── Corpo delle pagine legali ───────────────────────────────────────────────
// Titoli (H2, H3), elenchi puntati, grassetto, corsivo, codice e link.
export const testoLegale = defineType({
  name: 'testoLegale',
  title: 'Testo',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Paragrafo', value: 'normal' },
        { title: 'Titolo', value: 'h2' },
        { title: 'Sottotitolo', value: 'h3' },
      ],
      lists: [{ title: 'Elenco puntato', value: 'bullet' }],
      marks: {
        decorators: [
          { title: 'Grassetto', value: 'strong' },
          { title: 'Corsivo', value: 'em' },
          { title: 'Codice', value: 'code' },
        ],
        annotations: [
          {
            name: 'link',
            title: 'Link',
            type: 'object',
            fields: [hrefField()],
          },
        ],
      },
    }),
  ],
});

// ── Pagine ──────────────────────────────────────────────────────────────────
// La pagina come lista di sezioni (ADR-0004, *Pages as sections*).
const sezioni = (group?: string) =>
  defineField({
    name: 'sezioni',
    title: 'Sezioni',
    description: 'La pagina, dall\'alto in basso: aggiungete, togliete e trascinate le sezioni. La testata va per prima.',
    type: 'array',
    group,
    validation: validaSezioni,
    of: sezioniAmmesse.map((type) => defineArrayMember({ type })),
  });

export const paginaHome = pagina('paginaHome', 'Home', [sezioni()]);

export const paginaChiSiamo = pagina('paginaChiSiamo', 'Chi siamo', [sezioni()]);

export const paginaContatti = pagina(
  'paginaContatti',
  'Contatti',
  [
    str('headerEyebrow', 'Intestazione', 'testata'),
    str('headerTitle', 'Titolo', 'testata'),
    txt('headerIntro', 'Introduzione', 'testata'),
    str('recapitiEyebrow', 'Intestazione recapiti', 'recapiti'),
    str('emailLabel', 'Email: etichetta', 'recapiti'),
    str('emailValue', 'Email: indirizzo', 'recapiti'),
    str('pecLabel', 'PEC: etichetta', 'recapiti'),
    str('pecValue', 'PEC: indirizzo', 'recapiti'),
    str('sedeLabel', 'Sede: etichetta', 'recapiti'),
    rich('sedeAddress', 'Sede: indirizzo (a capo con Maiusc+Invio)', 'recapiti'),
    str('seguiciLabel', 'Etichetta social', 'recapiti'),
    str('formNameLabel', 'Nome: etichetta', 'form'),
    str('formNamePlaceholder', 'Nome: segnaposto', 'form'),
    str('formEmailLabel', 'Email: etichetta', 'form'),
    str('formEmailPlaceholder', 'Email: segnaposto', 'form'),
    str('formOrgLabel', 'Organizzazione: etichetta', 'form'),
    str('formOrgPlaceholder', 'Organizzazione: segnaposto', 'form'),
    str('formMessageLabel', 'Messaggio: etichetta', 'form'),
    str('formMessagePlaceholder', 'Messaggio: segnaposto', 'form'),
    str('formSubmitLabel', 'Pulsante invio', 'form'),
    str('formSubmitLoadingLabel', 'Pulsante durante l\'invio', 'form'),
    str('formMissingKeyMessage', 'Messaggio: form non configurato', 'form'),
    str('formSuccessMessage', 'Messaggio: inviato', 'form'),
    str('formErrorMessage', 'Messaggio: errore', 'form'),
    str('formNetworkErrorMessage', 'Messaggio: errore di rete', 'form'),
  ],
  [
    { name: 'testata', title: 'Testata' },
    { name: 'recapiti', title: 'Recapiti' },
    { name: 'form', title: 'Form' },
  ],
);

export const paginaPartners = pagina('paginaPartners', 'Partner', [
  str('eyebrow', 'Intestazione'),
  str('title', 'Titolo'),
  defineField({
    name: 'partners',
    ...lista,
    title: 'Partner',
    type: 'array',
    of: [
      defineArrayMember({
        type: 'object',
        name: 'partner',
        fields: [str('name', 'Nome'), defineField({ name: 'logo', title: 'Logo', type: 'image' })],
        preview: { select: { title: 'name', media: 'logo' } },
      }),
    ],
  }),
]);

// Il metodo resta un campo fisso: lo mostra la sezione Metodo, in questa
// pagina come in home.
export const paginaServizi = pagina(
  'paginaServizi',
  'Servizi (indice)',
  [
    sezioni('sezioni'),
    str('metodoEyebrow', 'Intestazione', 'metodo'),
    str('metodoTitle', 'Titolo', 'metodo'),
    defineField({
      name: 'metodo',
      ...lista,
      title: 'Passi',
      description: 'Li mostra la sezione Metodo, qui e in home.',
      type: 'array',
      group: 'metodo',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'passo',
          fields: [str('title', 'Titolo'), txt('description', 'Descrizione')],
          preview: { select: { title: 'title' } },
        }),
      ],
    }),
  ],
  [
    { name: 'sezioni', title: 'Sezioni', default: true },
    { name: 'metodo', title: 'Metodo (anche in home)' },
  ],
);

export const paginaProgetti = pagina('paginaProgetti', 'Progetti (indice)', [sezioni()]);

// «Pubblicata» spento: il sito pubblico non genera la pagina (l'indirizzo non
// esiste) e i link che ci portano spariscono (schemaTypes/pubblicazione.ts).
const pubblicata = (percorso: string) =>
  campoPubblicata(`Spento: ${percorso} non esiste sul sito pubblico e i link che ci portano spariscono.`, true);

export const paginaSostienici = pagina(
  'paginaSostienici',
  'Sostienici',
  [pubblicata('/sostienici'), sezioni()],
  [gruppoPubblicazione],
);

// I testi del banner dei cookie a biglietto, che contiene anche le
// preferenze (ADR-0006, PDR-0006). Le categorie e l'elenco tecnico dei cookie
// (nome, fornitore, durata) restano nel codice, in
// apps/web/src/lib/consent/cookie.ts: devono coincidere con quello che il sito
// scrive davvero, e tools/consent-audit lo verifica.
export const paginaBannerCookie = defineType({
  name: 'paginaBannerCookie',
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

export const paginaTestimonials = defineType({
  name: 'paginaTestimonials',
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

export const paginaPrivacy = pagina('paginaPrivacy', 'Privacy e cookie', [
  str('pageTitle', 'Titolo'),
  str('updatedDate', 'Ultimo aggiornamento (AAAA-MM-GG)'),
  defineField({ name: 'body', title: 'Privacy', type: 'testoLegale' }),
  defineField({
    name: 'cookieTitle',
    title: 'Cookie Policy: titolo',
    description: 'Sul sito ha l\'ancora #cookie, a cui rimanda il banner dei cookie.',
    type: 'string',
    validation: (r) => r.required(),
  }),
  defineField({ name: 'cookieBody', title: 'Cookie Policy', type: 'testoLegale' }),
]);

// Trasparenza: le informazioni che un'impresa sociale che riceve fondi
// pubblici pubblica per legge (L. 112/2013 art. 9; L. 124/2017 art. 1 c. 125).
export const paginaTrasparenza = pagina(
  'paginaTrasparenza',
  'Trasparenza',
  [
    pubblicata('/trasparenza'),
    str('pageTitle', 'Titolo'),
    str('updatedDate', 'Ultimo aggiornamento (AAAA-MM-GG)'),
    defineField({ name: 'body', title: 'Testo', type: 'testoLegale' }),
  ],
  [gruppoPubblicazione],
);

export const paginaTermini = pagina('paginaTermini', 'Termini di utilizzo', [
  str('pageTitle', 'Titolo'),
  str('updatedDate', 'Ultimo aggiornamento (AAAA-MM-GG)'),
  defineField({ name: 'body', title: 'Testo', type: 'testoLegale' }),
]);

// Footer: non è una pagina ma un contenuto condiviso da tutte (e i social
// anche dalla pagina Contatti). Niente SEO. Le icone dei social restano nel
// codice (apps/web/src/data/socials.ts), qui si sceglie la rete fra quelle
// che il sito sa mostrare (@butik/site-config/social).

export const paginaFooter = defineType({
  name: 'paginaFooter',
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

// id del documento Sanity → id dell'entry `pagine` sul sito.
export const PAGINE = {
  paginaHome: 'home',
  paginaChiSiamo: 'chi-siamo',
  paginaContatti: 'contatti',
  paginaPartners: 'partners',
  paginaServizi: 'servizi',
  paginaProgetti: 'progetti',
  paginaSostienici: 'sostienici',
  paginaBannerCookie: 'banner-cookie',
  paginaTestimonials: 'testimonials',
  paginaPrivacy: 'privacy',
  paginaTermini: 'termini',
  paginaTrasparenza: 'trasparenza',
  paginaFooter: 'footer',
} as const;

export const pagineTypes = [
  paginaHome,
  paginaChiSiamo,
  paginaContatti,
  paginaPartners,
  paginaServizi,
  paginaProgetti,
  paginaSostienici,
  paginaBannerCookie,
  paginaTestimonials,
  paginaPrivacy,
  paginaTermini,
  paginaTrasparenza,
  paginaFooter,
];
