import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { presentationTool } from 'sanity/presentation';
import { schemaTypes } from './schemaTypes';
import { structure, PAGINE_TYPES } from './structure';
import { ANTEPRIMA_WEB, LayoutAnteprimaWeb } from './anteprimaWeb';

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
    // (apps/web/preview), senza niente da installare. La sessione la riceve
    // dallo Studio (anteprimaWeb.tsx).
    presentationTool({ name: 'anteprima-web', title: 'Anteprima web', previewUrl: ANTEPRIMA_WEB }),
    visionTool(),
  ],
  studio: { components: { layout: LayoutAnteprimaWeb } },
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
