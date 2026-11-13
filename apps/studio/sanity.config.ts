import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { presentationTool } from 'sanity/presentation';
import { schemaTypes } from './schemaTypes';
import { structure, PAGINE_TYPES, ELEMENTI_TYPES } from './structure';
import { ANTEPRIMA_WEB, LayoutAnteprimaWeb } from './anteprimaWeb';
import { resolve } from './luoghiAnteprima';

const unico = (schemaType: string) => PAGINE_TYPES.has(schemaType) || ELEMENTI_TYPES.has(schemaType);

export default defineConfig({
  name: 'butik',
  title: 'butik',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? 'uvzsc0vv',
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  plugins: [
    structureTool({ structure }),
    // Anteprima delle bozze: il sito nel browser, in un Service Worker
    // (apps/web/preview), senza niente da installare. La sessione la riceve
    // dallo Studio (anteprimaWeb.tsx).
    presentationTool({ name: 'anteprima-web', title: 'Anteprima web', previewUrl: ANTEPRIMA_WEB, resolve }),
    visionTool(),
  ],
  studio: { components: { layout: LayoutAnteprimaWeb } },
  schema: {
    types: schemaTypes,
    // Pagine ed elementi del sito esistono in un solo esemplare: non si creano
    // dal pulsante "+".
    templates: (templates) => templates.filter((t) => !unico(t.schemaType)),
  },
  document: {
    // …né si duplicano o eliminano.
    actions: (actions, { schemaType }) =>
      unico(schemaType)
        ? actions.filter((a) => !['duplicate', 'delete', 'unpublish'].includes(a.action ?? ''))
        : actions,
  },
});
