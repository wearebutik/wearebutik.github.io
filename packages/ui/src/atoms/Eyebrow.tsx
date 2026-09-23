/**
 * Eyebrow — atomo del catalogo @butik/ui.
 *
 * Estrae il titoletto maiuscolo che precede i titoli di sezione, oggi
 * duplicato come markup quasi identico in 11+ file (`Metodo`, `Testimonials`,
 * `MetodoSteps`, `CosaFacciamo`, `BandiVinti`, `DiCosaCiOccupiamo`, `AdattoA`,
 * `ServiceHeroA/B/C`, `pages/partners.astro`). CSS Modules + token
 * (ADR-0005), componente presentazionale (ADR-0008).
 */
import type { ReactNode } from 'react';
import styles from './Eyebrow.module.css';

export interface EyebrowProps {
  /** Testo del titoletto. */
  children: ReactNode;
  /** Allineamento: sinistra (default) o centro (es. Testimonials). */
  align?: 'left' | 'center';
  /** Spaziatura sotto al testo: `md` (default, la maggioranza dei casi) o `sm` (es. AdattoA). */
  spacing?: 'md' | 'sm';
  /**
   * Tono: `accent` (default) per fondo chiaro, `invert` per fondo scuro.
   * Non e' una scelta estetica: su fondo scuro il rosso non raggiunge il 4.5:1
   * che questo testo richiede (12px bold = testo normale per WCAG), quindi
   * `invert` passa all'highlight. Usalo ogni volta che l'eyebrow sta su
   * `--color-bg-invert` o su un'immagine scurita.
   */
  tone?: 'accent' | 'invert';
}

export default function Eyebrow({
  children,
  align = 'left',
  spacing = 'md',
  tone = 'accent',
}: EyebrowProps) {
  const cls = [
    styles.eyebrow,
    align === 'center' && styles.center,
    spacing === 'sm' && styles.spacingSm,
    tone === 'invert' && styles.invert,
  ]
    .filter(Boolean)
    .join(' ');

  return <p className={cls}>{children}</p>;
}
