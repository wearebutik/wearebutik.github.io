import { defineCollection, z } from 'astro:content';
import { EMAIL } from '@butik/site-config/links';
import { RETI_SOCIAL } from '@butik/site-config/social';
import { pagineLoader, progettiLoader, serviziLoader } from '#lib/sanity';


// Servizi da Sanity (ADR-0004). Oltre alla scheda, il documento porta i testi
// degli hero A/B/C, quelli della card (home e /servizi) e il corpo come lista
// di sezioni riordinabili (blocchi Portable Text resi in servizi/[slug].astro).
const linkSchema = z.object({ label: z.string(), href: z.string() });

const serviziCollection = defineCollection({
  loader: serviziLoader(),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    heroImage: z.string().url(),
    // Segnaposto sfocato della foto hero (data: URI), calcolato dal loader a
    // build time: non è un campo dello Studio (vedi lib/lqip.ts).
    heroLqip: z.string().optional(),
    heroAlt: z.string().optional().default(''),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    ogImage: z.string().url().optional(),
    ogCta: z.string().optional(),
    // Trattamento dell'hero di questa scheda: si sceglie servizio per
    // servizio (vedi components/serviziHero/ServiceHero.astro).
    //   banner = il trattamento comune a progetti e pagine
    //   a/b/c  = split al target · claim tipografico · scheda-offerta
    heroVariant: z.enum(['banner', 'a', 'b', 'c']).optional().default('banner'),
    // Pubblici a cui il servizio parla, come id dei filtri della pagina
    // /servizi (vedi `filtri` in `pagine/servizi`).
    audience: z.array(z.object({ id: z.string() })).optional().default([]),
    order: z.number().optional().default(0),
    draft: z.boolean().optional().default(false),
    // Testi degli hero A/B/C. Senza, ServiceHero ricade sul banner.
    hero: z
      .object({
        eyebrow: z.string(),
        headline: z.string(),
        sub: z.string(),
        proof: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
        proofBar: z.array(z.string()).default([]),
        outcomes: z.array(z.string()).default([]),
        ctaPrimary: linkSchema,
        ctaSecondary: linkSchema.optional(),
        ledgerLabel: z.string().optional().default(''),
        ledger: z.array(z.object({ k: z.string(), v: z.string() })).default([]),
      })
      .optional(),
    // Card del servizio in home (hero) e in /servizi.
    card: z.object({
      title: z.string(),
      desc: z.string(),
      statValue: z.string(),
      statLabel: z.string(),
    }),
    // Sezioni del corpo (Portable Text, blocchi custom).
    body: z.array(z.any()).optional().default([]),
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
    // Segnaposto sfocato della foto hero (data: URI), calcolato dal loader a
    // build time: non è un campo dello Studio (vedi lib/lqip.ts).
    heroLqip: z.string().optional(),
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
// Collezione `pagine` (ADR-0004): un documento Sanity fisso per pagina (home,
// chi-siamo, contatti, partners, servizi, progetti, testimonials, privacy,
// termini), ognuno con un set di campi diverso: per questo una discriminated
// union su `type`, che il loader ricava dal tipo Sanity.
//
// I testi con grassetto/corsivo/link sono `testoFormattato` (Portable Text,
// convertito in HTML da lib/richText.ts); i corpi di privacy e termini sono
// `testoLegale` (components/testo/LegalText.astro). Le immagini arrivano come
// URL della CDN Sanity e passano dalla pipeline di Astro.
// ─────────────────────────────────────────────────────────────────────────────

// Portable Text: validato nella struttura dallo Studio, qui passato com'è.
const portableText = z.array(z.any()).optional().default([]);

// Voce metrica (Numbers): valore + etichetta.
const metricSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const paginaHome = z.object({
  type: z.literal('home'),
  metaTitle: z.string(),
  metaDescription: z.string(),
  // Hero
  heroTitle: z.string(),
  heroSubtitle: z.string(),
  heroCtaLabel: z.string(),
  heroCtaHref: z.string(),
  heroExploreLabel: z.string(),
  heroExploreHref: z.string(),
  // Foto di sfondo dell'hero, in loop. Facoltative: senza, fondo scuro.
  heroImages: z.array(z.object({ src: z.string().url(), alt: z.string() })).optional().default([]),
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
  // Facoltativa: senza, AboutInline usa l'immagine locale.
  aboutImage: z.string().url().optional(),
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
  newsletterPrivacy: portableText,
  newsletterSuccess: z.string(),
});

const paginaChiSiamo = z.object({
  type: z.literal('chi-siamo'),
  metaTitle: z.string(),
  metaDescription: z.string(),
  heroTitle: z.string(),
  heroSubtitle: z.string(),
  // Facoltativa: senza, la pagina usa l'immagine locale.
  heroImage: z.string().url().optional(),
  heroImageAlt: z.string(),
  introEyebrow: z.string(),
  introP1: portableText,
  introP2: portableText,
  introP3: portableText,
  introP4: portableText,
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
  teamP1: portableText,
  teamP2: portableText,
  teamP3: portableText,
  // Founder come ARRAY di oggetti; la foto è l'URL Sanity, '' se manca (la
  // pagina salta il render dell'immagine).
  founders: z.array(z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    email: z.string().regex(EMAIL),
    linkedin: z.string(),
    photo: z.string().optional().default(''),
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
  metaTitle: z.string(),
  metaDescription: z.string(),
  headerEyebrow: z.string(),
  headerTitle: z.string(),
  headerIntro: z.string(),
  recapitiEyebrow: z.string(),
  emailLabel: z.string(),
  emailValue: z.string().regex(EMAIL),
  pecLabel: z.string(),
  pecValue: z.string().regex(EMAIL),
  sedeLabel: z.string(),
  sedeAddress: portableText,
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

// Privacy: la Cookie Policy è una sezione a sé perché il suo titolo ha
// l'ancora fissa #cookie, a cui rimanda il banner dei cookie.
const paginaPrivacy = z.object({
  type: z.literal('privacy'),
  metaTitle: z.string(),
  metaDescription: z.string(),
  pageTitle: z.string(),
  updatedDate: z.string(),
  body: portableText,
  cookieTitle: z.string(),
  cookieBody: portableText,
});

const paginaPartners = z.object({
  type: z.literal('partners'),
  metaTitle: z.string(),
  metaDescription: z.string(),
  eyebrow: z.string(),
  title: z.string(),
  // Partner come ARRAY di oggetti { nome, logo }; il logo è l'URL Sanity, ''
  // se manca (la pagina salta il render del logo).
  partners: z.array(z.object({
    name: z.string(),
    logo: z.string().optional().default(''),
  })),
});

const paginaTermini = z.object({
  type: z.literal('termini'),
  metaTitle: z.string(),
  metaDescription: z.string(),
  pageTitle: z.string(),
  updatedDate: z.string(),
  body: portableText,
});

const paginaServizi = z.object({
  type: z.literal('servizi-index'),
  metaTitle: z.string(),
  metaDescription: z.string(),
  headerEyebrow: z.string(),
  headerTitle: z.string(),
  headerIntro1: z.string(),
  headerIntro2: portableText,
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

const paginaProgetti = z.object({
  type: z.literal('progetti-index'),
  metaTitle: z.string(),
  metaDescription: z.string(),
  eyebrow: z.string(),
  title: z.string(),
  clienteLabel: z.string(),
});

const paginaTestimonials = z.object({
  type: z.literal('testimonials'),
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

// Footer (contenuto condiviso da tutte le pagine; i social anche da Contatti).
const paginaFooter = z.object({
  type: z.literal('footer'),
  ragioneSociale: z.string(),
  indirizzo: z.string(),
  partitaIva: z.string(),
  contattiLabel: z.string(),
  pec: z.string().regex(EMAIL),
  email: z.string().regex(EMAIL),
  social: z.array(z.object({ rete: z.enum(RETI_SOCIAL), href: z.string() })).optional().default([]),
  colonna1: z.array(linkSchema).optional().default([]),
  colonna2: z.array(linkSchema).optional().default([]),
  linkLegali: z.array(linkSchema).optional().default([]),
  cookieLabel: z.string(),
  copyright: z.string(),
});

const pagineCollection = defineCollection({
  loader: pagineLoader(),
  schema: z.discriminatedUnion('type', [
    paginaHome,
    paginaChiSiamo,
    paginaContatti,
    paginaPartners,
    paginaServizi,
    paginaProgetti,
    paginaTestimonials,
    paginaTermini,
    paginaPrivacy,
    paginaFooter,
  ]),
});

export const collections = {
  servizi: serviziCollection,
  progetti: progettiCollection,
  pagine: pagineCollection,
};
