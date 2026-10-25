import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { presentationTool } from 'sanity/presentation';
import { schemaTypes } from './schemaTypes';
import { structure, PAGINE_TYPES } from './structure';

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
