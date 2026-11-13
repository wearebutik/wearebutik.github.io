// Le note del giradischi della pagina 404: ogni traccia della scaletta ha la
// sua, su una scala pentatonica (suonano bene in qualsiasi ordine).
import { describe, expect, it } from 'vitest';
import { FRASE, notaDellaTraccia } from './note';

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

describe('FRASE', () => {
  it('è breve: poche note, meno di un secondo', () => {
    expect(FRASE.length).toBeLessThanOrEqual(6);
    expect(FRASE.reduce((t, n) => t + n.durata, 0)).toBeLessThan(1);
  });
});
