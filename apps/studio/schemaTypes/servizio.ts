// Specchio dello schema Zod della collection `servizi`
// (apps/web/src/content.config.ts): i due vanno tenuti allineati.
import { defineArrayMember, defineField, defineType } from 'sanity';
import { sezioniServizio } from './sezioniServizio';

export const servizio = defineType({
  name: 'servizio',
  title: 'Servizio',
  type: 'document',
  groups: [
    { name: 'scheda', title: 'Scheda', default: true },
    { name: 'hero', title: 'Hero' },
    { name: 'card', title: 'Card' },
    { name: 'corpo', title: 'Contenuto' },
    { name: 'seo', title: 'SEO e condivisione' },
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
    defineField({
      name: 'audience',
      title: 'Pubblico',
      description: 'Filtri della pagina /servizi in cui compare (id definiti nella pagina Servizi).',
      type: 'array',
      group: 'scheda',
      of: [defineArrayMember({ type: 'string' })],
      options: {
        list: [
          { title: 'Comuni e PA', value: 'comuni' },
          { title: 'DMO e turismo', value: 'dmo' },
          { title: 'Operatori e industry', value: 'operatori' },
        ],
      },
    }),
    defineField({ name: 'order', title: 'Ordine', type: 'number', group: 'scheda', initialValue: 0 }),
    defineField({ name: 'draft', title: 'Bozza (non pubblicare)', type: 'boolean', group: 'scheda', initialValue: false }),

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

    // ── Card (home e /servizi) ──────────────────────────────────────────────
    defineField({
      name: 'card',
      title: 'Card',
      type: 'object',
      group: 'card',
      validation: (r) => r.required(),
      options: { collapsible: false },
      fields: [
        { name: 'title', title: 'Titolo breve', type: 'string', validation: (r: any) => r.required() },
        { name: 'desc', title: 'Descrizione', type: 'string', validation: (r: any) => r.required() },
        { name: 'statValue', title: 'Statistica: valore', type: 'string', validation: (r: any) => r.required() },
        { name: 'statLabel', title: 'Statistica: etichetta', type: 'string', validation: (r: any) => r.required() },
      ],
    }),

    // ── Corpo ───────────────────────────────────────────────────────────────
    defineField({
      name: 'body',
      title: 'Sezioni',
      type: 'array',
      group: 'corpo',
      of: sezioniServizio.map((s) => defineArrayMember({ type: s.name })),
    }),

    // ── SEO ─────────────────────────────────────────────────────────────────
    defineField({ name: 'metaTitle', title: 'Meta title', type: 'string', group: 'seo' }),
    defineField({ name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3, group: 'seo' }),
    defineField({ name: 'ogImage', title: 'Immagine OG', type: 'image', group: 'seo' }),
    defineField({ name: 'ogCta', title: 'CTA della card OG', type: 'string', group: 'seo' }),
  ],
  orderings: [{ title: 'Ordine', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'title', subtitle: 'card.title', media: 'heroImage' } },
});
