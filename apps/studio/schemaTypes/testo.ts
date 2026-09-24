// Testo formattato: paragrafi con grassetto, corsivo e link. È il campo per le
// stringhe che sul sito portavano HTML inline (<strong>, <a>): l'editor usa i
// pulsanti, il sito lo rende con astro-portabletext.
import { defineArrayMember, defineType, type Rule } from 'sanity';

// URL ammessi nei link: http(s), mailto, tel, percorsi relativi e ancore. Il
// sito rifiuta comunque gli altri schemi (apps/web/src/lib/richText.ts).
const URL_SICURO = /^(https?:|mailto:|tel:|\/|#|\?)/i;

/** Validazione di un URL facoltativo: vuoto, oppure con uno schema ammesso. */
export const urlSicuro = (v: unknown) =>
  typeof v !== 'string' || v === '' || URL_SICURO.test(v.trim())
    ? true
    : 'Usa un indirizzo http(s)://, mailto:, tel: oppure un percorso che inizia con /';

// Link che non portano da nessuna parte: `#` da solo, indirizzi di esempio,
// promemoria. Non bloccano la pubblicazione (avviso giallo nello Studio, e in
// `sanity documents validate --level warning`), ma vanno sistemati: un link
// rotto è peggio dell'assenza del link (issue #40). L'avviso è applicato a
// ogni campo stringa e testo dello schema da schemaTypes/index.ts.
const SEGNAPOSTO = /^(#!?|javascript:void\(0\);?|https?:\/\/(www\.)?example\.(com|org)\b.*|todo|tbd|xxx)$/i;

// Pagine interne che esistono sul sito (le schede servizio e progetto per
// forma: /servizi/<slug>, /progetti/<slug>). Un percorso interno fuori da
// questo elenco porta a un 404: il sito non lo mostra (apps/web/src/lib/links.ts).
const PAGINA_INTERNA = /^\/(chi-siamo|servizi|progetti|contatti|partners|privacy|termini)?\/?$|^\/(servizi|progetti)\/[a-z0-9-]+\/?$/;

/** Avviso per un URL segnaposto o per una pagina interna che non esiste. */
export const linkSegnaposto = (v: unknown) => {
  if (typeof v !== 'string') return true;
  const t = v.trim();
  if (SEGNAPOSTO.test(t)) return 'Link segnaposto: indica la destinazione vera, oppure togli il link e lascia il testo';
  if (/^\/[^\s]*$/.test(t) && !t.startsWith('//')) {
    const percorso = t.replace(/[?#].*$/, '');
    if (!PAGINA_INTERNA.test(percorso)) return `La pagina ${percorso} non esiste sul sito: il link non viene mostrato finché non c'è`;
  }
  return true;
};

/** Campo URL di un link: obbligatorio e con uno schema ammesso. */
export const hrefField = (extra: Record<string, unknown> = {}) => ({
  name: 'href',
  title: 'URL',
  type: 'string',
  ...extra,
  validation: (r: Rule) => r.required().custom(urlSicuro),
});

export const testoFormattato = defineType({
  name: 'testoFormattato',
  title: 'Testo formattato',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [{ title: 'Paragrafo', value: 'normal' }],
      lists: [],
      marks: {
        decorators: [
          { title: 'Grassetto', value: 'strong' },
          { title: 'Corsivo', value: 'em' },
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

// Link con etichetta: CTA, pulsanti.
export const link = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    { name: 'label', title: 'Etichetta', type: 'string', validation: (r) => r.required() },
    hrefField(),
  ],
  options: { columns: 2 },
});
