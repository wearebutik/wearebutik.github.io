// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

export default defineConfig({
  ...(process.env.SITE ? { site: process.env.SITE } : {}),
  prefetch: {
    prefetchAll: true,
  },
  build: {
    inlineStylesheets: 'always',
  },
  image: {
    // Il BaseLayout rasterizza il logo SVG → PNG (getImage, format 'png') per la
    // card OG. Da Astro 6.4 la rasterizzazione SVG è disabilitata di default:
    // la riabilitiamo esplicitamente perché è un uso voluto e controllato
    // (solo i nostri asset di branding).
    dangerouslyProcessSVG: true,
  },
  // I componenti condivisi di @butik/ui sono island React (ADR-0008): l'integrazione
  // React li rende a HTML statico a build-time (nessuna direttiva client = zero JS).
  integrations: [react(), mdx()],
});
