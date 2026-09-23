import type { ImageMetadata } from 'astro';

// Mappa a build-time di tutti gli asset immagine sotto src/assets. Serve a
// risolvere i path *stringa* scritti nei contenuti (convenzione `/src/assets/…`
// — vedi ADR-0009) all'asset importato, così i componenti MDX possono usare
// `<Image>` ottimizzato senza `import` espliciti nel corpo del .mdx.
const assets = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/**/*.{jpg,jpeg,png,webp,avif,gif,svg}',
  { eager: true },
);

/**
 * Risolve un path immagine (stringa) all'`ImageMetadata` importato.
 * Accetta la convenzione dei contenuti `/src/assets/…` e quella scritta da
 * Sitepins `/assets/…`. Se non c'è corrispondenza (URL esterno o file servito
 * da `public/`) ritorna la stringa invariata, così il chiamante la usa come src
 * grezzo.
 */
export function resolveAsset(src: string): ImageMetadata | string {
  const key = src.startsWith('/assets/') ? `/src${src}` : src;
  return assets[key]?.default ?? src;
}

/** URL assoluto (es. CDN Sanity): Astro lo ottimizza se il dominio è in `image.domains`. */
export function isRemote(src: string): boolean {
  return /^https?:\/\//.test(src);
}
