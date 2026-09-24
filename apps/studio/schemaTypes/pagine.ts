// Pagine del sito come documenti fissi, uno per pagina (_id `pagina-<id>`):
// nello Studio compaiono come voci singole, senza "crea" né "elimina" (vedi
// structure.ts). Ogni tipo rispecchia il ramo corrispondente dello schema Zod
// `pagine` in apps/web/src/content.config.ts: i due vanno tenuti allineati.
import { defineArrayMember, defineField, defineType, type FieldDefinition } from 'sanity';

// ── Mattoni ─────────────────────────────────────────────────────────────────
// Stringhe e testi sono obbligatori: lo schema Zod del sito li richiede tutti,
// e Sanity non pubblica un documento con un campo obbligatorio vuoto (ADR-0004).
const str = (name: string, title: string, group?: string) =>
  defineField({ name, title, type: 'string', group, validation: (r) => r.required() });
const txt = (name: string, title: string, group?: string) =>
  defineField({ name, title, type: 'text', rows: 3, group, validation: (r) => r.required() });
// Liste: il sito le richiede, almeno una voce.
const lista = { validation: (r: any) => r.required().min(1) };
const rich = (name: string, title: string, group?: string) =>
  defineField({ name, title, type: 'testoFormattato', group });

const seo = [str('metaTitle', 'Meta title', 'seo'), txt('metaDescription', 'Meta description', 'seo')];
const seoGroup = { name: 'seo', title: 'SEO' };

const metriche = (name: string, title: string, group?: string) =>
  defineField({
    name,
    title,
    type: 'array',
    group,
    ...lista,
    of: [
      defineArrayMember({
        type: 'object',
        name: 'metrica',
        fields: [str('value', 'Valore'), str('label', 'Etichetta')],
        preview: { select: { title: 'value', subtitle: 'label' } },
      }),
    ],
  });

const pagina = (name: string, title: string, fields: FieldDefinition[], groups: { name: string; title: string }[] = []) =>
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
            fields: [{ name: 'href', title: 'URL', type: 'string', validation: (r) => r.required() }],
          },
        ],
      },
    }),
  ],
});

// ── Pagine ──────────────────────────────────────────────────────────────────
export const paginaHome = pagina(
  'paginaHome',
  'Home',
  [
    str('heroTitle', 'Titolo', 'hero'),
    txt('heroSubtitle', 'Sottotitolo', 'hero'),
    str('heroCtaLabel', 'Pulsante: etichetta', 'hero'),
    str('heroCtaHref', 'Pulsante: URL', 'hero'),
    str('heroExploreLabel', 'Link servizi: etichetta', 'hero'),
    str('heroExploreHref', 'Link servizi: URL', 'hero'),
    metriche('butikMetrics', 'Numeri Butik', 'numeri'),
    str('mmwLabel', 'Etichetta Milano Music Week', 'numeri'),
    metriche('mmwMetrics', 'Numeri Milano Music Week', 'numeri'),
    str('ctaBanner1Title', 'Titolo', 'banner1'),
    txt('ctaBanner1Body', 'Testo', 'banner1'),
    str('ctaBanner1PrimaryLabel', 'Pulsante principale: etichetta', 'banner1'),
    str('ctaBanner1PrimaryHref', 'Pulsante principale: URL', 'banner1'),
    str('ctaBanner1SecondaryLabel', 'Pulsante secondario: etichetta', 'banner1'),
    str('ctaBanner1SecondaryHref', 'Pulsante secondario: URL', 'banner1'),
    str('aboutTitle', 'Titolo', 'about'),
    txt('aboutP1', 'Paragrafo 1', 'about'),
    txt('aboutP2', 'Paragrafo 2', 'about'),
    txt('aboutP3', 'Paragrafo 3', 'about'),
    str('aboutCtaLabel', 'Link: etichetta', 'about'),
    str('aboutCtaHref', 'Link: URL', 'about'),
    str('aboutImageAlt', 'Testo alternativo immagine', 'about'),
    str('ctaBanner2Title', 'Titolo', 'banner2'),
    str('ctaBanner2PrimaryLabel', 'Pulsante principale: etichetta', 'banner2'),
    str('ctaBanner2PrimaryHref', 'Pulsante principale: URL', 'banner2'),
    str('ctaBanner2SecondaryLabel', 'Pulsante secondario: etichetta', 'banner2'),
    str('ctaBanner2SecondaryHref', 'Pulsante secondario: URL', 'banner2'),
    str('newsletterTitle', 'Titolo', 'newsletter'),
    txt('newsletterBody', 'Testo', 'newsletter'),
    str('newsletterPlaceholder', 'Segnaposto email', 'newsletter'),
    str('newsletterButton', 'Pulsante', 'newsletter'),
    rich('newsletterPrivacy', 'Nota privacy', 'newsletter'),
    str('newsletterSuccess', 'Messaggio di conferma', 'newsletter'),
  ],
  [
    { name: 'hero', title: 'Hero' },
    { name: 'numeri', title: 'Numeri' },
    { name: 'banner1', title: 'Banner 1' },
    { name: 'about', title: 'Chi siamo' },
    { name: 'banner2', title: 'Banner 2' },
    { name: 'newsletter', title: 'Newsletter' },
  ],
);

export const paginaChiSiamo = pagina(
  'paginaChiSiamo',
  'Chi siamo',
  [
    str('heroTitle', 'Titolo', 'intro'),
    txt('heroSubtitle', 'Sottotitolo', 'intro'),
    str('heroImageAlt', 'Testo alternativo immagine', 'intro'),
    str('introEyebrow', 'Intestazione', 'intro'),
    rich('introP1', 'Paragrafo 1', 'intro'),
    rich('introP2', 'Paragrafo 2', 'intro'),
    rich('introP3', 'Paragrafo 3', 'intro'),
    rich('introP4', 'Paragrafo 4', 'intro'),
    str('missionEyebrow', 'Intestazione', 'missione'),
    txt('missionStatement', 'Missione', 'missione'),
    str('sdgEyebrow', 'Intestazione', 'missione'),
    txt('sdgIntro', 'Introduzione SDG', 'missione'),
    defineField({
      name: 'sdg',
      ...lista,
      title: 'Obiettivi SDG',
      type: 'array',
      group: 'missione',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'obiettivo',
          fields: [defineField({ name: 'num', title: 'Numero', type: 'number', validation: (r) => r.required() }), str('title', 'Titolo')],
          preview: { select: { title: 'title', subtitle: 'num' } },
        }),
      ],
    }),
    str('sdgObiettivoLabel', 'Etichetta "Obiettivo"', 'missione'),
    str('teamEyebrow', 'Intestazione', 'team'),
    rich('teamP1', 'Paragrafo 1', 'team'),
    rich('teamP2', 'Paragrafo 2', 'team'),
    rich('teamP3', 'Paragrafo 3', 'team'),
    defineField({
      name: 'founders',
      ...lista,
      title: 'Fondatrici',
      type: 'array',
      group: 'team',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'founder',
          fields: [
            str('name', 'Nome'),
            str('role', 'Ruolo'),
            txt('bio', 'Bio'),
            str('email', 'Email'),
            str('linkedin', 'LinkedIn (URL)'),
            defineField({ name: 'photo', title: 'Foto', type: 'image', options: { hotspot: true } }),
          ],
          preview: { select: { title: 'name', subtitle: 'role', media: 'photo' } },
        }),
      ],
    }),
    str('linkedinLabel', 'Etichetta link LinkedIn', 'team'),
    txt('testimonialQuote', 'Citazione', 'chiusura'),
    str('testimonialAuthor', 'Autore citazione', 'chiusura'),
    str('ctaTitle', 'Banner: titolo', 'chiusura'),
    txt('ctaBody', 'Banner: testo', 'chiusura'),
    str('ctaLabel', 'Banner: etichetta pulsante', 'chiusura'),
    str('ctaHref', 'Banner: URL pulsante', 'chiusura'),
  ],
  [
    { name: 'intro', title: 'Intro' },
    { name: 'missione', title: 'Missione e SDG' },
    { name: 'team', title: 'Team' },
    { name: 'chiusura', title: 'Chiusura' },
  ],
);

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

export const paginaServizi = pagina(
  'paginaServizi',
  'Servizi (indice)',
  [
    str('headerEyebrow', 'Intestazione', 'testata'),
    str('headerTitle', 'Titolo', 'testata'),
    txt('headerIntro1', 'Introduzione 1', 'testata'),
    rich('headerIntro2', 'Introduzione 2', 'testata'),
    str('metodoEyebrow', 'Intestazione', 'metodo'),
    str('metodoTitle', 'Titolo', 'metodo'),
    defineField({
      name: 'metodo',
      ...lista,
      title: 'Passi (anche in home)',
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
    defineField({
      name: 'filtri',
      ...lista,
      title: 'Filtri per pubblico',
      description: 'Il primo è quello attivo all\'apertura e vale "tutti". Gli id vanno usati nel campo Pubblico dei servizi.',
      type: 'array',
      group: 'filtri',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'filtro',
          fields: [str('id', 'Id'), str('label', 'Etichetta')],
          preview: { select: { title: 'label', subtitle: 'id' } },
        }),
      ],
    }),
    str('ctaTitle', 'Titolo', 'chiusura'),
    str('ctaPrimaryLabel', 'Pulsante principale: etichetta', 'chiusura'),
    str('ctaPrimaryHref', 'Pulsante principale: URL', 'chiusura'),
    str('ctaSecondaryLabel', 'Pulsante secondario: etichetta', 'chiusura'),
    str('ctaSecondaryHref', 'Pulsante secondario: URL', 'chiusura'),
  ],
  [
    { name: 'testata', title: 'Testata' },
    { name: 'metodo', title: 'Metodo' },
    { name: 'filtri', title: 'Filtri' },
    { name: 'chiusura', title: 'Chiusura' },
  ],
);

export const paginaProgetti = pagina('paginaProgetti', 'Progetti (indice)', [
  str('eyebrow', 'Intestazione'),
  str('title', 'Titolo'),
  str('clienteLabel', 'Etichetta "Cliente"'),
]);

export const paginaTestimonials = defineType({
  name: 'paginaTestimonials',
  title: 'Testimonianze',
  type: 'document',
  fields: [
    str('eyebrow', 'Intestazione'),
    str('sectionTitle', 'Titolo'),
    defineField({
      name: 'testimonials',
      ...lista,
      title: 'Testimonianze (home e Chi siamo)',
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

export const paginaTermini = pagina('paginaTermini', 'Termini di utilizzo', [
  str('pageTitle', 'Titolo'),
  str('updatedDate', 'Ultimo aggiornamento (AAAA-MM-GG)'),
  defineField({ name: 'body', title: 'Testo', type: 'testoLegale' }),
]);

// id del documento Sanity → id dell'entry `pagine` sul sito.
export const PAGINE = {
  paginaHome: 'home',
  paginaChiSiamo: 'chi-siamo',
  paginaContatti: 'contatti',
  paginaPartners: 'partners',
  paginaServizi: 'servizi',
  paginaProgetti: 'progetti',
  paginaTestimonials: 'testimonials',
  paginaPrivacy: 'privacy',
  paginaTermini: 'termini',
} as const;

export const pagineTypes = [
  paginaHome,
  paginaChiSiamo,
  paginaContatti,
  paginaPartners,
  paginaServizi,
  paginaProgetti,
  paginaTestimonials,
  paginaPrivacy,
  paginaTermini,
];
