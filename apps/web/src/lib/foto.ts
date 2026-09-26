// Come il sito genera una foto: un solo posto per formati, qualità e densità.
//
// - AVIF con WebP di riserva: a parità di resa l'AVIF pesa ~22% in meno, e il
//   browser che non lo legge prende la sorgente WebP (<picture>/<source>).
// - Qualità per ruolo: le hero si guardano da vicino, le miniature delle card
//   no. I valori AVIF danno la stessa resa del WebP accanto (SSIM misurato
//   sulle foto del sito, con la codifica di astro.config.mjs): 52 ≈ WebP 72,
//   50 ≈ WebP 60.
// - Densità massima 2×: sugli schermi a 3× (quasi tutti i telefoni) `sizes`
//   dichiara 2/3 della larghezza, così il browser sceglie la versione a 2×.
//   In una foto la differenza fra 2× e 3× non si vede; nei byte sì (~45%).
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { imageSize, isRemote } from '#lib/media';

export type Ruolo = 'hero' | 'miniatura';

const QUALITA: Record<Ruolo, { avif: number; webp: number }> = {
  hero: { avif: 52, webp: 72 },
  miniatura: { avif: 50, webp: 60 },
};

export interface Sorgente {
  type: string;
  srcSet: string;
}

export interface Foto {
  /** WebP alla larghezza massima: il src dell'<img>, per chi non legge srcset. */
  src: string;
  /** Sorgenti in ordine di preferenza (AVIF, poi WebP) per <picture>. */
  sources: Sorgente[];
  sizes: string;
  width?: number;
  height?: number;
}

/**
 * `sizes` con la densità limitata a 2×. Ogni voce ("(cond) 50vw", "100vw")
 * riceve una gemella per gli schermi ≥ 2,5× con la larghezza ai 2/3, messa
 * prima perché vince la prima condizione vera.
 */
export function sizesMax2x(sizes: string): string {
  const voci = sizes.split(',').map((v) => v.trim());
  const ridotte = voci.map((v) => {
    const m = v.match(/^(\(.*\))\s+(.+)$/);
    const [cond, len] = m ? [m[1], m[2]] : [undefined, v];
    const hiDpi = '(min-resolution: 2.5dppx)';
    return `${cond ? `${cond} and ${hiDpi}` : hiDpi} calc(${len} * 2 / 3)`;
  });
  return [...ridotte, ...voci].join(', ');
}

/** Risolve una foto (asset locale o URL Sanity) nelle sue sorgenti. */
export async function foto(
  src: ImageMetadata | string,
  { widths, sizes, ruolo = 'hero' }: { widths: number[]; sizes: string; ruolo?: Ruolo },
): Promise<Foto> {
  const q = QUALITA[ruolo];
  const opzioni = { src, ...imageSize(src), widths, sizes };
  const [avif, webp] = await Promise.all([
    getImage({ ...opzioni, format: 'avif', quality: q.avif }),
    getImage({ ...opzioni, format: 'webp', quality: q.webp }),
  ]);
  return {
    src: webp.src,
    sources: [
      { type: 'image/avif', srcSet: avif.srcSet.attribute },
      { type: 'image/webp', srcSet: webp.srcSet.attribute },
    ],
    sizes: sizesMax2x(sizes),
    width: webp.attributes.width as number | undefined,
    height: webp.attributes.height as number | undefined,
  };
}

/**
 * Come `foto`, ma un percorso locale di public/ (stringa non remota) passa
 * così com'è: niente da ottimizzare, nessuna sorgente alternativa.
 */
export async function fotoOPercorso(
  src: ImageMetadata | string,
  opzioni: { widths: number[]; sizes: string; ruolo?: Ruolo },
): Promise<Foto> {
  if (typeof src === 'string' && !isRemote(src)) return { src, sources: [], sizes: opzioni.sizes };
  return foto(src, opzioni);
}
