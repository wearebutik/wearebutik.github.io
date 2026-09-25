/**
 * NumberBadge — atomo del catalogo @butik/ui.
 *
 * Pallino numerato usato per gli step di un elenco ordinato: "Il nostro
 * metodo" in /servizi (misura `md`) e le tappe dei vinili in home (misura
 * `sm`, appoggiato al bordo del disco). CSS Modules + token (ADR-0005),
 * componente presentazionale (ADR-0008).
 *
 * Hook di contesto: `--number-badge-ring` disegna un anello pieno di 4px
 * attorno al pallino, del colore indicato — lo stacca da ciò su cui si
 * sovrappone (il disco in home usa il bianco della sezione). Senza hook,
 * nessun anello.
 */
import styles from './NumberBadge.module.css';

export interface NumberBadgeProps {
  /** Numero dello step (1-based); reso con zero-padding a 2 cifre. */
  number: number;
  /**
   * Misura: `md` accanto al testo di uno step, `sm` sovrapposto a un
   * elemento grafico.
   */
  size?: 'sm' | 'md';
}

export default function NumberBadge({ number, size = 'md' }: NumberBadgeProps) {
  const cls = [styles.badge, size === 'sm' && styles.sm].filter(Boolean).join(' ');
  return <span className={cls}>{String(number).padStart(2, '0')}</span>;
}
