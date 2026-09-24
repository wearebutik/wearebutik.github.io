// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { sanityCdnGuard } from './src/lib/sanityCdnGuard.ts';
import { basePath } from './src/lib/basePath.ts';

// Versione B dei testi (ADR-0004): stesso sito, dal dataset `anteprima`
// (default di SANITY_DATASET in src/lib/sanity.ts), servito sotto /b/ e
// scritto in dist/b accanto alla versione A. `pnpm build` le costruisce entrambe.
const versioneB = process.env.BUTIK_VERSIONE === 'b';

export default defineConfig({
  ...(process.env.SITE ? { site: process.env.SITE } : {}),
  ...(versioneB ? { base: '/b', outDir: './dist/b' } : {}),
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
    // Immagini dei progetti su Sanity: Astro le scarica a build time e le
    // ottimizza come le locali, così il sito non dipende dalla CDN Sanity.
    domains: ['cdn.sanity.io'],
  },
  // I componenti condivisi di @butik/ui sono island React (ADR-0008): l'integrazione
  // React li rende a HTML statico a build-time (nessuna direttiva client = zero JS).
  integrations: [react(), mdx(), sanityCdnGuard(), basePath()],
});
