/**
 * ArrowLink — atomo del catalogo @butik/ui.
 *
 * Link testuale con freccia, non una CTA: la forma a pillola di PDR-0001 vale
 * per i bottoni (`Button`), non per questo ruolo. Estrae la grammatica
 * duplicata a mano in `home/Hero` ("Esplora tutti i servizi →") e
 * `serviziCards/ServiceExpanded` ("Scopri {servizio} →"): font display,
 * maiuscolo, tracking largo, freccia decorativa (`aria-hidden`, il testo del
 * link basta da solo agli screen reader).
 *
 * La freccia è l'atomo `ArrowCircle`, lo stesso delle card dei servizi:
 * disegnata (SVG a misure intere, nitida), dentro un cerchio che al passaggio
 * del mouse si riempie d'accento. È il cerchio a dire "link": niente
 * sottolineature separate dal testo. Il link porta `data-arrow-circle-host`,
 * l'hook con cui il suo hover e il suo focus accendono il cerchio.
 *
 * CSS Modules + token (ADR-0005), presentazionale (ADR-0008).
 */
import type { ReactNode } from 'react';
import ArrowCircle from './ArrowCircle';
import styles from './ArrowLink.module.css';

export interface ArrowLinkProps {
  /** Destinazione del link. */
  href: string;
  /** Testo del link (la freccia la aggiunge il componente). */
  children: ReactNode;
  /**
   * Tonalità: `default` su fondo chiaro (testo scuro, cerchio d'accento),
   * `invert` su fondo scuro o fotografico (testo e cerchio bianchi). Il colore d'accento del tono `default` si può ritonare
   * dal contesto con `--arrow-link-accent` (o `--accent`, come fanno le card
   * dei servizi che hanno già un accento per categoria).
   */
  tone?: 'default' | 'invert';
  /** Classe aggiuntiva, unita a quelle interne. */
  className?: string;
}

export default function ArrowLink({ href, children, tone = 'default', className }: ArrowLinkProps) {
  const cls = [styles.link, tone === 'invert' && styles.invert, className]
    .filter(Boolean)
    .join(' ');

  return (
    <a className={cls} href={href} data-arrow-circle-host>
      {children}
      <ArrowCircle tone={tone} />
    </a>
  );
}
