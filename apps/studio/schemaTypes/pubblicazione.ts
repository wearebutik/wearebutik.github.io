// L'interruttore «Pubblicata» della tab Pubblicazione, lo stesso per progetti,
// servizi e le pagine che si possono non pubblicare (Sostienici,
// Trasparenza). Che cosa il sito mostra a partire da lì lo decide
// apps/web/src/lib/pubblicazione.ts; l'anteprima delle bozze mostra tutto.
//
// È diverso dal pulsante «Publish» dello Studio: quello rende definitive le
// modifiche, questo dice se il contenuto esiste sul sito pubblico.
import { defineField } from 'sanity';

export const gruppoPubblicazione = { name: 'pubblicazione', title: 'Pubblicazione' };

export const campoPubblicata = (descrizione: string, initialValue: boolean) =>
  defineField({
    name: 'pubblicata',
    title: 'Pubblicata',
    description: `${descrizione} L’anteprima mostra comunque tutto.`,
    type: 'boolean',
    group: gruppoPubblicazione.name,
    initialValue,
    validation: (r) => r.required(),
  });
