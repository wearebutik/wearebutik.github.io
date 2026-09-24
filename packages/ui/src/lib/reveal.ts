// ── Animazioni d'ingresso "ritmo musicale" ─────────────────────────────────
// Logica condivisa dal sito (BaseLayout, su ogni pagina): vive in @butik/ui
// perché è motion trasversale a componenti diversi (ADR-0010). Gli stili
// (rimbalzo, sottolineatura) sono in apps/web/src/styles/motion.css.
//
// Ogni elemento si anima una volta sola, la prima volta che entra in vista, e
// poi resta. Gli elementi che entrano nello stesso momento partono in
// sequenza, nell'ordine della pagina (come le card dell'hero). Lo script
// arma gli elementi (data-reveal="attesa") e li fa partire (data-reveal="in")
// con il ritardo --d: senza script nulla è armato e tutto resta visibile. Con
// prefers-reduced-motion non arma niente.

export interface RevealOptions {
  /** Contenitori i cui figli diretti entrano in sequenza. */
  groupSelector?: string;
  /** Titoli che si sottolineano all'ingresso. */
  headingSelector?: string;
  /** Millisecondi fra un elemento e il successivo della stessa entrata. */
  step?: number;
  /** Millisecondi prima del primo, perché il rimbalzo si veda. */
  delay?: number;
}

const DEFAULTS: Required<RevealOptions> = {
  groupSelector:
    "section:not(.hero, [data-hero]) :is([class*='grid'], [class*='list'], [class*='cards'], ol:not(.prose ol))",
  headingSelector: 'section:not(.hero, [data-hero]) h2:not(.prose h2)',
  step: 120,
  delay: 150,
};

/**
 * Arma le animazioni d'ingresso dentro `root`. Idempotente: un root già armato
 * viene saltato (il ClientRouter rimpiazza <main> a ogni navigazione, quindi
 * ogni pagina arriva con un nodo nuovo). Restituisce una funzione che stacca
 * l'osservatore, da chiamare prima dello swap.
 */
export function initReveal(root: HTMLElement | null, options: RevealOptions = {}): () => void {
  const noop = () => {};
  if (!root || root.dataset.revealBound) return noop;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return noop;
  if (!('IntersectionObserver' in window)) return noop;
  root.dataset.revealBound = 'true';

  const { groupSelector, headingSelector, step, delay } = { ...DEFAULTS, ...options };
  const candidati = new Set([
    ...root.querySelectorAll<HTMLElement>(`${groupSelector} > :not([data-no-reveal])`),
    ...root.querySelectorAll<HTMLElement>(`${headingSelector}:not([data-no-reveal])`),
  ]);
  // Un elemento dentro un altro che già si anima (es. il titolo dentro la
  // card) non si anima di nuovo: rimbalza la card intera, una volta.
  const dentroUnAltro = (el: HTMLElement) => {
    for (let p = el.parentElement; p && p !== root; p = p.parentElement) if (candidati.has(p)) return true;
    return false;
  };
  const elementi = [...candidati].filter((el) => !dentroUnAltro(el));
  elementi.forEach((el) => (el.dataset.reveal = 'attesa'));

  const io = new IntersectionObserver(
    (entries) => {
      const entrati = entries
        .filter((e) => e.isIntersecting)
        .map((e) => e.target as HTMLElement)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      entrati.forEach((el, i) => {
        el.style.setProperty('--d', `${delay + i * step}ms`);
        el.dataset.reveal = 'in';
        io.unobserve(el);
      });
    },
    // Parte appena l'elemento supera di poco il fondo dello schermo.
    { rootMargin: '0px 0px -8% 0px' },
  );
  elementi.forEach((el) => io.observe(el));
  return () => io.disconnect();
}
