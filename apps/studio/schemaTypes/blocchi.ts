// Blocchi custom del corpo Portable Text. Ricalcano i componenti MDX di
// apps/web/src/components/mdx (ImageBlock, ImageSide, ImageCarousel).
import { defineArrayMember, defineField, defineType } from 'sanity';

// Immagine con testo alternativo e didascalia: l'unità comune a tutti i blocchi.
export const figura = defineType({
  name: 'figura',
  title: 'Immagine',
  type: 'image',
  options: { hotspot: true },
  fields: [
    defineField({ name: 'alt', title: 'Testo alternativo', type: 'string' }),
    defineField({ name: 'caption', title: 'Didascalia', type: 'string' }),
  ],
});

export const imageBlock = defineType({
  name: 'imageBlock',
  title: 'Immagine a tutta larghezza',
  type: 'object',
  fields: [defineField({ name: 'image', title: 'Immagine', type: 'figura', validation: (r) => r.required() })],
  preview: {
    select: { media: 'image', title: 'image.caption', subtitle: 'image.alt' },
  },
});

// Un solo blocco per l'immagine affiancata al testo: il lato è un campo.
export const imageSide = defineType({
  name: 'imageSide',
  title: 'Immagine + testo',
  type: 'object',
  fields: [
    defineField({ name: 'image', title: 'Immagine', type: 'figura', validation: (r) => r.required() }),
    defineField({
      name: 'side',
      title: 'Lato immagine',
      type: 'string',
      options: { list: [{ title: 'Sinistra', value: 'left' }, { title: 'Destra', value: 'right' }], layout: 'radio' },
      initialValue: 'left',
    }),
    defineField({
      name: 'text',
      title: 'Testo',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
    }),
  ],
  preview: {
    select: { media: 'image', title: 'image.caption', side: 'side' },
    prepare: ({ media, title, side }) => ({
      media,
      title: title ?? 'Immagine + testo',
      subtitle: side === 'right' ? 'Immagine a destra' : 'Immagine a sinistra',
    }),
  },
});

export const imageCarousel = defineType({
  name: 'imageCarousel',
  title: 'Carosello',
  type: 'object',
  fields: [
    defineField({
      name: 'images',
      title: 'Immagini',
      type: 'array',
      of: [defineArrayMember({ type: 'figura' })],
      validation: (r) => r.min(1),
    }),
  ],
  preview: {
    select: { media: 'images.0', count: 'images' },
    prepare: ({ media, count }) => ({
      media,
      title: 'Carosello',
      subtitle: `${Array.isArray(count) ? count.length : 0} immagini`,
    }),
  },
});
