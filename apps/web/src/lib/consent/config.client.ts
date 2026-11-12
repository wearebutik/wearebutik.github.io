// ── Configurazione cookie banner (vanilla-cookieconsent v3) ────────────────
// Vedi ADR-0006 (docs/adr/0006-analytics-and-consent.md).
// Categorie: `necessary` (readOnly, sempre attiva) e `analytics` (PostHog, e
// GA4 se un giorno passa da GTM). Una categoria `marketing` (Google Ads) si
// aggiunge quando ci saranno campagne, insieme ai suoi cookie veri: fino ad
// allora i segnali pubblicitari di Consent Mode restano `denied` (default in
// BaseLayout). I callback onConsent/onChange collegano il consenso a Consent
// Mode (safeGtag) e a PostHog.
//
// I testi vengono da Sanity (documento "Banner dei cookie", ADR-0004): il
// layout li mette nella pagina e `creaConsentConfig` li riceve. Qui restano le
// categorie e l'elenco tecnico dei cookie (nome e durata), che deve coincidere
// con quello che il sito scrive davvero: lo verifica tools/consent-audit.
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

/** I testi del banner, da Sanity (documento "Banner dei cookie"). I campi
 * `…Html` sono testo formattato già convertito in HTML dal layout. */
export interface TestiBanner {
  titolo: string;
  testoHtml: string;
  accetta: string;
  rifiuta: string;
  preferenze: string;
  preferenzeTitolo: string;
  accettaTutti: string;
  rifiutaTutti: string;
  salva: string;
  chiudi: string;
  necessariTitolo: string;
  necessariTesto: string;
  analisiTitolo: string;
  analisiTesto: string;
  colonnaCookie: string;
  colonnaDurata: string;
  colonnaDescrizione: string;
  informazioniTitolo: string;
  informazioniTestoHtml: string;
}

// L'elenco tecnico dei cookie, per categoria: nome e durata come li scrive il
// sito (misurati con tools/consent-audit). La descrizione resta corta e
// fattuale; il racconto per chi legge sta nei testi di Sanity e nella Cookie
// Policy.
const COOKIE_NECESSARI = [
  { name: 'cc_cookie', duration: '6 mesi', description: 'Ricorda la tua scelta sui cookie.' },
];
const COOKIE_ANALISI = [
  {
    // «…» al posto della chiave del progetto: la libreria tratta il testo
    // come HTML, e un segnaposto tra parentesi angolari sparirebbe.
    name: 'ph_…_posthog',
    duration: '1 anno',
    description: 'PostHog: identificativo anonimo per riconoscere le visite successive.',
  },
];

export function creaConsentConfig(t: TestiBanner): CookieConsent.CookieConsentConfig {
  const tabella = (body: typeof COOKIE_NECESSARI) => ({
    headers: { name: t.colonnaCookie, duration: t.colonnaDurata, description: t.colonnaDescrizione },
    body,
  });

  return {
    revision: 1,

    // Il contenitore che il ClientRouter conserva fra le pagine (BaseLayout).
    root: '#cc-root',

    // Barra in basso, non un box centrale.
    guiOptions: {
      consentModal: { layout: 'bar', position: 'bottom' },
    },

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

    language: {
      default: 'it',
      translations: {
        it: {
          consentModal: {
            title: t.titolo,
            description: t.testoHtml,
            acceptAllBtn: t.accetta,
            acceptNecessaryBtn: t.rifiuta,
            showPreferencesBtn: t.preferenze,
          },
          preferencesModal: {
            title: t.preferenzeTitolo,
            acceptAllBtn: t.accettaTutti,
            acceptNecessaryBtn: t.rifiutaTutti,
            savePreferencesBtn: t.salva,
            closeIconLabel: t.chiudi,
            sections: [
              {
                title: t.necessariTitolo,
                description: t.necessariTesto,
                linkedCategory: 'necessary',
                cookieTable: tabella(COOKIE_NECESSARI),
              },
              {
                title: t.analisiTitolo,
                description: t.analisiTesto,
                linkedCategory: 'analytics',
                cookieTable: tabella(COOKIE_ANALISI),
              },
              // Ultima sezione, senza categoria: i link a Privacy & Cookie
              // Policy e Termini (la finestra delle preferenze non ha un footer).
              { title: t.informazioniTitolo, description: t.informazioniTestoHtml },
            ],
          },
        },
      },
    },
  };
}
