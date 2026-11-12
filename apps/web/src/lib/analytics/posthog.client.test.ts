// @vitest-environment jsdom
// Il ciclo del consenso contro il posthog-js VERO, in jsdom (come
// pelion/apps/community/.../posthog-runtime.spec.ts): la modalità senza cookie
// è fatta di comportamenti interni dell'SDK (`is_capturing`, il record di
// opt-in, `reset`), che un finto client non vedrebbe. Il test controlla lo
// stato osservabile dopo ogni passo, non la sequenza delle chiamate. Va
// rilanciato a ogni aggiornamento di posthog-js.
import { PostHog } from 'posthog-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { creaAnalytics, creaAnalyticsDifferito, type ClientPostHog } from './posthog.client';

// La sentinella che posthog-js usa al posto del distinct_id senza cookie.
const SENTINELLA = '$posthog_cookieless';

// Una chiave nuova per test: posthog-js ricava dalla chiave i nomi dello
// storage, e due istanze sulla stessa chiave si passerebbero lo stato.
let n = 0;
const nuovaChiave = () => `phc_test_butik_${n++}`;

interface Inviato {
  event: string;
  properties: Record<string, unknown>;
}

function avvia() {
  const ph = new PostHog();
  const analytics = creaAnalytics(nuovaChiave(), 'https://eu.i.posthog.com', ph);
  analytics.avvia();
  // Intercetta ogni evento prima della rete e lo scarta.
  const inviati: Inviato[] = [];
  ph.set_config({
    before_send: (e) => {
      if (e) inviati.push({ event: e.event, properties: e.properties ?? {} });
      return null;
    },
  });
  return { ph, analytics, inviati };
}

function stato(ph: PostHog, inviati: Inviato[]) {
  const ultimo = inviati.at(-1);
  return {
    distinctId: ph.get_distinct_id(),
    senzaCookie: ultimo?.properties.$cookieless_mode === true,
    cattura: ph.is_capturing(),
    optIn: ph.has_opted_in_capturing(),
    heatmap: ph.config.capture_heatmaps,
    storage: Object.keys(localStorage).sort(),
    cookie: document.cookie,
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
});
afterEach(() => {
  localStorage.clear();
  for (const c of document.cookie.split(';')) {
    document.cookie = `${c.split('=')[0].trim()}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
});

describe('prima del consenso', () => {
  it('cattura senza cookie: sentinella, niente sul dispositivo, heatmap spente', () => {
    const { ph, inviati } = avvia();
    ph.capture('prova');
    expect(stato(ph, inviati)).toMatchObject({
      distinctId: SENTINELLA,
      senzaCookie: true,
      cattura: true,
      optIn: false,
      heatmap: false,
      storage: [],
      cookie: '',
    });
  });

  it('i nostri eventi non partono', () => {
    const { analytics, inviati } = avvia();
    analytics.evento('contact_form_submitted');
    expect(inviati.map((e) => e.event)).not.toContain('contact_form_submitted');
  });

  it('un rifiuto al primo banner non cambia niente', () => {
    const { ph, analytics, inviati } = avvia();
    analytics.revoca();
    ph.capture('prova');
    expect(stato(ph, inviati)).toMatchObject({ distinctId: SENTINELLA, senzaCookie: true, cattura: true });
  });
});

describe('con il consenso', () => {
  it('esce dalla modalità senza cookie e accende le heatmap', () => {
    const { ph, analytics, inviati } = avvia();
    analytics.consenti();
    ph.capture('prova');
    const s = stato(ph, inviati);
    expect(s.distinctId).not.toBe(SENTINELLA);
    expect(s).toMatchObject({ senzaCookie: false, cattura: true, optIn: true, heatmap: true });
  });

  it('i nostri eventi partono, senza un evento $opt_in', () => {
    const { analytics, inviati } = avvia();
    analytics.consenti();
    analytics.evento('contact_form_submitted', { pagina: '/contatti' });
    const nomi = inviati.map((e) => e.event);
    expect(nomi).toContain('contact_form_submitted');
    expect(nomi).not.toContain('$opt_in');
  });
});

describe('alla revoca', () => {
  it('torna alla modalità senza cookie, attiva, con le heatmap spente', () => {
    const { ph, analytics, inviati } = avvia();
    analytics.consenti();
    analytics.revoca();
    ph.capture('prova');
    expect(stato(ph, inviati)).toMatchObject({
      distinctId: SENTINELLA,
      senzaCookie: true,
      cattura: true,
      optIn: false,
      heatmap: false,
    });
  });

  it('i nostri eventi smettono di partire', () => {
    const { analytics, inviati } = avvia();
    analytics.consenti();
    analytics.revoca();
    analytics.evento('contact_form_submitted');
    expect(inviati.map((e) => e.event)).not.toContain('contact_form_submitted');
  });
});

describe('caricamento dopo il disegno', () => {
  // Un client finto che registra le chiamate: qui conta l'ordine della coda,
  // non il comportamento dell'SDK (quello lo provano i casi sopra).
  function finto() {
    const chiamate: string[] = [];
    const client = new Proxy({} as ClientPostHog, {
      // `then` assente: altrimenti la promessa scambierebbe il client per
      // un'altra promessa e resterebbe in attesa.
      get: (_, nome: string) => nome === 'then' ? undefined : (...args: unknown[]) => {
        chiamate.push(nome === 'capture' ? `capture:${String(args[0])}` : nome);
        return nome === 'has_opted_in_capturing' ? false : undefined;
      },
    });
    return { client, chiamate };
  }

  it('mette in coda le chiamate e le esegue nell ordine, una volta arrivato il client', async () => {
    const { client, chiamate } = finto();
    let avvia: () => void = () => {};
    const carica = vi.fn(async () => client);
    const a = creaAnalyticsDifferito('phc_x', 'https://eu.i.posthog.com', carica, (fn) => (avvia = fn));

    a.avvia();
    a.consenti();
    a.evento('contact_form_submitted');
    expect(carica).not.toHaveBeenCalled();

    avvia();
    await vi.waitFor(() => expect(chiamate).toContain('capture:contact_form_submitted'));
    expect(carica).toHaveBeenCalledTimes(1);
    expect(chiamate.indexOf('init')).toBeLessThan(chiamate.indexOf('opt_in_capturing'));
    expect(chiamate.indexOf('opt_in_capturing')).toBeLessThan(chiamate.indexOf('capture:contact_form_submitted'));
  });

  it('senza chiave non scarica niente', () => {
    const carica = vi.fn(async () => finto().client);
    const a = creaAnalyticsDifferito(undefined, 'https://eu.i.posthog.com', carica, (fn) => fn());
    a.avvia();
    a.consenti();
    expect(carica).not.toHaveBeenCalled();
  });

  it('se la libreria non arriva, le chiamate non lanciano errori', async () => {
    const carica = vi.fn(async () => {
      throw new Error('bloccata');
    });
    const a = creaAnalyticsDifferito('phc_x', 'https://eu.i.posthog.com', carica, (fn) => fn());
    expect(() => {
      a.avvia();
      a.evento('x');
    }).not.toThrow();
    await Promise.resolve();
  });
});
