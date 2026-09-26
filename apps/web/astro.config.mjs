// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { sanityCdnGuard } from './src/lib/sanityCdnGuard.ts';
import { basePath } from './src/lib/basePath.ts';
import { pagineGuard } from './src/lib/pagineGuard.ts';
import { fontCritici } from './src/lib/fontCritici.ts';
import { cssCritico } from './src/lib/cssCritico.ts';
import { linkConBarra } from './src/lib/linkConBarra.ts';

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
  // CSS in file esterni: nella pagina resta solo quello critico, estratto a
  // fine build (src/lib/cssCritico.ts); i file completi restano in cache.
  build: {
    inlineStylesheets: 'never',
  },
  image: {
    // AVIF (vedi src/lib/foto.ts): crominanza 4:2:0 ed effort 6 invece dei
    // default di sharp (4:4:4, 4). A parità di resa (SSIM, foto del sito a
    // 1200 px) l'AVIF così pesa ~22% meno del WebP; con i default ~0%.
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: { avif: { chromaSubsampling: '4:2:0', effort: 6 } },
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
  integrations: [react(), mdx(), sanityCdnGuard(), basePath(), linkConBarra(), pagineGuard(), cssCritico(), fontCritici()],
});
