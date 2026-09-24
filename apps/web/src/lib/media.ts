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

/**
 * Dimensioni per <Image>/getImage di un'immagine remota. Gli URL degli asset
 * Sanity portano le dimensioni originali nel nome (`…-1200x700.jpg`): leggerle
 * da lì evita la richiesta in più di `inferSize`, che a build time può fallire
 * per un errore di rete. Con `height` si ottiene la larghezza in proporzione
 * (loghi ad altezza fissa). Per un asset locale non serve nulla: `{}`.
 */
export function imageSize(
  src: ImageMetadata | string,
  opts: { height?: number } = {},
): { width?: number; height?: number; inferSize?: boolean } {
  if (typeof src !== 'string') return opts.height ? { height: opts.height } : {};
  const m = src.match(/-(\d+)x(\d+)\.[a-z0-9]+(?:\?|$)/i);
  if (!m) return { inferSize: true, ...(opts.height && { height: opts.height }) };
  const [w, h] = [Number(m[1]), Number(m[2])];
  return opts.height ? { width: Math.round((opts.height * w) / h), height: opts.height } : { width: w, height: h };
}
