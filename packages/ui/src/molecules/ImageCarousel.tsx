/**
 * ImageCarousel — molecola del catalogo @butik/ui.
 *
 * Carosello di immagini con scroll-snap orizzontale, frecce prev/next e dot
 * di navigazione. A differenza delle altre molecole immagine, ha
 * interattività reale (non solo presentazione): richiede una direttiva
 * client (`client:visible`) quando consumato in Astro — ADR-0008 lo prevede
 * esplicitamente ("aggiunta solo quando serve interattività"). Riceve
 * `images` con `src`/`srcSet` già risolti dal chiamante `.astro` — vedi
 * ADR-0008 amendment 2026-07-21.
 */
import { useRef, useState } from 'react';
import styles from './ImageCarousel.module.css';
import Picture, { type ImageSource } from '../lib/Picture';

export interface CarouselImage {
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

export interface ImageCarouselProps {
  images: CarouselImage[];
}

export default function ImageCarousel({ images }: ImageCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;

    // La galleria è circolare: Prev dalla prima porta all'ultima e Next
    // dall'ultima torna alla prima. Così nessuno dei due bottoni è mai in uno
    // stato speciale — niente `disabled` (che scarica il focus sul body
    // proprio mentre lo si sta usando) e niente `aria-disabled` da annunciare.
    const wrapped = (index + images.length) % images.length;

    // Il giro di ritorno è istantaneo. Il track è uno scroller nativo: con
    // `smooth` il browser scorrerebbe all'indietro attraverso tutte le
    // immagini in mezzo, che legge come "indietro di tre" invece che "torna
    // all'inizio". Lo stacco netto comunica il giro.
    const isWrap = index < 0 || index > images.length - 1;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    track.scrollTo({
      left: wrapped * track.clientWidth,
      behavior: isWrap || reducedMotion ? 'auto' : 'smooth',
    });
    setCurrent(wrapped);
  };

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setCurrent(Math.round(track.scrollLeft / track.clientWidth));
  };

  return (
    <div
      className={styles.carousel}
      role="group"
      aria-roledescription="carosello"
      aria-label="Galleria immagini"
    >
      {/* tabIndex sul track: è una regione scrollabile, e senza essere
          focusabile non sarebbe raggiungibile da tastiera (SC 2.1.1) da chi
          non usa i bottoni. */}
      <div
        className={styles.track}
        ref={trackRef}
        onScroll={handleScroll}
        tabIndex={0}
        role="group"
        aria-label="Immagini, scorrevole"
      >
        {images.map((img, i) => (
          <div className={styles.slide} key={`${img.src}-${i}`}>
            <figure className={styles.figure}>
              {/* Sfondo: la stessa foto, sfocata, riempie lo spazio attorno
                  a una foto che non ne ha le proporzioni (es. verticale).
                  Stesso src/srcSet: il browser la scarica una volta sola. */}
              <Picture
                sources={img.sources}
                src={img.src}
                srcSet={img.srcSet}
                sizes={img.sizes}
                alt=""
                aria-hidden="true"
                className={styles.backdrop}
              />
              <Picture
                sources={img.sources}
                src={img.src}
                srcSet={img.srcSet}
                sizes={img.sizes}
                width={img.width}
                height={img.height}
                alt={img.alt ?? ''}
                className={styles.image}
              />
              {img.caption && <figcaption className={styles.caption}>{img.caption}</figcaption>}
            </figure>
          </div>
        ))}
      </div>

      {images.length > 1 && (
      <>
      {/* Sostituisce il segnale che dava `aria-disabled`: in una galleria
          circolare non esistono più estremi, quindi la posizione va detta. */}
      <p aria-live="polite" className={styles.status}>
        Immagine {current + 1} di {images.length}
      </p>
      <div className={styles.controls}>
        <button
          type="button"
          aria-label="Immagine precedente"
          className={styles.navButton}
          onClick={() => goTo(current - 1)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={styles.navIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Prev
        </button>

        <div className={styles.dots}>
          {images.map((img, i) => (
            <button
              key={`${img.src}-${i}`}
              type="button"
              aria-label={`Vai all'immagine ${i + 1}`}
              /* Lo stato attivo era veicolato dal solo colore: senza
                 aria-current non arrivava alle tecnologie assistive. */
              aria-current={i === current ? 'true' : undefined}
              className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Immagine successiva"
          className={styles.navButton}
          onClick={() => goTo(current + 1)}
        >
          Next
          <svg xmlns="http://www.w3.org/2000/svg" className={styles.navIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      </>
      )}
    </div>
  );
}
