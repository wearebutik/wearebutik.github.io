// ── Scratch + inerzia per dischi-vinile ────────────────────────────────────
// Logica dei dischi della sezione Metodo del sito (apps/web): vive in @butik/ui
// come libreria di motion condivisa (ADR-0010), senza componente React.
//
// Ogni "nodo" è l'area che riceve il puntatore; dentro c'è un disco che ruota.
// La rotazione è guidata da requestAnimationFrame, non dall'animazione CSS (che
// resta solo come fallback no-JS): auto-spin di regime + scratch mentre si tiene
// premuto + inerzia che, al rilascio, mantiene la velocità del lancio e rallenta
// fino a tornare al giro normale (effetto giradischi).
//
// Lo scratch parte al CLICK (pointerdown), non al passaggio del mouse: il disco
// gira indisturbato finché non lo si prende in mano, e il gesto funziona identico
// da touch. Con `prefers-reduced-motion` i dischi restano fermi.

export interface VinylScratchOptions {
  /** Selettore dei nodi (area puntatore/hover). */
  nodeSelector: string;
  /** Selettore del disco rotante interno al nodo. */
  discSelector: string;
  /** CSS custom property con la durata di un giro, letta dal nodo (es. '--vinyl-speed'). */
  speedVar: string;
  /** Secondi/giro usati se la var non è leggibile. Default 6. */
  defaultSpeed?: number;
  /**
   * Radice in cui cercare i nodi. Default `document`: il sito aggancia tutti i
   * dischi della pagina. L'atomo React passa il proprio elemento, così ogni
   * istanza aggancia solo il suo disco.
   */
  root?: ParentNode;
  /**
   * TAU — costante di tempo dell'attrito (secondi). Dopo un lancio, l'eccesso di
   * velocità rispetto al giro di regime decade esponenzialmente: in ~TAU secondi
   * si riduce di circa il 63%, in ~3·TAU il disco è praticamente tornato alla
   * velocità base. Più alto = "scivola" più a lungo; più basso = gesto più secco.
   * Default 0.8.
   */
  tau?: number;
  /**
   * MAX_VEL — tetto alla velocità del lancio (gradi/secondo). Limita quanto forte
   * può partire il disco al rilascio di uno scratch veloce, così un flick brusco
   * non lo fa girare in modo innaturale (1800°/s = 5 giri/s). Default 1800.
   */
  maxVel?: number;
  /**
   * STALE — finestra di "freschezza" del gesto (millisecondi). Il lancio tiene la
   * velocità solo se l'ultimo movimento è avvenuto entro STALE ms dal rilascio;
   * se ti fermi e poi lasci, il disco torna al giro normale senza slancio (come
   * trattenere il vinile con la mano prima di mollarlo). Default 120.
   */
  stale?: number;
}

interface Vinile {
  disc: HTMLElement;
  angle: number; // rotazione corrente (°)
  vel: number; // velocità angolare corrente (°/s)
  baseVel: number; // velocità di regime (auto-spin)
  scratching: boolean;
  lastPointerAngle: number; // ultimo angolo puntatore visto
  lastT: number; // timestamp ultimo movimento
  flingVel: number; // velocità misurata dell'ultimo gesto
}

const toDeg = (rad: number) => (rad * 180) / Math.PI;
// differenza angolare più breve fra due angoli (gestisce il wrap a ±180°)
const angleDiff = (a: number, b: number) => ((a - b + 540) % 360) - 180;
const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));

// Registro e loop unici per pagina: init può essere richiamata a ogni
// navigazione, ma il requestAnimationFrame parte una volta sola.
const vinili: Vinile[] = [];
let looping = false;

export function initVinylScratch(opts: VinylScratchOptions): void {
  const {
    nodeSelector,
    discSelector,
    speedVar,
    defaultSpeed = 6,
    root = document,
    tau = 0.8,
    maxVel = 1800,
    stale = 120,
  } = opts;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.querySelectorAll<HTMLElement>(nodeSelector).forEach((node) => {
    const disc = node.querySelector<HTMLElement>(discSelector);
    if (!disc) return;
    // Sotto le view transitions lo script gira una volta ma il DOM viene
    // sostituito: init va richiamata a ogni navigazione, e deve saltare i nodi
    // già agganciati (docs/guidances/client-scripts.md).
    if (node.dataset.vinylBound) return;
    node.dataset.vinylBound = 'true';
    const speed = parseFloat(getComputedStyle(node).getPropertyValue(speedVar)) || defaultSpeed;

    // JS prende il controllo della rotazione → spegne l'animazione CSS di fallback
    disc.style.animation = 'none';

    const v: Vinile = {
      disc,
      angle: 0,
      vel: reduce ? 0 : 360 / speed,
      baseVel: reduce ? 0 : 360 / speed,
      scratching: false,
      lastPointerAngle: 0,
      lastT: 0,
      flingVel: 0,
    };
    vinili.push(v);

    // angolo del puntatore rispetto al centro del disco
    const pointerAngle = (e: PointerEvent) => {
      const r = node.getBoundingClientRect();
      return toDeg(Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2));
    };

    const onMove = (e: PointerEvent) => {
      const pa = pointerAngle(e);
      const now = e.timeStamp;
      const delta = angleDiff(pa, v.lastPointerAngle); // quanto ha girato la mano
      v.angle += delta;
      const dt = (now - v.lastT) / 1000;
      if (dt > 0 && dt < 0.1) v.flingVel = clamp(delta / dt, maxVel);
      v.lastPointerAngle = pa;
      v.lastT = now;
      v.disc.style.transform = `rotate(${v.angle}deg)`;
    };

    const release = (e: PointerEvent) => {
      if (!v.scratching) return;
      node.removeEventListener('pointermove', onMove);
      v.scratching = false;
      // lancio: tiene la velocità del gesto solo se il movimento è recente
      const idle = e.timeStamp - v.lastT;
      v.vel = !reduce && idle < stale ? v.flingVel : v.baseVel;
    };

    // Si prende il disco premendo, non passandoci sopra.
    node.addEventListener('pointerdown', (e) => {
      v.scratching = true;
      v.lastPointerAngle = pointerAngle(e);
      v.lastT = e.timeStamp;
      v.flingVel = 0;
      // Il puntatore resta agganciato al nodo anche uscendone: si può girare il
      // disco con un gesto ampio senza che si "sganci" a metà.
      node.setPointerCapture?.(e.pointerId);
      node.addEventListener('pointermove', onMove);
    });

    node.addEventListener('pointerup', release);
    node.addEventListener('pointercancel', release);
  });

  // loop unico: fa girare i dischi e applica l'attrito che riporta la velocità
  // lanciata a quella di regime (effetto inerzia del giradischi)
  if (!reduce && vinili.length && !looping) {
    looping = true;
    let last = -1;
    const tick = (now: number) => {
      if (last < 0) last = now;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      for (const v of vinili) {
        // dischi di pagine già sostituite dalle view transitions: si scartano
        if (!v.disc.isConnected || v.scratching) continue;
        // avvicinamento esponenziale alla velocità base
        v.vel = v.baseVel + (v.vel - v.baseVel) * Math.exp(-dt / tau);
        v.angle += v.vel * dt;
        v.disc.style.transform = `rotate(${v.angle}deg)`;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
