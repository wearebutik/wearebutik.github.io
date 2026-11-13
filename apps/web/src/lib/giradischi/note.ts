// Le note del giradischi della pagina 404 (pages/404.astro). Scala
// pentatonica di do: cinque note che suonano bene in qualunque ordine, così
// passare da una traccia all'altra della scaletta non stona mai.

const PENTATONICA = [261.63, 293.66, 329.63, 392, 440]; // do re mi sol la

/** La nota della traccia `i` (da 0): sale lungo la scala, poi un'ottava sopra. */
export function notaDellaTraccia(i: number): number {
  const ottava = Math.floor(i / PENTATONICA.length);
  return PENTATONICA[i % PENTATONICA.length] * 2 ** ottava;
}

// La mini canzone del disco (suono.client.ts la «incide» una volta e la
// suona in loop alla velocità del disco): due battute di sedicesimi, melodia
// sulla pentatonica, basso do · la · sol · do, cassa sui quarti e charleston
// sugli ottavi. A 33 giri va a 100 bpm.
const n = notaDellaTraccia;
interface Evento {
  passo: number;
  lunghezza: number;
  freq: number;
}
const melodia = (note: number[]): Evento[] => note.map((i, k) => ({ passo: k * 2, lunghezza: 2, freq: n(i) }));

export const CANZONE = {
  bpm: 100,
  passi: 32,
  // mi sol la sol mi re do re · mi sol la do' la sol mi sol
  melodia: melodia([2, 3, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5, 4, 3, 2, 3]),
  basso: [
    { passo: 0, lunghezza: 7, freq: n(0) / 4 }, // do
    { passo: 8, lunghezza: 7, freq: n(4) / 8 }, // la
    { passo: 16, lunghezza: 7, freq: n(3) / 8 }, // sol
    { passo: 24, lunghezza: 7, freq: n(0) / 4 }, // do
  ],
  cassa: [0, 8, 16, 24],
  charleston: [2, 6, 10, 14, 18, 22, 26, 30],
};

/** Secondi di un sedicesimo e del loop intero. */
export const durataPasso = () => 60 / CANZONE.bpm / 4;
export const durataCanzone = () => CANZONE.passi * durataPasso();
