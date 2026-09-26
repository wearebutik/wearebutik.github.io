// Prefetch più anticipato di quello di default (hover/focus, vedi `prefetch` in
// astro.config.mjs) per le sezioni che lo chiedono. Su mobile l'hover non
// esiste: senza questo la pagina successiva si scarica solo al tocco.
//
//   data-prefetch="viewport"  i link interni si scaricano quando entrano nello schermo
//   data-prefetch="eager"     i link interni si scaricano appena la pagina è ferma
//
// L'attributo sta sul contenitore, non sul link, così vale anche per i link
// disegnati dai componenti del catalogo (Button, ArrowLink), che non inoltrano
// attributi. prefetch() di Astro salta i doppioni, la pagina corrente, il
// risparmio dati e le connessioni lente.
import { prefetch } from 'astro:prefetch';

function linkInterni(root: ParentNode): HTMLAnchorElement[] {
  return [...root.querySelectorAll<HTMLAnchorElement>('a[href]')].filter(
    (a) =>
      a.origin === location.origin &&
      !a.hasAttribute('download') &&
      a.target !== '_blank' &&
      // gli stessi opt-out del prefetch di Astro
      !a.hasAttribute('data-astro-reload') &&
      a.dataset.astroPrefetch !== 'false',
  );
}

/** Arma le sezioni della pagina; restituisce la funzione che le disarma. */
export function initPrefetch(root: ParentNode = document): () => void {
  const eager = [...root.querySelectorAll('[data-prefetch="eager"]')].flatMap(linkInterni);
  const viewport = [...root.querySelectorAll('[data-prefetch="viewport"]')].flatMap(linkInterni);

  // Eager dopo il load e a browser fermo: non deve rubare banda alle immagini
  // della pagina che si sta guardando.
  let idle: number | undefined;
  const avviaEager = () => {
    const run = () => eager.forEach((a) => prefetch(a.href));
    idle = 'requestIdleCallback' in window ? requestIdleCallback(run) : window.setTimeout(run, 200);
  };
  if (eager.length) {
    if (document.readyState === 'complete') avviaEager();
    else window.addEventListener('load', avviaEager, { once: true });
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      prefetch((entry.target as HTMLAnchorElement).href);
      observer.unobserve(entry.target);
    }
  });
  viewport.forEach((a) => observer.observe(a));

  return () => {
    observer.disconnect();
    window.removeEventListener('load', avviaEager);
    if (idle !== undefined) ('cancelIdleCallback' in window ? cancelIdleCallback : clearTimeout)(idle);
  };
}
