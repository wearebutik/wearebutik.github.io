import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { presentationTool } from 'sanity/presentation';
import { schemaTypes } from './schemaTypes';
import { structure, PAGINE_TYPES } from './structure';

const ANTEPRIMA_WEB = process.env.SANITY_STUDIO_ANTEPRIMA_WEB ?? 'https://butik.consiglio.fyi';

export default defineConfig({
  name: 'butik',
  title: 'butik',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? 'uvzsc0vv',
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  plugins: [
    structureTool({ structure }),
    // Anteprima delle bozze: il sito servito da `butik-anteprima` sul computer
    // di chi scrive (ADR-0004). Senza il binario avviato, la scheda resta vuota.
    presentationTool({ previewUrl: 'http://localhost:4321' }),
    // Prova: la stessa anteprima nel browser, in un Service Worker
    // (apps/web/preview), senza niente da installare. Il token della sessione
    // dello Studio va all'anteprima dopo `#`, che non arriva a nessun server:
    // l'iframe ha uno storage tutto suo e lì il login a Sanity non si apre.
    presentationTool({
      name: 'anteprima-web',
      title: 'Anteprima web',
      previewUrl: {
        initial: ({ client }) => {
          const token = client.config().token;
          return `${ANTEPRIMA_WEB}/${token ? `#token=${encodeURIComponent(token)}` : ''}`;
        },
      },
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
    // Le pagine esistono in un solo esemplare: non si creano dal pulsante "+".
    templates: (templates) => templates.filter((t) => !PAGINE_TYPES.has(t.schemaType)),
  },
  document: {
    // …né si duplicano o eliminano.
    actions: (actions, { schemaType }) =>
      PAGINE_TYPES.has(schemaType)
        ? actions.filter((a) => !['duplicate', 'delete', 'unpublish'].includes(a.action ?? ''))
        : actions,
  },
});
