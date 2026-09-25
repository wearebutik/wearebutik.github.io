/**
 * ArrowCircle — atomo del catalogo @butik/ui.
 *
 * La freccia disegnata dentro un cerchio che dice "link": a riposo solo il
 * bordo, quando il link che la contiene è in hover o focus il cerchio si
 * riempie d'accento e la freccia avanza di 2px. Non è un link: è il segno
 * dentro un link. La usano `ArrowLink` (link testuale con freccia) e le card
 * che sono link per intero (le card dei servizi nell'hero della home).
 *
 * Hook dello stato attivo: l'antenato interattivo porta l'attributo
 * `data-arrow-circle-host`; il suo `:hover` / `:focus-visible` accende il
 * cerchio. È un attributo e non una classe perché il chiamante può essere un
 * `.astro`, i cui stili scoped non raggiungono il DOM dell'isola
 * (ADR-0008 #astro-island-boundary): l'attributo attraversa il confine,
 * nessuna regola scritta dal chiamante deve farlo.
 *
 * Accento del tono `default`: `--arrow-circle-accent`, poi `--accent`
 * ereditato dal contesto, poi l'accento globale. Il tono `invert` (fondo
 * scuro o fotografico) è bianco a riposo e rosso di brand all'hover.
 *
 * Decorativa (`aria-hidden`): il testo del link basta agli screen reader.
 * CSS Modules + token (ADR-0005), presentazionale (ADR-0008).
 */
import styles from './ArrowCircle.module.css';

export interface ArrowCircleProps {
  /**
   * Tonalità: `default` su fondo chiaro (bordo e freccia d'accento),
   * `invert` su fondo scuro o fotografico (bordo e freccia bianchi).
   */
  tone?: 'default' | 'invert';
  /**
   * Misura, in px interi per restare nitida: `sm` cerchio 28 e freccia 14
   * (accanto al testo, in `ArrowLink`), `md` cerchio 32 e freccia 16 (da
   * sola in una card).
   */
  size?: 'sm' | 'md';
  /** Classe aggiuntiva, unita a quelle interne (layout del chiamante). */
  className?: string;
}

export default function ArrowCircle({ tone = 'default', size = 'sm', className }: ArrowCircleProps) {
  const cls = [styles.circle, size === 'md' && styles.md, tone === 'invert' && styles.invert, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={cls} aria-hidden="true">
      {size === 'md' ? (
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 8h11M9 4l4 4-4 4" />
        </svg>
      ) : (
        <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 7h9M8 4l3 3-3 3" />
        </svg>
      )}
    </span>
  );
}
