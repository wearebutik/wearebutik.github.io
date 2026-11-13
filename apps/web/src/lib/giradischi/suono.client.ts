// Il suono del giradischi della pagina 404, con Web Audio e senza file. Il
// contesto audio nasce solo quando chi visita accende il suono (un clic: i
// browser non lasciano suonare prima), le note sono brevi e a volume basso, e
// `chiudi()` lo spegne lasciando la pagina.
import { FRASE } from './note';

// Abbastanza da sentirsi anche dalle casse di un portatile, senza spaventare.
const VOLUME = 0.25;

export interface Suono {
  /** Una nota breve, con attacco e coda morbidi. */
  nota(freq: number, durata?: number, ritardo?: number): void;
  /** La frase del disco che riparte. */
  frase(): void;
  chiudi(): void;
}

export function creaSuono(): Suono | undefined {
  const Contesto = window.AudioContext;
  if (!Contesto) return undefined;
  const ctx = new Contesto();

  const nota = (freq: number, durata = 0.18, ritardo = 0) => {
    // Il browser può sospendere il contesto (scheda in secondo piano, risparmio).
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime + ritardo;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(VOLUME, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + durata);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + durata + 0.02);
  };

  return {
    nota,
    frase() {
      let ritardo = 0;
      for (const n of FRASE) {
        nota(n.freq, n.durata, ritardo);
        ritardo += n.durata * 0.9;
      }
    },
    chiudi() {
      void ctx.close();
    },
  };
}
