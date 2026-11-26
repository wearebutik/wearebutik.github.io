// @vitest-environment jsdom
// Il loop dei dischi (@butik/ui/vinylScratch) chiede un frame solo mentre c'è
// un disco da far girare: collegato alla pagina e visibile. Senza questo
// giravano a ogni frame per tutta la sessione, anche fuori schermo e dopo aver
// lasciato la pagina (il ClientRouter tiene vivo lo script).
import { beforeEach, describe, expect, it, vi } from 'vitest';

let frame: FrameRequestCallback | undefined;
let ora = 0;
const avanza = (ms: number) => {
  for (let t = 0; t < ms; t += 16) {
    ora += 16;
    const f = frame;
    frame = undefined;
    f?.(ora);
  }
};
const angolo = (el: HTMLElement) => Number(/rotate\((-?[\d.e+-]+)deg\)/.exec(el.style.transform)?.[1] ?? 0);

// IntersectionObserver finto: `mostra` simula il disco che entra o esce dallo schermo.
let osservatori: Array<{ cb: IntersectionObserverCallback; nodi: Set<Element> }> = [];
const mostra = (nodo: Element, visibile: boolean) => {
  for (const o of osservatori)
    if (o.nodi.has(nodo))
      o.cb([{ target: nodo, isIntersecting: visibile } as IntersectionObserverEntry], {} as IntersectionObserver);
};

beforeEach(() => {
  vi.resetModules();
  frame = undefined;
  ora = 0;
  osservatori = [];
  window.requestAnimationFrame = (cb) => {
    frame = cb;
    return 1;
  };
  window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia;
  window.IntersectionObserver = class {
    nodi = new Set<Element>();
    constructor(cb: IntersectionObserverCallback) {
      osservatori.push({ cb, nodi: this.nodi });
    }
    observe(n: Element) {
      this.nodi.add(n);
    }
    unobserve(n: Element) {
      this.nodi.delete(n);
    }
    disconnect() {
      this.nodi.clear();
    }
  } as unknown as typeof IntersectionObserver;
  document.body.innerHTML = '<div class="nodo"><span class="disco"></span></div>';
});

const init = async () => {
  const { initVinylScratch } = await import('@butik/ui/vinylScratch');
  initVinylScratch({ nodeSelector: '.nodo', discSelector: '.disco', speedVar: '--giro', defaultSpeed: 2 });
  return initVinylScratch;
};

describe('loop dei dischi', () => {
  it('fuori schermo non chiede frame; rientrato, il disco riprende a girare', async () => {
    await init();
    const nodo = document.querySelector('.nodo')!;
    const disco = document.querySelector<HTMLElement>('.disco')!;

    mostra(nodo, true);
    avanza(200);
    expect(angolo(disco)).toBeGreaterThan(0);

    mostra(nodo, false);
    avanza(32); // il frame già chiesto si chiude e non ne chiede altri
    expect(frame).toBeUndefined();
    const fermo = angolo(disco);

    mostra(nodo, true);
    expect(frame).toBeDefined();
    avanza(200);
    expect(angolo(disco)).toBeGreaterThan(fermo);
  });

  it('lasciata la pagina (disco scollegato) il loop si ferma, e riparte con i dischi della pagina nuova', async () => {
    const initVinylScratch = await init();
    mostra(document.querySelector('.nodo')!, true);
    avanza(100);

    document.body.innerHTML = '<p>altra pagina</p>';
    avanza(32);
    expect(frame).toBeUndefined();

    document.body.innerHTML = '<div class="nodo"><span class="disco"></span></div>';
    initVinylScratch({ nodeSelector: '.nodo', discSelector: '.disco', speedVar: '--giro', defaultSpeed: 2 });
    const nuovo = document.querySelector<HTMLElement>('.disco')!;
    mostra(document.querySelector('.nodo')!, true);
    avanza(200);
    expect(angolo(nuovo)).toBeGreaterThan(0);
  });

  it('con prefers-reduced-motion il loop non parte nemmeno quando il disco è a schermo', async () => {
    window.matchMedia = (() => ({ matches: true })) as unknown as typeof window.matchMedia;
    await init();
    mostra(document.querySelector('.nodo')!, true);
    expect(frame).toBeUndefined();
  });

  it('senza IntersectionObserver i dischi girano comunque', async () => {
    // @ts-expect-error — browser senza l'API
    delete window.IntersectionObserver;
    await init();
    const disco = document.querySelector<HTMLElement>('.disco')!;
    avanza(200);
    expect(angolo(disco)).toBeGreaterThan(0);
  });
});
