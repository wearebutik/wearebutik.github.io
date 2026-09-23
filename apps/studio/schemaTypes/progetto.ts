// Specchio dello schema Zod della collection `progetti`
// (apps/web/src/content.config.ts): i due vanno tenuti allineati.
import { defineArrayMember, defineField, defineType } from 'sanity';

export const progetto = defineType({
  name: 'progetto',
  title: 'Progetto',
  type: 'document',
  groups: [
    { name: 'contenuto', title: 'Contenuto', default: true },
    { name: 'seo', title: 'SEO e condivisione' },
    { name: 'ordine', title: 'Ordinamento' },
  ],
  fields: [
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
    defineField({ name: 'order', title: 'Ordine', type: 'number', group: 'ordine', initialValue: 0 }),
    defineField({ name: 'featured', title: 'In evidenza in home', type: 'boolean', group: 'ordine', initialValue: false }),
    defineField({ name: 'featuredOrder', title: 'Ordine in home', type: 'number', group: 'ordine', initialValue: 0 }),
    defineField({ name: 'draft', title: 'Bozza (non pubblicare)', type: 'boolean', group: 'ordine', initialValue: false }),
  ],
  orderings: [{ title: 'Ordine', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', subtitle: 'client', media: 'heroImage' },
  },
});
