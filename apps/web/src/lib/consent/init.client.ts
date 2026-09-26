// ── Avvio del cookie banner ────────────────────────────────────────────────
// Wrapper attorno a CookieConsent.run(config). Vedi ADR-0006.
// `initCookieConsent()` va chiamato dal layout (a ogni astro:page-load, perché
// le view transition rimpiazzano il DOM). `showCookiePreferences()` riapre la
// modale delle preferenze dal bottone nel footer.
//
// Il CSS del banner (~31 KB, quasi metà del CSS di ogni pagina) non sta nella
// pagina: si scarica solo quando il banner o le preferenze si devono mostrare.
// Per questo run() parte con autoShow: false — il consenso si legge e si
// applica come sempre — e il banner si apre qui, dopo gli stili.
import * as CookieConsent from 'vanilla-cookieconsent';
import cssUrl from 'vanilla-cookieconsent/dist/cookieconsent.css?url';
import { consentConfig } from './config.client';

let stili: Promise<void> | undefined;

// Il <link> resta fra una pagina e l'altra (data-astro-transition-persist):
// il ClientRouter altrimenti toglie dall'head ciò che la pagina nuova non ha.
function caricaStili(): Promise<void> {
  if (document.querySelector('link[data-cookieconsent-css]')) return stili ?? Promise.resolve();
  const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: cssUrl });
  link.dataset.cookieconsentCss = '';
  link.dataset.astroTransitionPersist = 'cookieconsent-css';
  stili = new Promise((resolve) => {
    // Anche se il file non arriva il banner si apre: senza stili, ma il
    // consenso resta chiedibile.
    link.addEventListener('load', () => resolve(), { once: true });
    link.addEventListener('error', () => resolve(), { once: true });
  });
  document.head.append(link);
  return stili;
}

// La libreria non costruisce il banner per bot e browser automatizzati
// (hideFromBots, attivo di default): stessa condizione, o show() fallisce.
const eBot = () => navigator.webdriver || /bot|crawl|spider|slurp|teoma/i.test(navigator.userAgent);

export async function initCookieConsent(): Promise<void> {
  await CookieConsent.run({ ...consentConfig, autoShow: false });
  if (CookieConsent.validConsent() || eBot()) return;
  await caricaStili();
  CookieConsent.show(true);
}

export async function showCookiePreferences(): Promise<void> {
  await caricaStili();
  CookieConsent.showPreferences();
}
