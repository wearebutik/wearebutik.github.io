// ── Turnstile, la verifica anti-spam di Cloudflare, per il modulo contatti ──
// Lo script di Cloudflare si scarica solo quando qualcuno inizia a compilare
// il modulo (`avvia`), non al caricamento della pagina. Il widget resta
// invisibile e compare solo se Cloudflare ha dubbi (`interaction-only`): allora
// chiede una spunta: `suInterazione(true)` lo dice al form, che tiene il
// pulsante disabilitato finché la spunta non c'è (o il widget non va in
// errore: allora `suInterazione(false)`), e l'attesa del token non scade. Scade invece, dopo
// ATTESA_MASSIMA, se lo script non arriva o la verifica invisibile non risponde.
// `token()` aspetta che la verifica sia pronta; dopo ogni invio `rinnova()`,
// perché un token vale una volta sola. Il Worker (apps/functions) lo controlla.

interface OpzioniTurnstile {
  sitekey: string;
  appearance: 'always' | 'execute' | 'interaction-only';
  callback: (token: string) => void;
  'expired-callback': () => void;
  'error-callback': () => void;
  'timeout-callback': () => void;
  'before-interactive-callback': () => void;
  'after-interactive-callback': () => void;
}

interface Turnstile {
  render(el: HTMLElement, opzioni: OpzioniTurnstile): string;
  reset(id: string): void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
// Oltre questo tempo, senza una spunta richiesta, l'invio si arrende.
const ATTESA_MASSIMA = 30_000;

let script: Promise<Turnstile> | undefined;

function caricaScript(): Promise<Turnstile> {
  script ??= new Promise<Turnstile>((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const s = Object.assign(document.createElement('script'), { src: SCRIPT, async: true });
    s.addEventListener('load', () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile'))));
    s.addEventListener('error', () => {
      script = undefined;
      reject(new Error('turnstile'));
    });
    document.head.append(s);
  });
  return script;
}

export interface VerificaModulo {
  /** Scarica lo script e prepara il widget. Idempotente. */
  avvia(): void;
  /** Il token della verifica, appena è pronto. */
  token(): Promise<string>;
  /** Dopo un invio: il prossimo chiede un token nuovo. */
  rinnova(): void;
}

export interface OpzioniVerifica {
  /** true quando Cloudflare chiede la spunta, false quando è data. */
  suInterazione?: (chiede: boolean) => void;
}

interface Attesa {
  resolve: (t: string) => void;
  reject: (e: Error) => void;
  timer?: ReturnType<typeof setTimeout>;
}

export function preparaTurnstile(box: HTMLElement, sitekey: string, { suInterazione }: OpzioniVerifica = {}): VerificaModulo {
  let widget: string | undefined;
  let pronto: string | undefined;
  let attese: Attesa[] = [];
  let errore: Error | undefined;
  let interattivo = false;

  const fermaScadenze = () => attese.forEach((a) => clearTimeout(a.timer));
  const fallisci = (e: Error) => {
    if (interattivo) {
      interattivo = false;
      suInterazione?.(false);
    }
    errore = e;
    chiudiAttese((a) => a.reject(e));
  };

  const chiudiAttese = (fn: (a: (typeof attese)[number]) => void) => {
    const tutte = attese;
    attese = [];
    tutte.forEach((a) => {
      clearTimeout(a.timer);
      fn(a);
    });
  };

  const avvia = () => {
    if (widget !== undefined) return;
    caricaScript()
      .then((ts) => {
        if (widget !== undefined) return;
        widget = ts.render(box, {
          sitekey,
          appearance: 'interaction-only',
          callback: (t) => {
            pronto = t;
            errore = undefined;
            chiudiAttese((a) => a.resolve(t));
          },
          'expired-callback': () => {
            pronto = undefined;
          },
          'error-callback': () => fallisci(new Error('turnstile')),
          'timeout-callback': () => fallisci(new Error('turnstile: spunta scaduta')),
          'before-interactive-callback': () => {
            interattivo = true;
            fermaScadenze();
            suInterazione?.(true);
          },
          'after-interactive-callback': () => {
            interattivo = false;
            suInterazione?.(false);
          },
        });
      })
      .catch(fallisci);
  };

  return {
    avvia,
    token() {
      if (pronto) return Promise.resolve(pronto);
      // Dopo un errore del widget si riprova da capo.
      if (errore && widget !== undefined) window.turnstile?.reset(widget);
      errore = undefined;
      avvia();
      return new Promise<string>((resolve, reject) => {
        const attesa: Attesa = { resolve, reject };
        if (!interattivo) {
          attesa.timer = setTimeout(() => {
            attese = attese.filter((a) => a !== attesa);
            reject(new Error('turnstile: tempo scaduto'));
          }, ATTESA_MASSIMA);
        }
        attese.push(attesa);
      });
    },
    rinnova() {
      pronto = undefined;
      if (widget !== undefined) window.turnstile?.reset(widget);
    },
  };
}
