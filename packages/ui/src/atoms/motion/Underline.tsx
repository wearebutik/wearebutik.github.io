/**
 * Underline — sottolineatura che si "disegna" al caricamento. Tratto
 * leggermente irregolare, non una riga dritta: accento per una parola chiave di
 * un titolo già visibile all'apertura della pagina (es. il titolo di un hero).
 *
 * Atomo di motion del catalogo @butik/ui (ADR-0008): CSS Modules sui token di
 * @butik/ui-tokens (ADR-0005). L'animazione è solo CSS: nessuna direttiva
 * client, resta HTML statico (ADR-0002). Con `prefers-reduced-motion` il tratto
 * è già disegnato, senza animazione.
 */
import type { ReactNode } from 'react';
import styles from './Underline.module.css';

export interface UnderlineProps {
  tone?: 'accent' | 'highlight' | 'fg';
  /** Il testo da sottolineare. */
  children?: ReactNode;
  className?: string;
}

export default function Underline({ tone = 'accent', children, className }: UnderlineProps) {
  const cls = [styles.uline, styles[tone], className].filter(Boolean).join(' ');

  return (
    <span className={cls}>
      {children}
      <svg className={styles.svg} viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true">
        <path d="M2 9 C 60 3, 110 12, 160 7 S 250 4, 298 8" />
      </svg>
    </span>
  );
}
