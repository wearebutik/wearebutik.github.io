// ── PostHog — lato client, due livelli (ADR-0006) ────────────────────────────
// Il file non si chiama «posthog»: gli adblocker bloccano spesso i file con
// quel nome, e lo stesso script avvia il banner dei cookie, che deve comparire
// comunque.
// Stesso schema di pelion (discentis, apps/community/.../posthog-client.ts),
// costruito sulla modalità senza cookie ufficiale di posthog-js.
//
// Livello SEMPRE ATTIVO, senza cookie, legittimo interesse: pageview,
// pageleave e web vitals. `cookieless_mode: 'on_reject'` più
// `opt_out_capturing_by_default` fanno sì che «nessuna decisione ancora» valga
// come rifiuto, cioè cattura senza cookie: niente identificatore sul
// dispositivo (distinct_id `$posthog_cookieless`, l'hash lo calcola il server
// con un sale giornaliero). `on_reject` da solo lascerebbe PostHog muto prima
// del consenso. La modalità va attivata anche nelle impostazioni del progetto
// PostHog, altrimenti il server scarta gli eventi senza cookie.
//
// Livello DIETRO CONSENSO (categoria `analytics` del banner): persistenza
// durevole, autocapture, heatmap e registrazioni di sessione, accesi da
// `opt_in_capturing`, che esce dalla modalità senza cookie. Le heatmap stanno
// qui perché registrano dove e su cosa si clicca; con loro spente PostHog non
// scarica nemmeno il modulo dei dead clicks. Le registrazioni mascherano ogni
// testo e ogni campo. La revoca torna al livello senza cookie.
//
// Ogni chiamata all'SDK è protetta: dove il browser blocca lo storage (Safari,
// iframe isolati) posthog-js lancia errori sincroni, e un'analisi che fallisce
// non deve rompere la pagina.
//
// Caricamento dopo il disegno: la libreria (~100 KB) si scarica con un
// `import()` dopo il `load` della pagina, quando il browser è libero (al più
// 3 s dopo), per non competere con il primo disegno. Le chiamate fatte prima
// restano in coda e partono nello stesso ordine. Il compromesso (ADR-0006): chi
// chiude la pagina prima della fine del caricamento non viene contato; il
// pageview delle altre visite parte all'init e le web vitals già misurate si
// leggono anche dopo.
//
// La chiave si legge da `PUBLIC_POSTHOG_KEY`, l'host da `PUBLIC_POSTHOG_HOST`
// (predefinito: cloud EU). Senza chiave tutto è un no-op e non si scarica
// niente.
import type { PostHog } from 'posthog-js';

/** La parte di posthog-js che usiamo: permette di provarla con un'istanza vera. */
export type ClientPostHog = Pick<
  PostHog,
  | 'init'
  | 'set_config'
  | 'opt_in_capturing'
  | 'opt_out_capturing'
  | 'has_opted_in_capturing'
  | 'clear_opt_in_out_capturing'
  | 'capture'
  | 'reset'
  | 'startSessionRecording'
  | 'stopSessionRecording'
>;

export interface Analytics {
  /** Avvia il livello senza cookie. Idempotente; no-op senza chiave. */
  avvia(): void;
  /** Consenso alla categoria `analytics`: esce dalla modalità senza cookie. */
  consenti(): void;
  /** Consenso negato o revocato: torna al livello senza cookie. */
  revoca(): void;
  /** Evento nostro (es. `contact_form_submitted`): solo con il consenso. */
  evento(nome: string, proprieta?: Record<string, unknown>): void;
}

export function creaAnalytics(chiave: string | undefined, host: string, client: ClientPostHog): Analytics {
  let avviato = false;
  let consentito = false;

  const prova = (fn: () => unknown) => {
    try {
      fn();
    } catch {
      /* storage bloccato o SDK in errore: l'analisi tace, la pagina no */
    }
  };
  // Legge lo storage, quindi può lanciare: in quel caso «no», e non si tocca
  // niente su un dispositivo che non riusciamo a leggere.
  const sdkCrediConsenso = () => {
    try {
      return client.has_opted_in_capturing();
    } catch {
      return false;
    }
  };

  return {
    avvia() {
      if (!chiave || avviato) return;
      avviato = true;
      prova(() =>
        client.init(chiave, {
          api_host: host,
          persistence: 'memory',
          cookieless_mode: 'on_reject',
          opt_out_capturing_by_default: true,
          person_profiles: 'identified_only',
          autocapture: false,
          // 'history_change': il sito naviga con il ClientRouter di Astro
          // (pushState), e solo così ogni pagina conta come pageview.
          capture_pageview: 'history_change',
          capture_pageleave: true,
          capture_performance: { web_vitals: true },
          capture_heatmaps: false,
          capture_dead_clicks: false,
          disable_surveys: true,
          // Spente fino al consenso; il mascheramento è già in vigore quando
          // partono.
          disable_session_recording: true,
          session_recording: { maskAllInputs: true, maskTextSelector: '*' },
        }),
      );
    },

    consenti() {
      if (!avviato || consentito) return;
      prova(() =>
        client.set_config({ persistence: 'localStorage+cookie', autocapture: true, capture_heatmaps: true }),
      );
      // Senza `captureEventName: false` l'opt-in manderebbe un evento `$opt_in`
      // a ogni pagina caricata con il consenso già dato.
      prova(() => client.opt_in_capturing({ captureEventName: false }));
      prova(() => client.startSessionRecording());
      consentito = true;
    },

    revoca() {
      if (!avviato) return;
      // Solo se c'era qualcosa da revocare: un rifiuto al primo banner non
      // deve cancellare niente.
      if (!consentito && !sdkCrediConsenso()) return;
      prova(() => client.reset());
      prova(() => client.set_config({ persistence: 'memory', autocapture: false, capture_heatmaps: false }));
      prova(() => client.stopSessionRecording());
      prova(() => client.opt_out_capturing());
      // Cancella il record dell'opt-out: «nessuna decisione» torna a valere
      // come rifiuto, cioè cattura senza cookie, invece di PostHog muto.
      prova(() => client.clear_opt_in_out_capturing());
      // `reset` non tocca lo stato di finestra e di sessione che PostHog
      // tiene in sessionStorage (`ph_<chiave>_window_id` e simili): via anche
      // quello, così dopo la revoca sul dispositivo non resta niente.
      prova(() => {
        for (const k of Object.keys(sessionStorage)) if (k.startsWith(`ph_${chiave}`)) sessionStorage.removeItem(k);
      });
      consentito = false;
    },

    evento(nome, proprieta) {
      if (!avviato || !consentito) return;
      prova(() => client.capture(nome, proprieta));
    },
  };
}

/** Dopo il `load` della pagina, quando il browser è libero (al più 3 s dopo). */
export function dopoIlDisegno(fn: () => void): void {
  const libero = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 3000 });
    else setTimeout(fn, 1);
  };
  if (document.readyState === 'complete') libero();
  else window.addEventListener('load', libero, { once: true });
}

/**
 * Lo stesso `Analytics`, con il client caricato più tardi: le chiamate
 * restano in coda finché `carica` non lo consegna, poi partono nell'ordine in
 * cui sono arrivate. Senza chiave non carica niente. Se il caricamento
 * fallisce (rete, blocco di un adblocker) la coda resta ferma e il sito va
 * avanti.
 */
export function creaAnalyticsDifferito(
  chiave: string | undefined,
  host: string,
  carica: () => Promise<ClientPostHog>,
  quando: (fn: () => void) => void = dopoIlDisegno,
): Analytics {
  let pronto: Analytics | undefined;
  let partito = false;
  const coda: Array<(a: Analytics) => void> = [];

  const esegui = (chiamata: (a: Analytics) => void) => {
    if (!chiave) return;
    if (pronto) return chiamata(pronto);
    coda.push(chiamata);
    if (partito) return;
    partito = true;
    quando(() => {
      carica()
        .then((client) => {
          pronto = creaAnalytics(chiave, host, client);
          for (const c of coda.splice(0)) c(pronto);
        })
        .catch(() => {
          /* libreria non arrivata: niente analisi, il sito va avanti */
        });
    });
  };

  return {
    avvia: () => esegui((a) => a.avvia()),
    consenti: () => esegui((a) => a.consenti()),
    revoca: () => esegui((a) => a.revoca()),
    evento: (nome, proprieta) => esegui((a) => a.evento(nome, proprieta)),
  };
}

const analytics = creaAnalyticsDifferito(
  import.meta.env.PUBLIC_POSTHOG_KEY as string | undefined,
  (import.meta.env.PUBLIC_POSTHOG_HOST as string | undefined) ?? 'https://eu.i.posthog.com',
  () => import('posthog-js').then((m) => m.default),
);

// Le funzioni che usano banner, layout e pagine (nomi invariati).
export const initPostHogCookieless = (): void => analytics.avvia();
export const optInPostHog = (): void => analytics.consenti();
export const optOutPostHog = (): void => analytics.revoca();
export const trackEvent = (event: string, properties?: Record<string, unknown>): void =>
  analytics.evento(event, properties);
