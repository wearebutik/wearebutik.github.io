/**
 * ImageSide — molecola del catalogo @butik/ui.
 *
 * Figura con immagine (aspect naturale) e didascalia opzionale, affiancata a un
 * testo nel body editoriale. Il layout a due colonne, il lato dell'immagine e
 * lo slot del testo restano nel wrapper `.astro` app-side
 * (`apps/web/src/components/mdx/ImageSide.astro`) perché lo slot e il wrapper
 * `.prose` sono concern di composizione pagina, non del componente condiviso. Riceve `src`/`srcSet` già risolti — vedi ADR-0008 amendment
 * 2026-07-21.
 */
import styles from './ImageSide.module.css';

export interface ImageSideProps {
  src: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
}

export default function ImageSide({
  src,
  srcSet,
  sizes,
  width,
  height,
  alt = '',
  caption,
}: ImageSideProps) {
  return (
    <figure className={styles.figure}>
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        width={width}
        height={height}
        alt={alt}
        className={styles.image}
      />
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
