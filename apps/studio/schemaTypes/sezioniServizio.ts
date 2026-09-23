// Blocchi del corpo di un servizio: ognuno corrisponde a un componente in
// apps/web/src/components/servizi (o CtaBanner). L'editor li aggiunge e li
// riordina; l'intestazione (eyebrow) è facoltativa e ha il default del
// componente.
import { defineArrayMember, defineField, defineType } from 'sanity';

const eyebrow = (predefinito: string) =>
  defineField({
    name: 'eyebrow',
    title: 'Intestazione',
    type: 'string',
    description: `Se vuoto: "${predefinito}"`,
  });

export const cosaFacciamo = defineType({
  name: 'cosaFacciamo',
  title: 'Cosa facciamo',
  type: 'object',
  fields: [eyebrow('Cosa facciamo'), defineField({ name: 'testo', title: 'Testo', type: 'testoFormattato' })],
  preview: { prepare: () => ({ title: 'Cosa facciamo' }) },
});

export const adattoA = defineType({
  name: 'adattoA',
  title: 'Adatto a',
  type: 'object',
  fields: [eyebrow('Adatto a'), defineField({ name: 'testo', title: 'Testo', type: 'text', rows: 3 })],
  preview: { select: { subtitle: 'testo' }, prepare: ({ subtitle }) => ({ title: 'Adatto a', subtitle }) },
});

export const diCosaCiOccupiamo = defineType({
  name: 'diCosaCiOccupiamo',
  title: 'Di cosa ci occupiamo',
  type: 'object',
  fields: [
    eyebrow('Di cosa ci occupiamo'),
    defineField({ name: 'voci', title: 'Voci', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
  ],
  preview: {
    select: { voci: 'voci' },
    prepare: ({ voci }) => ({ title: 'Di cosa ci occupiamo', subtitle: `${voci?.length ?? 0} voci` }),
  },
});

export const metodo = defineType({
  name: 'metodo',
  title: 'Metodo',
  type: 'object',
  fields: [
    eyebrow('Il nostro metodo'),
    defineField({ name: 'intro', title: 'Introduzione', type: 'text', rows: 2 }),
    defineField({
      name: 'passi',
      title: 'Passi',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'passo',
          fields: [
            { name: 'title', title: 'Titolo', type: 'string' },
            { name: 'description', title: 'Descrizione', type: 'text', rows: 3 },
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: { passi: 'passi' },
    prepare: ({ passi }) => ({ title: 'Metodo', subtitle: `${passi?.length ?? 0} passi` }),
  },
});

export const bandiVinti = defineType({
  name: 'bandiVinti',
  title: 'Bandi vinti',
  type: 'object',
  fields: [
    eyebrow('Bandi vinti'),
    defineField({
      name: 'bandi',
      title: 'Bandi',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'bando',
          fields: [
            { name: 'nome', title: 'Nome', type: 'string' },
            { name: 'anno', title: 'Anno', type: 'string' },
          ],
          preview: { select: { title: 'nome', subtitle: 'anno' } },
        }),
      ],
    }),
  ],
  preview: {
    select: { bandi: 'bandi' },
    prepare: ({ bandi }) => ({ title: 'Bandi vinti', subtitle: `${bandi?.length ?? 0} bandi` }),
  },
});

export const ctaProgetti = defineType({
  name: 'ctaProgetti',
  title: 'Rimando ai progetti',
  type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Titolo', type: 'string' }),
    defineField({ name: 'schede', title: 'Schede citate', type: 'string' }),
    defineField({ name: 'href', title: 'URL', type: 'string', description: 'Se vuoto: /progetti' }),
    defineField({ name: 'label', title: 'Etichetta', type: 'string', description: 'Se vuoto: "Vedi tutti i progetti"' }),
  ],
  preview: { select: { subtitle: 'title' }, prepare: ({ subtitle }) => ({ title: 'Rimando ai progetti', subtitle }) },
});

export const ctaBanner = defineType({
  name: 'ctaBanner',
  title: 'Banner di chiusura',
  type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Titolo', type: 'string' }),
    defineField({ name: 'body', title: 'Testo', type: 'text', rows: 2 }),
    defineField({ name: 'primaryCta', title: 'Pulsante principale', type: 'link' }),
    defineField({ name: 'secondaryCta', title: 'Pulsante secondario', type: 'link' }),
  ],
  preview: { select: { subtitle: 'title' }, prepare: ({ subtitle }) => ({ title: 'Banner di chiusura', subtitle }) },
});

export const sezioniServizio = [cosaFacciamo, adattoA, diCosaCiOccupiamo, metodo, bandiVinti, ctaProgetti, ctaBanner];
