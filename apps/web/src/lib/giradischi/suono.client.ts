// Il suono del giradischi della pagina 404, con Web Audio e senza file. Il
// contesto audio nasce solo quando chi visita toglie il muto (un clic: i
// browser non lasciano suonare prima) e `chiudi()` lo spegne lasciando la
// pagina.
//
// La mini canzone (note.ts) si «incide» una volta in un buffer e suona in
// loop come un vinile: la sua velocità segue quella del disco, quindi se il
// disco rallenta la canzone rallenta e si abbassa, se lo si lancia accelera,
// e da fermo tace. Mentre il disco è in mano si sente anche lo scratch, un
// fruscio filtrato che segue la velocità della mano.
import { CANZONE, durataCanzone, durataPasso } from './note';

// Abbastanza da sentirsi anche dalle casse di un portatile, senza spaventare.
const VOLUME = 0.25;
const VOLUME_SCRATCH = 0.35;
// Tempo con cui volume e velocità inseguono il disco (secondi): morbido ma
// abbastanza pronto da seguire la mano.
const INSEGUI = 0.03;

export interface Suono {
  /** Una nota breve, con attacco e coda morbidi. */
  nota(freq: number, durata?: number): void;
  /**
   * Segue il disco: `giri` è la velocità rispetto al giro normale (1 = 33
   * giri, 0 = fermo, negativa all'indietro); `mano` quanto veloce lo gira la
   * mano, rispetto allo stesso giro (0 se il disco non è in mano).
   */
  segui(giri: number, mano: number): void;
  /** Silenzio, senza chiudere: per il muto. */
  zitto(): void;
  chiudi(): void;
}

/** Incide la canzone in un buffer, una volta sola. */
async function incidi(sampleRate: number): Promise<AudioBuffer> {
  const durata = durataCanzone();
  const ctx = new OfflineAudioContext(1, Math.ceil(durata * sampleRate), sampleRate);
  const passo = durataPasso();
  const suona = (tipo: OscillatorType, freq: number, t: number, lunghezza: number, volume: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tipo;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + lunghezza);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + lunghezza + 0.02);
  };
  for (const e of CANZONE.melodia) suona('triangle', e.freq, e.passo * passo, e.lunghezza * passo * 0.9, 0.5);
  for (const e of CANZONE.basso) suona('sine', e.freq, e.passo * passo, e.lunghezza * passo, 0.7);
  for (const p of CANZONE.cassa) {
    const t = p * passo;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }
  const rumore = bufferRumore(ctx, 0.05);
  for (const p of CANZONE.charleston) {
    const t = p * passo;
    const src = ctx.createBufferSource();
    src.buffer = rumore;
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'highpass';
    filtro.frequency.value = 7000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    src.connect(filtro).connect(gain).connect(ctx.destination);
    src.start(t);
  }
  return ctx.startRendering();
}

function bufferRumore(ctx: BaseAudioContext, secondi: number): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.ceil(secondi * ctx.sampleRate), ctx.sampleRate);
  const dati = buf.getChannelData(0);
  for (let i = 0; i < dati.length; i++) dati[i] = Math.random() * 2 - 1;
  return buf;
}

export function creaSuono(): Suono | undefined {
  const Contesto = window.AudioContext;
  if (!Contesto) return undefined;
  const ctx = new Contesto();
  const sveglia = () => {
    // Il browser può sospendere il contesto (scheda in secondo piano, risparmio).
    if (ctx.state === 'suspended') void ctx.resume();
  };

  // La canzone: in loop da subito, a volume zero finché il disco non gira.
  const volumeCanzone = ctx.createGain();
  volumeCanzone.gain.value = 0;
  volumeCanzone.connect(ctx.destination);
  let canzone: AudioBufferSourceNode | undefined;
  void incidi(ctx.sampleRate).then((buffer) => {
    if (ctx.state === 'closed') return;
    canzone = ctx.createBufferSource();
    canzone.buffer = buffer;
    canzone.loop = true;
    canzone.playbackRate.value = 0.0001;
    canzone.connect(volumeCanzone);
    canzone.start();
  });

  // Lo scratch: rumore in loop, filtrato, a volume zero finché non si gira a mano.
  const scratch = ctx.createBufferSource();
  scratch.buffer = bufferRumore(ctx, 1);
  scratch.loop = true;
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'bandpass';
  filtro.Q.value = 1.5;
  const volumeScratch = ctx.createGain();
  volumeScratch.gain.value = 0;
  scratch.connect(filtro).connect(volumeScratch).connect(ctx.destination);
  scratch.start();

  const verso = (param: AudioParam, valore: number) => param.setTargetAtTime(valore, ctx.currentTime, INSEGUI);

  return {
    nota(freq, durata = 0.18) {
      sveglia();
      const t = ctx.currentTime;
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
    },
    segui(giri, mano) {
      sveglia();
      // Un vinile non suona al contrario in Web Audio: all'indietro si sente
      // la canzone rallentata e lo scratch.
      const velocita = Math.min(Math.abs(giri), 3);
      if (canzone) verso(canzone.playbackRate, Math.max(velocita, 0.0001));
      verso(volumeCanzone.gain, velocita > 0.05 ? VOLUME * Math.min(velocita, 1) : 0);
      const graffio = Math.min(Math.abs(mano), 2);
      verso(volumeScratch.gain, graffio * VOLUME_SCRATCH);
      verso(filtro.frequency, 400 + graffio * 1600);
    },
    zitto() {
      verso(volumeCanzone.gain, 0);
      verso(volumeScratch.gain, 0);
    },
    chiudi() {
      void ctx.close();
    },
  };
}
