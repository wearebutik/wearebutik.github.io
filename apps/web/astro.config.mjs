// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { sanityCdnGuard } from './src/lib/sanityCdnGuard.ts';
import { pagineGuard } from './src/lib/pagineGuard.ts';
import { fontCritici } from './src/lib/fontCritici.ts';
import { cssCritico } from './src/lib/cssCritico.ts';
import { linkConBarra } from './src/lib/linkConBarra.ts';
import { bozze } from './src/lib/anteprima/bozze.ts';

// Anteprima delle bozze (butik-anteprima, ADR-0004): lo stesso sito come
// server locale, che a ogni richiesta legge le bozze da Sanity. Foto non
// ottimizzate (arrivano dalla CDN Sanity) e nessun passaggio di fine build:
// è uno strumento di chi scrive, non il sito pubblicato.
const anteprima = process.env.BUTIK_ANTEPRIMA === '1';
// BUTIK_PREVIEW_SW=1: lo stesso server per il Service Worker (preview/), in una cartella sua.
const outDirAnteprima = process.env.BUTIK_PREVIEW_SW === '1' ? './dist-preview' : './dist-anteprima';

export default defineConfig({
  ...(process.env.SITE ? { site: process.env.SITE } : {}),
  ...(anteprima ? { output: 'server', adapter: bozze(), outDir: outDirAnteprima } : {}),
  prefetch: {
    prefetchAll: true,
  },
  // Come in Astro 6: lo spazio fra due elementi inline resta uno spazio. Con
  // il default di Astro 7 ('jsx') sparisce, e «<strong>a</strong> b» si legge «ab».
  compressHTML: true,
  // CSS in file esterni: nella pagina resta solo quello critico, estratto a
  // fine build (src/lib/cssCritico.ts); i file completi restano in cache.
  build: {
    inlineStylesheets: 'never',
  },
  image: anteprima ? { service: passthroughImageService(), domains: ['cdn.sanity.io'] } : {
    // AVIF (vedi src/lib/foto.ts): crominanza 4:2:0 invece del 4:4:4 di
    // sharp. A parità di resa (SSIM, foto del sito a 1200 px) l'AVIF così pesa
    // ~22% meno del WebP; con il 4:4:4 ~0%. Effort 4, il default: il 6 dà gli
    // stessi byte (−0,8%) in 2,8 volte il tempo, e a freddo in CI il build
    // durava 29 minuti; il 3 per la stessa resa pesa il 19% in più.
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: { avif: { chromaSubsampling: '4:2:0', effort: 4 } },
    },
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
  integrations: anteprima
    ? [react(), mdx(), pagineGuard()]
    : [react(), mdx(), sanityCdnGuard(), linkConBarra(), pagineGuard(), cssCritico(), fontCritici()],
  vite: { define: { __BUTIK_ANTEPRIMA__: JSON.stringify(anteprima) } },
});
