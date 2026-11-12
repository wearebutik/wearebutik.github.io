// ── PostHog — lato client, due livelli (ADR-0006) ────────────────────────────
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
// La chiave si legge da `PUBLIC_POSTHOG_KEY`, l'host da `PUBLIC_POSTHOG_HOST`
// (predefinito: cloud EU). Senza chiave tutto è un no-op.
import posthog, { type PostHog } from 'posthog-js';

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

export function creaAnalytics(
  chiave: string | undefined,
  host: string,
  client: ClientPostHog = posthog,
): Analytics {
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
      consentito = false;
    },

    evento(nome, proprieta) {
      if (!avviato || !consentito) return;
      prova(() => client.capture(nome, proprieta));
    },
  };
}

const analytics = creaAnalytics(
  import.meta.env.PUBLIC_POSTHOG_KEY as string | undefined,
  (import.meta.env.PUBLIC_POSTHOG_HOST as string | undefined) ?? 'https://eu.i.posthog.com',
);

// Le funzioni che usano banner, layout e pagine (nomi invariati).
export const initPostHogCookieless = (): void => analytics.avvia();
export const optInPostHog = (): void => analytics.consenti();
export const optOutPostHog = (): void => analytics.revoca();
export const trackEvent = (event: string, properties?: Record<string, unknown>): void =>
  analytics.evento(event, properties);
