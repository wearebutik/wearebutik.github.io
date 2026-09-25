/**
 * TapeReels — due bobine da mangianastri collegate dal nastro, che girano in
 * loop. Accento-firma nostalgico, alternativo a Equalizer.
 *
 * Atomo di motion del catalogo @butik/ui (ADR-0008): CSS Modules sui token di
 * @butik/ui-tokens (ADR-0005). Decorativo, animazione tutta CSS.
 */
import styles from './TapeReels.module.css';

export interface TapeReelsProps {
  /** Diametro di ciascun rullo, in px. Il nastro scala con lui. */
  size?: number;
  tone?: 'onLight' | 'onDark';
  /** Secondi per giro. */
  speed?: number;
  className?: string;
}

// Tre razze per rullo: bastano a rendere leggibile la rotazione.
const SPOKES = [0, 1, 2];

export default function TapeReels({
  size = 40,
  tone = 'onLight',
  speed = 3,
  className,
}: TapeReelsProps) {
  const cls = [styles.reels, styles[tone], className].filter(Boolean).join(' ');
  const reel = (
    <span className={styles.reel}>
      {SPOKES.map((i) => (
        <i key={i} />
      ))}
    </span>
  );

  return (
    <span
      className={cls}
      style={
        { '--reel-size': `${size}px`, '--reel-speed': `${speed}s` } as React.CSSProperties
      }
      aria-hidden="true"
    >
      {reel}
      <span className={styles.tape} />
      {reel}
    </span>
  );
}
