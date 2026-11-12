// Specchio dello schema Zod della collection `progetti`
// (apps/web/src/content.config.ts): i due vanno tenuti allineati.
import { defineArrayMember, defineField, defineType } from 'sanity';
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';

export const progetto = defineType({
  name: 'progetto',
  title: 'Progetto',
  type: 'document',
  groups: [
    { name: 'contenuto', title: 'Contenuto', default: true },
    { name: 'seo', title: 'SEO e condivisione' },
    { name: 'ordine', title: 'Pubblicazione' },
  ],
  fields: [
    // Ordine del portfolio: si trascinano i progetti nell'elenco "Progetti"
    // dello Studio. La home sceglie i suoi nel blocco "Progetti in evidenza".
    orderRankField({ type: 'progetto' }),
    defineField({ name: 'title', title: 'Titolo', type: 'string', group: 'contenuto', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'contenuto',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'subtitle', title: 'Sottotitolo', type: 'text', rows: 2, group: 'contenuto', validation: (r) => r.required() }),
    defineField({
      name: 'heroImage',
      title: 'Immagine hero',
      type: 'image',
      options: { hotspot: true },
      group: 'contenuto',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'heroAlt', title: 'Testo alternativo hero', type: 'string', group: 'contenuto' }),
    defineField({ name: 'client', title: 'Cliente', type: 'string', group: 'contenuto' }),
    defineField({
      name: 'clienteEtichetta',
      title: 'Etichetta del cliente',
      description: 'La parola davanti al cliente, nella card del portfolio ("Cliente: …") e nella pagina del progetto. Per esempio Cliente, Committente, Con.',
      type: 'string',
      group: 'contenuto',
      initialValue: 'Cliente',
      hidden: ({ document }) => !document?.client,
    }),
    defineField({ name: 'year', title: 'Anno', type: 'number', group: 'contenuto' }),
    defineField({ name: 'category', title: 'Categoria', type: 'string', group: 'contenuto' }),
    defineField({
      name: 'body',
      title: 'Corpo',
      type: 'array',
      group: 'contenuto',
      of: [
        defineArrayMember({ type: 'block' }),
        defineArrayMember({ type: 'imageBlock' }),
        defineArrayMember({ type: 'imageSide' }),
        defineArrayMember({ type: 'imageCarousel' }),
      ],
    }),
    defineField({ name: 'metaTitle', title: 'Meta title', type: 'string', group: 'seo' }),
    defineField({ name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3, group: 'seo' }),
    defineField({ name: 'ogImage', title: 'Immagine OG', type: 'image', group: 'seo' }),
    defineField({ name: 'ogCta', title: 'CTA della card OG', type: 'string', group: 'seo' }),
    defineField({ name: 'draft', title: 'Bozza (non pubblicare)', type: 'boolean', group: 'ordine', initialValue: false }),
  ],
  orderings: [orderRankOrdering],
  preview: {
    select: { title: 'title', subtitle: 'client', media: 'heroImage' },
  },
});
