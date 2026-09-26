/**
 * ImageBlock — molecola del catalogo @butik/ui.
 *
 * Blocco immagine full-width con didascalia opzionale, per il body
 * editoriale (contenuto MDX). Riceve `src`/`srcSet` già risolti dal
 * chiamante `.astro` — l'ottimizzazione delle immagini (`getImage()`)
 * resta app-side, Astro/Vite-only. Vedi ADR-0008 amendment
 * 2026-07-21.
 */
import styles from './ImageBlock.module.css';
import Picture, { type ImageSource } from '../lib/Picture';

export interface ImageBlockProps {
  src: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  /** Sorgenti per formato (es. AVIF, poi WebP) risolte dal chiamante: con
   *  queste l'immagine è un <picture>; `src`/`srcSet` restano la riserva. */
  sources?: ImageSource[];
}

export default function ImageBlock({
  src,
  srcSet,
  sizes,
  width,
  height,
  alt = '',
  caption,
  sources,
}: ImageBlockProps) {
  return (
    <figure className={styles.figure}>
      {/* Il ritaglio ad altezza fissa vive sul contenitore dell'immagine, non
          sulla figure: sulla figure ritagliava via anche la didascalia. */}
      <div className={styles.frame}>
        <Picture
          sources={sources}
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          width={width}
          height={height}
          alt={alt}
          className={styles.image}
        />
      </div>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
