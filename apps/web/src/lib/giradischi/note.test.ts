// Le note del giradischi della pagina 404: ogni traccia della scaletta ha la
// sua, su una scala pentatonica (suonano bene in qualsiasi ordine).
import { describe, expect, it } from 'vitest';
import { CANZONE, durataCanzone, notaDellaTraccia } from './note';

describe('notaDellaTraccia', () => {
  it('sale lungo la pentatonica di do, una nota per traccia', () => {
    expect(notaDellaTraccia(0)).toBeCloseTo(261.63, 1); // do
    expect(notaDellaTraccia(1)).toBeCloseTo(293.66, 1); // re
    expect(notaDellaTraccia(4)).toBeCloseTo(440, 1); // la
  });

  it("dopo la quinta traccia ricomincia un'ottava sopra", () => {
    expect(notaDellaTraccia(5)).toBeCloseTo(notaDellaTraccia(0) * 2, 5);
  });
});

describe('CANZONE', () => {
  const pentatonica = [0, 1, 2, 3, 4, 5, 6, 7].map(notaDellaTraccia);

  it('è un loop breve: due battute di sedicesimi, qualche secondo', () => {
    expect(CANZONE.passi).toBe(32);
    expect(durataCanzone()).toBeGreaterThan(3);
    expect(durataCanzone()).toBeLessThan(8);
  });

  it('la melodia sta sulla pentatonica, così non stona mai', () => {
    for (const n of CANZONE.melodia) {
      expect(pentatonica.some((f) => Math.abs(f - n.freq) < 0.01)).toBe(true);
    }
  });

  it('ogni evento cade dentro il loop', () => {
    for (const n of [...CANZONE.melodia, ...CANZONE.basso]) {
      expect(n.passo).toBeGreaterThanOrEqual(0);
      expect(n.passo + n.lunghezza).toBeLessThanOrEqual(CANZONE.passi);
    }
    for (const p of [...CANZONE.cassa, ...CANZONE.charleston]) expect(p).toBeLessThan(CANZONE.passi);
  });
});
