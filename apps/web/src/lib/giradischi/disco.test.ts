// @vitest-environment jsdom
// Il disco della 404 usa lo scratch dei dischi del Metodo (@butik/ui/vinylScratch),
// ma parte fermo e gira solo con «Rimetti il disco»: al rilascio di una spinta
// l'inerzia lo riporta alla sua velocità di regime, che da fermo è zero.
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

beforeEach(() => {
  vi.resetModules();
  frame = undefined;
  ora = 0;
  window.requestAnimationFrame = (cb) => {
    frame = cb;
    return 1;
  };
  window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia;
  document.body.innerHTML = '<div class="nodo"><span class="disco"></span></div>';
});

describe('disco della 404', () => {
  it('parte fermo, gira con impostaGiro(true) e torna a fermarsi con impostaGiro(false)', async () => {
    const { initVinylScratch, impostaGiro } = await import('@butik/ui/vinylScratch');
    initVinylScratch({ nodeSelector: '.nodo', discSelector: '.disco', speedVar: '--giro', defaultSpeed: 2, fermo: true });
    const disco = document.querySelector<HTMLElement>('.disco')!;

    avanza(500);
    expect(angolo(disco)).toBe(0);

    impostaGiro(disco, true);
    avanza(2000);
    const inMoto = angolo(disco);
    expect(inMoto).toBeGreaterThan(90);

    impostaGiro(disco, false);
    avanza(5000);
    const fermo = angolo(disco);
    avanza(1000);
    expect(angolo(disco) - fermo).toBeLessThan(1);
  });

  it('i dischi del Metodo, senza `fermo`, girano da subito come prima', async () => {
    const { initVinylScratch } = await import('@butik/ui/vinylScratch');
    initVinylScratch({ nodeSelector: '.nodo', discSelector: '.disco', speedVar: '--giro', defaultSpeed: 2 });
    avanza(1000);
    expect(angolo(document.querySelector<HTMLElement>('.disco')!)).toBeGreaterThan(90);
  });
});
