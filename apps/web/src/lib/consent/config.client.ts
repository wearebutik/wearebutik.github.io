// ── Configurazione cookie banner (vanilla-cookieconsent v3) ────────────────
// Vedi ADR-0006 (docs/adr/0006-analytics-and-consent.md).
// Categorie: `necessary` (readOnly, sempre attiva), `analytics` (PostHog + GA) e
// `marketing` (Google Ads / remarketing). I callback onConsent/onChange
// collegano il consenso a Google Consent Mode (safeGtag) e a PostHog.
import type CookieConsent from 'vanilla-cookieconsent';
import { acceptedCategory } from 'vanilla-cookieconsent';
import { optInPostHog, optOutPostHog } from '#lib/analytics/posthog.client';
import { safeGtag } from './gtag';
import { BASE } from '#lib/versione';

// Riflette lo stato delle categorie su Google Consent Mode v2 e su PostHog.
// `analytics` guida `analytics_storage` (+ PostHog); `marketing` guida i tre
// segnali ad. Idempotente: può essere chiamata a ogni onConsent/onChange.
function applyConsent(): void {
  const analytics = acceptedCategory('analytics');
  const marketing = acceptedCategory('marketing');

  safeGtag('consent', 'update', {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: marketing ? 'granted' : 'denied',
    ad_user_data: marketing ? 'granted' : 'denied',
    ad_personalization: marketing ? 'granted' : 'denied',
  });

  if (analytics) optInPostHog();
  else optOutPostHog();
}

export const consentConfig: CookieConsent.CookieConsentConfig = {
  revision: 1,

  // Barra in basso, non un box centrale.
  guiOptions: {
    consentModal: { layout: 'bar', position: 'bottom' },
  },

  onConsent: () => {
    applyConsent();
  },

  onChange: ({ changedCategories }) => {
    if (changedCategories.includes('analytics') || changedCategories.includes('marketing')) {
      applyConsent();
    }
  },

  categories: {
    necessary: { enabled: true, readOnly: true },
    analytics: {
      autoClear: {
        // Cookie PostHog: `_ph_*` / `ph_*`.
        cookies: [{ name: /^_?ph_/ }, { name: 'ph_*' }],
      },
    },
    marketing: {
      autoClear: {
        // Cookie Google Ads / DoubleClick. PROVVISORIO: l'elenco reale dipende
        // dai tag caricati in GTM ed è riconciliato dal meccanismo di audit
        // (issue #22, ADR-0006 Update).
        cookies: [
          { name: /^_gcl/ }, // _gcl_au / _gcl_aw — conversion linker
          { name: /^_gac_/ }, // campagne Google Ads
          { name: 'IDE' }, // DoubleClick
          { name: 'test_cookie' }, // DoubleClick capability check
        ],
      },
    },
  },

  language: {
    default: 'it',
    translations: {
      it: {
        consentModal: {
          title: 'Utilizziamo i cookie',
          description:
            `Misuriamo in forma aggregata e senza cookie le pagine visitate e le prestazioni del sito. Con il tuo consenso attiviamo anche cookie di analisi e di marketing per capire meglio come viene usato il sito e misurare le campagne. Nessun cookie parte senza il tuo consenso. Dettagli nella <a href="${BASE}/privacy#cookie">Cookie Policy</a>.`,
          acceptAllBtn: 'Accetta tutti',
          acceptNecessaryBtn: 'Rifiuta',
          showPreferencesBtn: 'Gestisci preferenze',
        },
        preferencesModal: {
          title: 'Preferenze cookie',
          acceptAllBtn: 'Accetta tutti',
          acceptNecessaryBtn: 'Rifiuta tutti',
          savePreferencesBtn: 'Salva preferenze',
          closeIconLabel: 'Chiudi',
          // Link alla policy in fondo al modal preferenze. BASE: nella versione B
          // (/b/) i link restano dentro la B; l'HTML di questi testi è nel JS,
          // fuori dalla riscrittura di basePath.
          footer:
            `<a href="${BASE}/privacy">Privacy &amp; Cookie Policy</a> · <a href="${BASE}/termini">Termini di utilizzo</a>`,
          sections: [
            {
              title: 'Cookie necessari',
              description:
                'Essenziali per il funzionamento del sito. Sono sempre attivi e non possono essere disattivati.',
              linkedCategory: 'necessary',
            },
            {
              title: 'Analisi utilizzo',
              description:
                "PostHog — statistiche aggregate e anonime su come viene usato il sito, per migliorarlo.",
              linkedCategory: 'analytics',
              cookieTable: {
                headers: {
                  name: 'Cookie',
                  duration: 'Durata',
                  description: 'Descrizione',
                },
                body: [
                  {
                    name: '_ph_* / ph_*',
                    duration: '1 anno',
                    description: 'Analisi aggregata del comportamento di navigazione (PostHog).',
                  },
                ],
              },
            },
            {
              title: 'Marketing',
              description:
                'Cookie di Google Ads e remarketing per misurare le campagne e mostrare annunci pertinenti. Attivi solo con il tuo consenso.',
              linkedCategory: 'marketing',
              cookieTable: {
                headers: {
                  name: 'Cookie',
                  duration: 'Durata',
                  description: 'Descrizione',
                },
                // PROVVISORIO: riconciliato con i cookie realmente caricati dal
                // meccanismo di audit (issue #22).
                body: [
                  {
                    name: '_gcl_au',
                    duration: '90 giorni',
                    description: 'Google Ads — attribuzione delle conversioni (conversion linker).',
                  },
                  {
                    name: 'IDE / test_cookie',
                    duration: '13 mesi / sessione',
                    description: 'Google DoubleClick — misurazione e targeting degli annunci.',
                  },
                ],
              },
            },
          ],
        },
      },
    },
  },
};
