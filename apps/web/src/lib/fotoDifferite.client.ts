// Foto rimandate a dopo il caricamento della pagina (<Foto differita>): il
// loro srcset/src aspetta in data-*. Servono alle foto che il browser
// scaricherebbe subito anche se non si vedono ancora — le foto successive
// dello slideshow della home stanno nello schermo, trasparenti, e
// loading="lazy" non le ferma. Così la banda del primo caricamento va alla
// prima foto e al resto della pagina.

function carica(root: ParentNode) {
  for (const img of root.querySelectorAll<HTMLImageElement>('img[data-src]')) {
    for (const s of img.parentElement?.querySelectorAll<HTMLSourceElement>('source[data-srcset]') ?? []) {
      s.srcset = s.dataset.srcset!;
      s.removeAttribute('data-srcset');
    }
    img.src = img.dataset.src!;
    img.removeAttribute('data-src');
  }
}

/** Carica le foto differite di `root` dopo il load, a browser fermo. Idempotente. */
export function caricaFotoDifferite(root: ParentNode = document) {
  const avvia = () => ('requestIdleCallback' in window ? requestIdleCallback(() => carica(root)) : setTimeout(() => carica(root), 200));
  if (document.readyState === 'complete') avvia();
  else window.addEventListener('load', avvia, { once: true });
}
