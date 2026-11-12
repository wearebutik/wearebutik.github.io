// ── Configurazione del consenso (vanilla-cookieconsent v3) ─────────────────
// Vedi ADR-0006 (docs/adr/0006-analytics-and-consent.md).
// La libreria fa da motore senza interfaccia: salva la scelta nel cookie
// `cc_cookie`, cancella i cookie di una categoria revocata e chiama
// onConsent/onChange. L'interfaccia è il biglietto di butik
// (components/BannerCookie.astro, lib/consent/init.client.ts), che registra
// la scelta con acceptCategory(). Il banner della libreria non si apre mai
// (niente show(), traduzioni vuote), ma senza consenso la libreria ne
// costruisce comunque lo scheletro, un dialog `aria-modal`: lo si appende a un
// elemento fuori dalla pagina, che nessun lettore di schermo vede.
//
// Categorie: `necessary` (readOnly, sempre attiva) e `analytics` (PostHog, e
// GA4 se un giorno passa da GTM). Una categoria `marketing` (Google Ads) si
// aggiunge quando ci saranno campagne, insieme ai suoi cookie veri: fino ad
// allora i segnali pubblicitari di Consent Mode restano `denied` (default in
// BaseLayout). I callback collegano il consenso a Consent Mode (safeGtag) e a
// PostHog.
import type CookieConsent from 'vanilla-cookieconsent';
import { acceptedCategory } from 'vanilla-cookieconsent';
import { optInPostHog, optOutPostHog } from '#lib/analytics/misure.client';
import { safeGtag } from './gtag';

// Riflette la categoria `analytics` su Google Consent Mode v2 e su PostHog.
// Idempotente: può essere chiamata a ogni onConsent/onChange.
function applyConsent(): void {
  const analytics = acceptedCategory('analytics');

  safeGtag('consent', 'update', {
    analytics_storage: analytics ? 'granted' : 'denied',
  });

  if (analytics) optInPostHog();
  else optOutPostHog();
}

export function creaConsentConfig(): CookieConsent.CookieConsentConfig {
  return {
    revision: 1,
    autoShow: false,
    root: document.createElement('div'),

    onConsent: () => {
      applyConsent();
    },

    onChange: ({ changedCategories }) => {
      if (changedCategories.includes('analytics')) applyConsent();
    },

    categories: {
      necessary: { enabled: true, readOnly: true },
      analytics: {
        autoClear: {
          // Cookie PostHog: `ph_…_posthog` (e `_ph_*` delle versioni
          // precedenti). Lo storage del browser lo pulisce PostHog alla revoca.
          cookies: [{ name: /^_?ph_/ }],
        },
      },
    },

    language: { default: 'it', translations: { it: { consentModal: {}, preferencesModal: { sections: [] } } } },
  };
}
