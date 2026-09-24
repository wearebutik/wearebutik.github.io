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
}

function transitionStyle(name?: string): CSSProperties | undefined {
  return name ? ({ viewTransitionName: name } as CSSProperties) : undefined;
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
}: HeroBannerProps) {
  return (
    <section className={styles.hero} data-hero-banner>
      <div className={styles.imageWrap}>
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          width={width}
          height={height}
          alt={imageAlt}
          loading="eager"
          fetchPriority="high"
          className={styles.image}
          style={transitionStyle(transitionName)}
        />
        <div className={styles.gradient} />
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
