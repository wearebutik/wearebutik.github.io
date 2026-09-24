/**
 * MetaLabel — atomo del catalogo @butik/ui.
 *
 * Il metadato dentro una card o una scheda: categoria di un progetto, ruolo di
 * un membro del team, "Cliente"/"Anno" nella barra di un progetto. Non apre
 * niente: accompagna il contenuto a cui appartiene, prima o dopo il titolo.
 *
 * Nasce con la stessa grammatica di `Eyebrow` (maiuscolo, display, tracking
 * largo, rosso testo) ma è un ruolo distinto, e i due possono divergere: se il
 * titoletto di sezione cambia scala, i metadati non lo seguono. Decisione
 * registrata in docs/guidances/design-approach.md#two-small-caps-roles.
 *
 * Nessun margine proprio: la spaziatura la decide il contenitore, che è
 * `.astro` e non raggiunge il DOM dell'isola con gli stili scoped
 * (ADR-0008 #astro-island-boundary).
 *
 * CSS Modules + token (ADR-0005), presentazionale (ADR-0008).
 */
import type { ReactNode } from 'react';
import styles from './MetaLabel.module.css';

export interface MetaLabelProps {
  /** Testo del metadato. */
  children: ReactNode;
  /**
   * Elemento: `span` (default) dentro una riga di metadati o accanto a un
   * valore; `p` quando il metadato è un blocco a sé.
   */
  as?: 'span' | 'p';
}

export default function MetaLabel({ children, as: Tag = 'span' }: MetaLabelProps) {
  return <Tag className={styles.label}>{children}</Tag>;
}
