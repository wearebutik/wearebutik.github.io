// Le note del giradischi della pagina 404 (pages/404.astro). Scala
// pentatonica di do: cinque note che suonano bene in qualunque ordine, così
// passare da una traccia all'altra della scaletta non stona mai.

const PENTATONICA = [261.63, 293.66, 329.63, 392, 440]; // do re mi sol la

/** La nota della traccia `i` (da 0): sale lungo la scala, poi un'ottava sopra. */
export function notaDellaTraccia(i: number): number {
  const ottava = Math.floor(i / PENTATONICA.length);
  return PENTATONICA[i % PENTATONICA.length] * 2 ** ottava;
}

/** La frase che suona quando il disco riparte: breve, meno di un secondo. */
export const FRASE: { freq: number; durata: number }[] = [
  { freq: notaDellaTraccia(0), durata: 0.12 },
  { freq: notaDellaTraccia(2), durata: 0.12 },
  { freq: notaDellaTraccia(3), durata: 0.12 },
  { freq: notaDellaTraccia(5), durata: 0.3 },
];
