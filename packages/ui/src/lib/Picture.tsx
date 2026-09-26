/**
 * Picture — <img> con sorgenti alternative per formato, ad uso interno dei
 * componenti del catalogo che mostrano foto (HeroBanner, ImageBlock,
 * ImageSide, ImageCarousel).
 *
 * Con `sources` (es. AVIF poi WebP, risolti app-side da `#lib/foto`) rende un
 * <picture> con display: contents: non entra nel layout, e l'<img> resta
 * l'elemento che si stila e si misura. Senza `sources` è un <img> e basta.
 */
import type { CSSProperties, ImgHTMLAttributes } from 'react';

export interface ImageSource {
  /** Tipo MIME della sorgente, es. 'image/avif'. */
  type: string;
  srcSet: string;
}

export interface PictureProps extends ImgHTMLAttributes<HTMLImageElement> {
  sources?: ImageSource[];
}

const contents: CSSProperties = { display: 'contents' };

export default function Picture({ sources, sizes, ...img }: PictureProps) {
  const el = <img sizes={sizes} {...img} />;
  if (!sources?.length) return el;
  return (
    <picture style={contents}>
      {sources.map((s) => (
        <source key={s.type} type={s.type} srcSet={s.srcSet} sizes={sizes} />
      ))}
      {el}
    </picture>
  );
}
