/**
 * HeroBanner — organismo del catalogo @butik/ui.
 *
 * Isola React presentazionale: hero full-bleed con immagine di sfondo,
 * titolo, sottotitolo opzionale. Riceve `src`/`srcSet` già risolti dal
 * chiamante `.astro` (via `getImage()` di `astro:assets`, non `<Image>` —
 * quest'ultimo è un componente Astro-only, non eseguibile dentro un'isola
 * React né in Storybook). Il morph tra pagine (`transition:name` di Astro)
 * è a sua volta un compilatore-only feature: qui è replicato con l'unico
 * meccanismo davvero portabile, l'inline style `view-transition-name` su
 * cui si basa — stesso output HTML, nessuna dipendenza dal compilatore
 * Astro. Vedi ADR-0008 amendment 2026-07-21.
 */
import type { CSSProperties } from 'react';
import styles from './HeroBanner.module.css';
import Picture, { type ImageSource } from '../lib/Picture';

export interface HeroBannerProps {
  title: string;
  subtitle?: string;
  src: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  imageAlt?: string;
  /** Nome della view transition Astro (morph tra pagine); opzionale. */
  transitionName?: string;
  /**
   * Segnaposto mostrato sotto la foto finché non arriva: di solito l'LQIP
   * (miniatura sfocata come data: URI) calcolato dal chiamante a build time.
   */
  placeholder?: string;
  /** Sorgenti per formato (es. AVIF, poi WebP) risolte dal chiamante: con
   *  queste l'immagine è un <picture>; `src`/`srcSet` restano la riserva. */
  sources?: ImageSource[];
}

function transitionStyle(name?: string): CSSProperties | undefined {
  return name ? ({ viewTransitionName: name } as CSSProperties) : undefined;
}

// Il segnaposto è lo sfondo della foto stessa, in una custom property: il sito
// può anteporgli un altro livello (la foto della card già in cache, vedi
// BaseLayout) senza conoscerne il resto.
function placeholderStyle(placeholder?: string): CSSProperties | undefined {
  return placeholder ? ({ '--placeholder': `url("${placeholder}")` } as CSSProperties) : undefined;
}

export default function HeroBanner({
  title,
  subtitle,
  src,
  srcSet,
  sizes,
  width,
  height,
  imageAlt = '',
  transitionName,
  placeholder,
  sources,
}: HeroBannerProps) {
  return (
    <section className={styles.hero} data-hero-banner>
      <div className={styles.imageWrap}>
        <Picture
          sources={sources}
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          width={width}
          height={height}
          alt={imageAlt}
          loading="eager"
          fetchPriority="high"
          className={styles.image}
          style={{ ...transitionStyle(transitionName), ...placeholderStyle(placeholder) }}
        />
      </div>

      <div className={styles.content}>
        <h1 className={styles.title} style={transitionStyle(transitionName && `${transitionName}-title`)}>
          {title}
        </h1>
        {subtitle && (
          <p
            className={styles.subtitle}
            style={transitionStyle(transitionName && `${transitionName}-subtitle`)}
          >
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
