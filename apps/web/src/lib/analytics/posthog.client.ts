// ── PostHog — inizializzazione lato client, due livelli (ADR-0006, update
// 2026-07-20) ─────────────────────────────────────────────────────────────
// Livello SEMPRE ATTIVO, cookieless, legittimo interesse: pageview/pageleave
// e web vitals. `persistence: 'memory'` non scrive né cookie né localStorage,
// quindi non serve consenso (ePrivacy art. 5(3) riguarda l'accesso al
// dispositivo, non la raccolta in sé). `autocapture` resta OFF a questo
// livello: cattura il testo degli elementi, cosa che il livello sempre-attivo
// non deve toccare.
//
// Livello DIETRO CONSENSO: l'upgrade della persistenza a
// `localStorage+cookie` (identificatore persistente cross-visita) parte solo
// con l'opt-in alla categoria `analytics`. La revoca riabbassa la persistenza
// a `memory` e fa `reset()` — ma pageview/web-vitals continuano, perché non
// hanno mai avuto bisogno del consenso che si sta revocando.
//
// Session recording (replay DOM/mouse via rrweb) NON fa parte del livello
// cookieless: a differenza di pageview/web-vitals può catturare testo digitato
// e comportamento utente, quindi resta dietro consenso esplicito come le altre
// identificazioni persistenti. `disable_session_recording: true` la tiene
// spenta all'init; parte/si ferma solo in optIn/optOutPostHog.
//
// La chiave si legge da `PUBLIC_POSTHOG_KEY` e l'host da `PUBLIC_POSTHOG_HOST`
// (default: cloud EU). Se la chiave manca, tutto è un no-op: il sito continua a
// funzionare e a fare build senza PostHog.
import posthog from 'posthog-js';

const KEY = import.meta.env.PUBLIC_POSTHOG_KEY as string | undefined;
const HOST =
  (import.meta.env.PUBLIC_POSTHOG_HOST as string | undefined) ?? 'https://eu.i.posthog.com';

let initialized = false;
// Distinto da `initialized`: quello diventa true già al livello cookieless
// (subito, senza consenso). `consented` traccia invece se l'utente ha
// concesso la categoria `analytics` — è il gate corretto per gli eventi
// custom (trackEvent), che sono identificazione personale, non semplice
// pageview/web-vitals.
let consented = false;

// Inizializza PostHog una sola volta, subito (se la chiave c'è) — non aspetta
// il consenso, perché il livello cookieless non ne ha bisogno. Ritorna `false`
// (e non fa nulla) se la chiave non è configurata.
function ensureInit(): boolean {
  if (initialized) return true;
  if (!KEY) return false;

  posthog.init(KEY, {
    api_host: HOST,
    // Cookieless finché non c'è opt-in: nessun cookie, nessun localStorage,
    // niente sopravvive a un reload.
    persistence: 'memory',
    // Consent-gated: cattura il testo degli elementi, resta OFF finché non
    // c'è opt-in esplicito (attivato in optInPostHog).
    autocapture: false,
    // Sempre attivi, cookieless: pageview/pageleave e web vitals.
    // 'history_change', non `true`: il sito naviga via ClientRouter di Astro
    // (soft navigation con pushState), non un caricamento di documento per
    // pagina — solo 'history_change' arma il patch di pushState/replaceState
    // di posthog-js; `true` catturerebbe solo il primo caricamento.
    capture_pageview: 'history_change',
    capture_pageleave: true,
    capture_performance: { web_vitals: true },
    // Spenta all'init: il livello cookieless non la include (vedi sopra).
    disable_session_recording: true,
    // Funzioni che il sito non usa: spente, PostHog non scarica surveys.js né
    // dead-clicks-autocapture.js (~45 KB). Opzioni di posthog-js
    // (`disable_surveys`, `capture_dead_clicks`).
    disable_surveys: true,
    capture_dead_clicks: false,
  });
  initialized = true;
  return true;
}

// Chiamata all'avvio (fuori dal flusso di consenso): garantisce il livello
// cookieless anche per chi non ha ancora risposto al banner.
export function initPostHogCookieless(): void {
  ensureInit();
}

// Consenso concesso: upgrade a persistenza durevole + autocapture + session
// recording.
export function optInPostHog(): void {
  if (!ensureInit()) return;
  posthog.set_config({ persistence: 'localStorage+cookie', autocapture: true });
  posthog.startSessionRecording();
  consented = true;
}

// Consenso negato/revocato: torna al livello cookieless. Pageview e web vitals
// NON si fermano — non hanno mai avuto bisogno del consenso che si sta
// revocando; persistenza durevole, autocapture e session recording si spengono.
export function optOutPostHog(): void {
  if (!KEY || !initialized) return;
  posthog.stopSessionRecording();
  posthog.set_config({ persistence: 'memory', autocapture: false });
  posthog.reset();
  consented = false;
}

// Punto d'ingresso unico per gli eventi custom (contact_form_submitted,
// newsletter_subscribed, ecc.). Sono identificazione personale come
// l'autocapture e la session recording, non pageview/web-vitals: gated su
// `consented`, non su `initialized` (che è già true al livello cookieless).
export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (!consented) return;
  posthog.capture(event, properties);
}
