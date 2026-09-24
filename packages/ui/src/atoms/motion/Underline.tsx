/**
 * Underline — sottolineatura che si "disegna" quando il testo entra in vista.
 * Tratto leggermente irregolare, non una riga dritta: accento per un titolo o
 * per una parola chiave.
 *
 * Atomo di motion del catalogo @butik/ui (ADR-0008): CSS Modules sui token di
 * @butik/ui-tokens (ADR-0005).
 *
 * NOTA: a differenza degli altri atomi di motion questo ha bisogno del client —
 * il tratto parte nascosto e viene disegnato da un IntersectionObserver. In
 * Astro va montato con una direttiva (`client:visible`), altrimenti resta la
 * sola parola senza sottolineatura. Con `prefers-reduced-motion` il tratto è
 * già disegnato, senza transizione.
 *
 * Con `trigger="load"` il tratto si disegna al caricamento con un'animazione
 * solo CSS: nessuna direttiva client, resta HTML statico. È il modo giusto
 * per un testo già visibile all'apertura della pagina (es. il titolo di un hero).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './Underline.module.css';

export interface UnderlineProps {
  tone?: 'accent' | 'highlight' | 'fg';
  /** `view` (default): si disegna entrando in vista, serve il client.
   *  `load`: si disegna al caricamento, solo CSS, nessuna idratazione. */
  trigger?: 'view' | 'load';
  /** Il testo da sottolineare. */
  children?: ReactNode;
  className?: string;
}

export default function Underline({ tone = 'accent', trigger = 'view', children, className }: UnderlineProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || drawn || trigger === 'load') return;
    // Senza IntersectionObserver si disegna subito: meglio del tratto assente.
    if (!('IntersectionObserver' in window)) {
      setDrawn(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.9 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [drawn, trigger]);

  const cls = [styles.uline, styles[tone], drawn && styles.drawn, trigger === 'load' && styles.onLoad, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={cls} ref={ref}>
      {children}
      <svg className={styles.svg} viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true">
        <path d="M2 9 C 60 3, 110 12, 160 7 S 250 4, 298 8" />
      </svg>
    </span>
  );
}
