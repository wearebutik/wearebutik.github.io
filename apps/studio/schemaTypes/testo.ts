// Testo formattato: paragrafi con grassetto, corsivo e link. È il campo per le
// stringhe che sul sito portavano HTML inline (<strong>, <a>): l'editor usa i
// pulsanti, il sito lo rende con astro-portabletext.
import { defineArrayMember, defineType } from 'sanity';

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
            fields: [{ name: 'href', title: 'URL', type: 'string', validation: (r) => r.required() }],
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
    { name: 'href', title: 'URL', type: 'string', validation: (r) => r.required() },
  ],
  options: { columns: 2 },
});
