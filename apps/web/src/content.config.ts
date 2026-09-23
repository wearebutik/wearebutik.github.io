import { defineCollection, z } from 'astro:content';
import type { SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { progettiLoader } from '#lib/sanity';

// Tipo dell'helper `image()` fornito dallo schema context di Astro: consente di
// dichiarare riferimenti a media (risolti a build-time) anche dentro gli array.
type ImageFn = SchemaContext['image'];

const serviziCollection = defineCollection({
  loader: glob({
    pattern: '*.{md,mdx}',
    base: './src/content/servizi',
    generateId: ({ entry }) => entry.replace(/\.(mdx?)$/, ''),
  }),
  schema: ({ image }) => z.object({
    title: z.string(),
    subtitle: z.string(),
    heroImage: image(),
    heroAlt: z.string().optional().default(''),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    ogImage: image().optional(),
    ogCta: z.string().optional(),
    // Trattamento dell'hero di questa scheda: si sceglie servizio per
    // servizio (vedi components/serviziHero/ServiceHero.astro).
    //   banner = il trattamento comune a progetti e pagine
    //   a/b/c  = split al target · claim tipografico · scheda-offerta
    heroVariant: z.enum(['banner', 'a', 'b', 'c']).optional().default('banner'),
    // Pubblici a cui il servizio parla, come id dei filtri della pagina
    // /servizi (vedi `filtri` in `pagine/servizi`). È la stessa informazione
    // degli "Adatto a" nel corpo della scheda, in forma filtrabile.
    audience: z.array(z.object({ id: z.string() })).optional().default([]),
    order: z.number().optional().default(0),
    draft: z.boolean().optional().default(false),
  }),
});

// Progetti da Sanity (PoC): il loader legge i documenti `progetto` a build
// time. Le immagini arrivano come URL della CDN Sanity; Astro le scarica e le
// ottimizza come le locali (vedi `image.domains` in astro.config.mjs).
const progettiCollection = defineCollection({
  loader: progettiLoader(),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    heroImage: z.string().url(),
    heroAlt: z.string().optional().default(''),
    client: z.string().optional(),
    year: z.number().optional(),
    category: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    ogImage: z.string().url().optional(),
    ogCta: z.string().optional(),
    order: z.number().optional().default(0),
    featured: z.boolean().optional().default(false),
    featuredOrder: z.number().optional().default(0),
    draft: z.boolean().optional().default(false),
    // Corpo in Portable Text, reso da astro-portabletext in progetti/[slug].astro
    body: z.array(z.any()).optional().default([]),
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Collezione `pagine` (ADR-0004): pagine editoriali "singleton" la cui copy era
// hardcoded nei `.astro`. Ogni entry è una pagina a sé (home, chi-siamo,
// contatti, partners, servizi), con un set di campi diverso: per questo usiamo
// una discriminated union su `type`.
//
// Contenuti ripetuti (metriche, servizi, partner, founder, obiettivi SDG) sono
// modellati come ARRAY di oggetti, con i media (loghi, foto) come riferimenti
// `image()` risolti a build-time. Gli schema Sitepins in `.sitepins/schema/pagine/*`
// rispecchiano questi array con campi `type: "list"` + sotto-`fields` (media =
// `type: "media"`) — vedi nota nel summary sui limiti di verifica di Sitepins.
// Zod resta la source of truth tipata: l'allineamento Zod ↔ Sitepins è vigilato
// dalla skill content-check.
//
// Nota: alcune stringhe (paragrafi con <strong>/link, indirizzo) contengono HTML
// inline e vengono rese con `set:html` nelle pagine per mantenere l'output
// visivamente identico alla versione hardcoded.
// ─────────────────────────────────────────────────────────────────────────────

// Voce metrica (Numbers): valore + etichetta.
const metricSchema = z.object({
  value: z.string(),
  label: z.string(),
});

// Card servizio in hero home: titolo, link, descrizione breve e la prova
// (valore + etichetta) mostrata in fondo alla card. `href` porta alla scheda
// servizio: da lì si ricava lo slug per l'icona, che resta config di design.
const heroServizioSchema = z.object({
  title: z.string(),
  href: z.string(),
  description: z.string(),
  statValue: z.string(),
  statLabel: z.string(),
});

const paginaHome = z.object({
  type: z.literal('home'),
  // Etichetta della voce nell'elenco Sitepins (non renderizzata sul sito).
  title: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  // Hero
  heroTitle: z.string(),
  heroSubtitle: z.string(),
  heroCtaLabel: z.string(),
  heroCtaHref: z.string(),
  heroExploreLabel: z.string(),
  heroExploreHref: z.string(),
  heroServizi: z.array(heroServizioSchema),
  // Numeri / impatto
  butikMetrics: z.array(metricSchema),
  mmwLabel: z.string(),
  mmwMetrics: z.array(metricSchema),
  // CTA banner 1 (dopo Metodo/Testimonials/PortfolioGrid)
  ctaBanner1Title: z.string(),
  ctaBanner1Body: z.string(),
  ctaBanner1PrimaryLabel: z.string(),
  ctaBanner1PrimaryHref: z.string(),
  ctaBanner1SecondaryLabel: z.string(),
  ctaBanner1SecondaryHref: z.string(),
  // About inline
  aboutTitle: z.string(),
  aboutP1: z.string(),
  aboutP2: z.string(),
  aboutP3: z.string(),
  aboutCtaLabel: z.string(),
  aboutCtaHref: z.string(),
  aboutImageAlt: z.string(),
  // CTA banner 2 (dopo AboutInline, senza body)
  ctaBanner2Title: z.string(),
  ctaBanner2PrimaryLabel: z.string(),
  ctaBanner2PrimaryHref: z.string(),
  ctaBanner2SecondaryLabel: z.string(),
  ctaBanner2SecondaryHref: z.string(),
  // Newsletter
  newsletterTitle: z.string(),
  newsletterBody: z.string(),
  newsletterPlaceholder: z.string(),
  newsletterButton: z.string(),
  newsletterPrivacy: z.string(),
  newsletterSuccess: z.string(),
});

const paginaChiSiamo = (image: ImageFn) => z.object({
  type: z.literal('chi-siamo'),
  // Etichetta della voce nell'elenco Sitepins (non renderizzata sul sito).
  title: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  heroTitle: z.string(),
  heroSubtitle: z.string(),
  heroImageAlt: z.string(),
  introEyebrow: z.string(),
  introP1: z.string(),
  introP2: z.string(),
  introP3: z.string(),
  introP4: z.string(),
  missionEyebrow: z.string(),
  missionStatement: z.string(),
  sdgEyebrow: z.string(),
  sdgIntro: z.string(),
  // Obiettivi di Sviluppo Sostenibile come ARRAY: num + titolo editoriale.
  // Colore/icona restano config di design nella pagina (colori ufficiali SDG).
  sdg: z.array(z.object({
    num: z.number(),
    title: z.string(),
  })),
  // Prefisso label di ogni card SDG (es. "Obiettivo 8").
  sdgObiettivoLabel: z.string(),
  teamEyebrow: z.string(),
  teamP1: z.string(),
  teamP2: z.string(),
  teamP3: z.string(),
  // Founder come ARRAY di oggetti, con foto come media (`image()`).
  // `.or('')` tollera la riga appena aggiunta da Sitepins senza immagine
  // (defaultValue vuoto) — senza questo, un salvataggio dal CMS romperebbe
  // `astro build`. La pagina salta il render dell'immagine se vuota.
  founders: z.array(z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    email: z.string(),
    linkedin: z.string(),
    photo: image().or(z.literal('')),
  })),
  // Label del link LinkedIn di ogni founder (visibile accanto all'icona).
  linkedinLabel: z.string(),
  testimonialQuote: z.string(),
  testimonialAuthor: z.string(),
  ctaTitle: z.string(),
  ctaBody: z.string(),
  ctaLabel: z.string(),
  ctaHref: z.string(),
});

const paginaContatti = z.object({
  type: z.literal('contatti'),
  // Etichetta della voce nell'elenco Sitepins (non renderizzata sul sito).
  title: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  headerEyebrow: z.string(),
  headerTitle: z.string(),
  headerIntro: z.string(),
  recapitiEyebrow: z.string(),
  emailLabel: z.string(),
  emailValue: z.string(),
  pecLabel: z.string(),
  pecValue: z.string(),
  sedeLabel: z.string(),
  sedeAddress: z.string(),
  seguiciLabel: z.string(),
  // Form contatti (issue #26): label/placeholder dei campi, testo del
  // pulsante e messaggi di stato mostrati dallo script client-side.
  formNameLabel: z.string(),
  formNamePlaceholder: z.string(),
  formEmailLabel: z.string(),
  formEmailPlaceholder: z.string(),
  formOrgLabel: z.string(),
  formOrgPlaceholder: z.string(),
  formMessageLabel: z.string(),
  formMessagePlaceholder: z.string(),
  formSubmitLabel: z.string(),
  formSubmitLoadingLabel: z.string(),
  formMissingKeyMessage: z.string(),
  formSuccessMessage: z.string(),
  formErrorMessage: z.string(),
  formNetworkErrorMessage: z.string(),
});

// paginaPrivacy: a differenza delle altre entry di `pagine` (frontmatter-only,
// un campo per stringa), questa è prosa lunga e sequenziale senza struttura
// ricorrente (niente array/card) — stessa forma di `progetti` (ADR-0004), non
// di chi-siamo/contatti. Il corpo vive quindi nel body Markdown dell'entry
// (Sitepins lo edita come markdown, non campo per campo); il frontmatter
// resta minimo: solo meta + il pezzo che il layout .astro deve interpolare
// fuori dal flusso di prosa (titolo H1, data aggiornamento).
const paginaPrivacy = z.object({
  type: z.literal('privacy'),
  // Etichetta della voce nell'elenco Sitepins (non renderizzata sul sito).
  title: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  pageTitle: z.string(),
  updatedDate: z.string(),
});

const paginaPartners = (image: ImageFn) => z.object({
  type: z.literal('partners'),
  metaTitle: z.string(),
  metaDescription: z.string(),
  eyebrow: z.string(),
  title: z.string(),
  // Partner come ARRAY di oggetti { nome, logo(media) }.
  // `.or('')` tollera la riga appena aggiunta da Sitepins senza logo
  // (defaultValue vuoto) — evita di rompere `astro build` dal CMS.
  // La pagina salta il render del logo se vuoto.
  partners: z.array(z.object({
    name: z.string(),
    logo: image().or(z.literal('')),
  })),
});

// paginaTermini: stessa forma minimale di paginaPrivacy (PR #30) — prosa
// legale lunga e sequenziale senza struttura ricorrente (niente array/card),
// come `progetti` (ADR-0004). Il corpo vive nel body Markdown dell'entry, non
// in campi frontmatter; il frontmatter resta solo meta + i due pezzi che il
// layout interpola fuori dal flusso di prosa (titolo H1, data aggiornamento).
const paginaTermini = z.object({
  type: z.literal('termini'),
  // Etichetta della voce nell'elenco Sitepins (non renderizzata sul sito).
  title: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  pageTitle: z.string(),
  updatedDate: z.string(),
});

const paginaServizi = z.object({
  type: z.literal('servizi-index'),
  // Etichetta della voce nell'elenco Sitepins (non renderizzata sul sito).
  title: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  headerEyebrow: z.string(),
  headerTitle: z.string(),
  headerIntro1: z.string(),
  headerIntro2: z.string(),
  metodoEyebrow: z.string(),
  metodoTitle: z.string(),
  // Passi del metodo come ARRAY di oggetti { titolo, descrizione }. Riusato
  // anche dalla home (Metodo.astro): l'icona per tappa resta config di
  // design nel componente (come sdgStyle in chi-siamo), non nello schema.
  metodo: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })),
  // Filtri per pubblico della pagina /servizi. `id` deve combaciare con i
  // valori in `audience` delle entry `servizi`; il primo filtro è quello
  // attivo di default e vale "tutti".
  filtri: z.array(z.object({
    id: z.string(),
    label: z.string(),
  })),
  // CTA finale
  ctaTitle: z.string(),
  ctaPrimaryLabel: z.string(),
  ctaPrimaryHref: z.string(),
  ctaSecondaryLabel: z.string(),
  ctaSecondaryHref: z.string(),
});

const paginaTestimonials = z.object({
  type: z.literal('testimonials'),
  // Etichetta della voce nell'elenco Sitepins (non renderizzata sul sito).
  title: z.string(),
  eyebrow: z.string(),
  sectionTitle: z.string(),
  // Testimonianze condivise: riusate identiche da home (index.astro) e
  // chi-siamo.astro tramite lo stesso componente Testimonials.astro.
  testimonials: z.array(z.object({
    rating: z.number(),
    quote: z.string(),
    name: z.string(),
    role: z.string(),
  })),
});

const pagineCollection = defineCollection({
  loader: glob({
    pattern: '*.{md,mdx}',
    base: './src/content/pagine',
    generateId: ({ entry }) => entry.replace(/\.(mdx?)$/, ''),
  }),
  schema: ({ image }) => z.discriminatedUnion('type', [
    paginaHome,
    paginaChiSiamo(image),
    paginaContatti,
    paginaPartners(image),
    paginaServizi,
    paginaTestimonials,
    paginaTermini,
    paginaPrivacy,
  ]),
});

export const collections = {
  servizi: serviziCollection,
  progetti: progettiCollection,
  pagine: pagineCollection,
};
