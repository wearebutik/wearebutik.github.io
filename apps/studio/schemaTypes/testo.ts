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

/** Campo URL di un link: obbligatorio e con uno schema ammesso. */
export const hrefField = (extra: Record<string, unknown> = {}) => ({
  name: 'href',
  title: 'URL',
  type: 'string',
  ...extra,
  validation: (r: Rule) =>
    r.required().custom(urlSicuro),
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
