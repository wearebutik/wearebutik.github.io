import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { EMAIL } from '@butik/site-config/links';
import { RETI_SOCIAL } from '@butik/site-config/social';
import { ICONE_CARD, type IconaCard } from '@butik/site-config/icone';
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
    // La pagina /servizi/<slug> si genera sempre, ma senza questo flag il sito
    // non la linka da nessuna parte e la segna noindex: le card portano al
    // blocco del servizio in /servizi (#slug).
    paginaRaggiungibile: z.boolean().optional().default(false),
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
    // Titolo breve del servizio nel suo blocco in /servizi.
    card: z.object({
      title: z.string(),
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
    // La parola davanti al cliente ("Cliente: …"); senza, "Cliente".
    clienteEtichetta: z.string().optional().default('Cliente'),
    year: z.number().optional(),
    category: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    ogImage: z.string().url().optional(),
    ogCta: z.string().optional(),
    // Posizione nell'elenco riordinabile dello Studio. Vedi lib/ordine.ts.
    orderRank: z.string().optional(),
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

// Sezioni di una pagina (ADR-0004, *Pages as sections*): lista di blocchi
// che l'editor compone nello Studio (apps/studio/schemaTypes/sezioniPagina.ts),
// resa in ordine da components/sezioni/Sezioni.astro. Un blocco senza campi
// propri (loghi, metodo, testimonianze) prende i contenuti da un altro
// documento e qui porta solo il suo tipo.
const sezione = <T extends string, S extends z.ZodRawShape>(type: T, shape: S) =>
  z.object({ _type: z.literal(type), _key: z.string(), ...shape });

const sezioneSchema = z.discriminatedUnion('_type', [
  sezione('sezioneHero', {
    title: z.string(),
    subtitle: z.string(),
    ctaLabel: z.string(),
    ctaHref: z.string(),
    exploreLabel: z.string(),
    exploreHref: z.string(),
    // Foto di sfondo in loop, decorative. Facoltative: senza, fondo scuro.
    // `lqip`: segnaposto sfocato calcolato dal loader, non un campo dello Studio.
    fotoSfondo: z
      .array(z.object({ src: z.string().url(), lqip: z.string().optional() }))
      .optional()
      .default([]),
    // Card in basso sulle foto, nell'ordine della lista. L'icona è un id di
    // @butik/site-config/icone.
    card: z
      .array(z.object({
        title: z.string(),
        desc: z.string(),
        href: z.string(),
        icona: z.enum(ICONE_CARD.map((i) => i.id) as [IconaCard, ...IconaCard[]]).optional(),
      }))
      .optional()
      .default([]),
  }),
  sezione('sezioneLoghi', {}),
  sezione('sezioneNumeri', {
    butikMetrics: z.array(metricSchema),
    mmwLabel: z.string(),
    mmwMetrics: z.array(metricSchema),
  }),
  sezione('sezioneMetodo', {}),
  sezione('sezioneTestimonianze', {}),
  // Progetti scelti nel blocco, nell'ordine del blocco: il loader risolve i
  // riferimenti nello slug di ciascun progetto.
  sezione('sezioneProgetti', {
    eyebrow: z.string(),
    title: z.string(),
    intro: z.string().optional(),
    progetti: z.array(z.string()),
    ctaLabel: z.string(),
  }),
  sezione('ctaBanner', {
    title: z.string(),
    body: z.string().optional(),
    primaryCta: linkSchema,
    secondaryCta: linkSchema.optional(),
  }),
  sezione('sezioneChiSiamo', {
    title: z.string(),
    p1: z.string(),
    p2: z.string(),
    p3: z.string(),
    ctaLabel: z.string(),
    ctaHref: z.string(),
    // Facoltativa: senza, AboutInline usa l'immagine locale.
    image: z.string().url().optional(),
    imageAlt: z.string(),
  }),
  // Testata con foto (HeroBanner). Immagine facoltativa: senza, la foto locale.
  sezione('sezioneTestataFoto', {
    title: z.string(),
    subtitle: z.string(),
    image: z.string().url().optional(),
    imageAlt: z.string(),
  }),
  sezione('sezioneIntestazione', { eyebrow: z.string(), title: z.string(), testo: portableText }),
  sezione('sezioneTitolo', { eyebrow: z.string(), title: z.string() }),
  sezione('sezioneTesto', { eyebrow: z.string(), testo: portableText }),
  // Obiettivi di Sviluppo Sostenibile: num + titolo editoriale. Colore e
  // icona restano config di design in components/sezioni/Missione.astro.
  sezione('sezioneMissione', {
    missionEyebrow: z.string(),
    missionStatement: z.string(),
    sdgEyebrow: z.string(),
    sdgIntro: z.string(),
    sdgObiettivoLabel: z.string(),
    sdg: z.array(z.object({ num: z.number(), title: z.string() })),
  }),
  // Persone: la foto è l'URL Sanity, assente se manca (la scheda resta senza).
  sezione('sezioneTeam', {
    eyebrow: z.string(),
    testo: portableText,
    founders: z.array(z.object({
      name: z.string(),
      role: z.string(),
      bio: z.string(),
      email: z.string().regex(EMAIL),
      linkedin: z.string(),
      photo: z.string().optional(),
    })),
    linkedinLabel: z.string(),
  }),
  sezione('sezioneCitazione', { quote: z.string(), author: z.string() }),
  // Servizi scelti nel blocco, nell'ordine del blocco: il loader risolve i
  // riferimenti nello slug di ciascun servizio.
  sezione('sezioneElencoServizi', { servizi: z.array(z.string()) }),
  sezione('sezioneElencoProgetti', {}),
  sezione('sezioneNewsletter', {
    title: z.string(),
    body: z.string(),
    placeholder: z.string(),
    button: z.string(),
    privacy: portableText,
    success: z.string(),
  }),
]);
export type Sezione = z.infer<typeof sezioneSchema>;

const paginaHome = z.object({
  type: z.literal('home'),
  metaTitle: z.string(),
  metaDescription: z.string(),
  sezioni: z.array(sezioneSchema),
});

const paginaChiSiamo = z.object({
  type: z.literal('chi-siamo'),
  metaTitle: z.string(),
  metaDescription: z.string(),
  sezioni: z.array(sezioneSchema),
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
  sezioni: z.array(sezioneSchema),
  // Metodo: campi fissi, mostrati dalla sezione Metodo qui e in home. L'icona
  // per tappa resta config di design in Metodo.astro, non nello schema.
  metodoEyebrow: z.string(),
  metodoTitle: z.string(),
  metodo: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })),
});

const paginaProgetti = z.object({
  type: z.literal('progetti-index'),
  metaTitle: z.string(),
  metaDescription: z.string(),
  sezioni: z.array(sezioneSchema),
});

const paginaTestimonials = z.object({
  type: z.literal('testimonials'),
  eyebrow: z.string(),
  sectionTitle: z.string(),
  // Testimonianze condivise: riusate identiche da home (index.astro) e
  // chi-siamo.astro tramite lo stesso componente Testimonials.astro.
  // Facoltative: lo Studio toglie il campo quando la lista si svuota, e senza
  // testimonianze la sezione non viene renderizzata.
  testimonials: z.array(z.object({
    rating: z.number(),
    quote: z.string(),
    name: z.string(),
    role: z.string(),
  })).optional().default([]),
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
