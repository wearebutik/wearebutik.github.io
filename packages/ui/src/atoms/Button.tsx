/**
 * Button — atomo del catalogo @butik/ui.
 *
 * Island React (ADR-0008): stesso contratto della vecchia versione .astro, ma
 * autorabile in Storybook. Stile in CSS Modules + token di @butik/ui-tokens
 * (ADR-0005): niente Tailwind, nessun valore grezzo dove esiste un token.
 * Reso come <a> quando c'è `href`, altrimenti <button>. Componente
 * presentazionale: senza direttiva client Astro lo rende a HTML statico.
 */
import type { ReactNode } from 'react';
import styles from './Button.module.css';

interface ButtonBaseProps {
  /** Variante visiva: piena (primary) o contorno (ghost). */
  variant?: 'primary' | 'ghost';
  /**
   * Tonalità di colore, per l'uso su sfondi diversi dal default.
   * `dark` (solo `primary`): sfondo `--color-fg` invece dell'accent rosso —
   * CTA su header/hero chiari. `invert`: per sfondi scuri o fotografici — con
   * `primary` resta rosso e l'anello di focus diventa bianco; con `ghost`
   * bordo/testo `--color-fg-invert`.
   * `accent` (solo `ghost`): bordo/testo colore accent invece del foreground
   * scuro — outline colorato su sfondo chiaro (es. CtaProgetti). Omessa:
   * colori classici (primary = accent, ghost = foreground scuro).
   */
  tone?: 'accent' | 'dark' | 'invert';
  /** Contenuto del bottone (testo, icona + testo, ...). */
  children?: ReactNode;
  /**
   * Classe aggiuntiva, unita (non sostituita) a quelle interne. Escape hatch
   * per i chiamanti app-side che devono agganciare un hook locale (es. lo
   * stato overlay-su-scroll dell'header) senza reimplementare il bottone.
   */
  className?: string;
}

/** Con `href` è un link <a>: `type` e `disabled` non esistono. */
interface ButtonAsLinkProps extends ButtonBaseProps {
  href: string;
  type?: never;
  disabled?: never;
}

/** Senza `href` è un <button>. */
interface ButtonAsButtonProps extends ButtonBaseProps {
  href?: undefined;
  /** Tipo del <button>. */
  type?: 'button' | 'submit' | 'reset';
  /** Disabilitato. Lo stato si può anche impostare da script. */
  disabled?: boolean;
}

export type ButtonProps = ButtonAsLinkProps | ButtonAsButtonProps;

export default function Button({
  href,
  variant = 'primary',
  tone,
  type = 'button',
  disabled,
  children,
  className,
}: ButtonProps) {
  const toneKey = tone ? `${variant}_${tone}` : variant;
  const cls = [styles.button, styles[toneKey] ?? styles[variant], className].filter(Boolean).join(' ');

  return href ? (
    <a className={cls} href={href}>
      {children}
    </a>
  ) : (
    <button className={cls} type={type} disabled={disabled}>
      {children}
    </button>
  );
}
