// Specchio dello schema Zod della collection `servizi`
// (apps/web/src/content.config.ts): i due vanno tenuti allineati.
import { defineArrayMember, defineField, defineType } from 'sanity';
import { sezioniServizio } from './sezioniServizio';
import { campoPubblicata, gruppoPubblicazione } from './pubblicazione';

export const servizio = defineType({
  name: 'servizio',
  title: 'Servizio',
  type: 'document',
  groups: [
    { name: 'scheda', title: 'Scheda', default: true },
    { name: 'hero', title: 'Hero' },
    { name: 'corpo', title: 'Contenuto' },
    { name: 'seo', title: 'SEO e condivisione' },
    gruppoPubblicazione,
  ],
  fields: [
    // ── Scheda ──────────────────────────────────────────────────────────────
    defineField({ name: 'title', title: 'Titolo', type: 'string', group: 'scheda', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'scheda',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'subtitle', title: 'Sottotitolo', type: 'text', rows: 2, group: 'scheda', validation: (r) => r.required() }),
    defineField({
      name: 'heroImage',
      title: 'Immagine hero',
      type: 'image',
      options: { hotspot: true },
      group: 'scheda',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'heroAlt', title: 'Testo alternativo hero', type: 'string', group: 'scheda' }),
    defineField({
      name: 'heroVariant',
      title: 'Variante hero',
      type: 'string',
      group: 'scheda',
      options: {
        list: [
          { title: 'Banner', value: 'banner' },
          { title: 'A · split al target', value: 'a' },
          { title: 'B · claim tipografico', value: 'b' },
          { title: 'C · scheda-offerta', value: 'c' },
        ],
        layout: 'radio',
      },
      initialValue: 'banner',
    }),
    campoPubblicata(
      'Riguarda solo la pagina del servizio (/servizi/<slug>). Spento: la pagina non esiste e i link che ci portano spariscono dal sito pubblico. Le card dell\'Elenco dei servizi hanno i loro testi e decidono da sé se mostrare il link.',
      false,
    ),

    // ── Hero (varianti A/B/C) ───────────────────────────────────────────────
    defineField({
      name: 'hero',
      title: 'Hero',
      description: 'Testi delle varianti A, B e C. Se vuoto, la scheda usa la variante Banner.',
      type: 'object',
      group: 'hero',
      options: { collapsible: false },
      fields: [
        { name: 'eyebrow', title: 'Per chi', type: 'string', validation: (r: any) => r.required() },
        { name: 'headline', title: 'Titolo', type: 'string', validation: (r: any) => r.required() },
        { name: 'sub', title: 'Sottotitolo', type: 'text', rows: 2, validation: (r: any) => r.required() },
        {
          name: 'proof',
          title: 'Prove (A, C)',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'prova',
              fields: [
                { name: 'value', title: 'Valore', type: 'string' },
                { name: 'label', title: 'Etichetta', type: 'string' },
              ],
              preview: { select: { title: 'value', subtitle: 'label' } },
            },
          ],
        },
        { name: 'proofBar', title: 'Barra prove (B)', type: 'array', of: [{ type: 'string' }] },
        { name: 'outcomes', title: 'Cosa ottieni (C)', type: 'array', of: [{ type: 'string' }] },
        { name: 'ctaPrimary', title: 'Pulsante principale', type: 'link', validation: (r: any) => r.required() },
        { name: 'ctaSecondary', title: 'Pulsante secondario', type: 'link' },
        { name: 'ledgerLabel', title: 'Etichetta registro (B)', type: 'string' },
        {
          name: 'ledger',
          title: 'Registro (B)',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'voceRegistro',
              fields: [
                { name: 'k', title: 'Chiave', type: 'string' },
                { name: 'v', title: 'Voce', type: 'string' },
              ],
              preview: { select: { title: 'v', subtitle: 'k' } },
            },
          ],
        },
      ],
    }),

    // ── Corpo ───────────────────────────────────────────────────────────────
    defineField({
      name: 'body',
      title: 'Sezioni',
      type: 'array',
      group: 'corpo',
      // Sezioni del servizio, più le foto (stessi blocchi del corpo dei progetti).
      of: [...sezioniServizio.map((s) => s.name), 'imageBlock', 'imageCarousel'].map((type) => defineArrayMember({ type })),
    }),

    // ── SEO ─────────────────────────────────────────────────────────────────
    defineField({ name: 'metaTitle', title: 'Meta title', type: 'string', group: 'seo' }),
    defineField({ name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3, group: 'seo' }),
    defineField({ name: 'ogImage', title: 'Immagine OG', type: 'image', group: 'seo' }),
    defineField({ name: 'ogCta', title: 'CTA della card OG', type: 'string', group: 'seo' }),
  ],
  orderings: [{ title: 'Titolo', name: 'titolo', by: [{ field: 'title', direction: 'asc' }] }],
  preview: { select: { title: 'title', subtitle: 'subtitle', media: 'heroImage' } },
});
