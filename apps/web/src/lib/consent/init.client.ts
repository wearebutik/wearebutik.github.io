// ── Avvio del consenso e biglietto dei cookie ──────────────────────────────
// Vedi ADR-0006. vanilla-cookieconsent fa da motore senza interfaccia
// (config.client.ts); qui si apre e si chiude il biglietto
// (components/BannerCookie.astro) e si registra la scelta con
// acceptCategory(), che scrive `cc_cookie`, pulisce i cookie revocati e
// chiama onConsent/onChange.
//
// `initCookieConsent()` va chiamato dal layout a ogni astro:page-load: run()
// è idempotente, e il biglietto sta in un contenitore che il ClientRouter
// conserva fra le pagine, quindi gli ascoltatori si collegano una volta sola.
// `showCookiePreferences()` riapre il biglietto con le preferenze aperte dal
// pulsante nel footer.
import * as CookieConsent from 'vanilla-cookieconsent';
import { creaConsentConfig } from './config.client';

type Modo = 'avviso' | 'preferenze';

// Ai crawler il banner non si mostra (come hideFromBots della libreria).
const eBot = () => navigator.webdriver || /bot|crawl|spider|slurp|teoma/i.test(navigator.userAgent);
const movimento = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let avvio: Promise<void> | undefined;
let collegato = false;
// Chi ha aperto le preferenze (il pulsante del footer): ci torna il focus.
let daRiprendere: HTMLElement | null = null;

const radice = () => document.getElementById('banner-cookie');
const parti = (r: HTMLElement) => ({
  biglietto: r.querySelector<HTMLElement>('.biglietto')!,
  foglio: r.querySelector<HTMLElement>('.foglio')!,
  scelte: r.querySelector<HTMLElement>('[data-scelte]')!,
  apri: r.querySelector<HTMLButtonElement>('[data-azione="preferenze"]')!,
  interruttore: r.querySelector<HTMLButtonElement>('[data-azione="interruttore"]')!,
});

function apriScelte(r: HTMLElement, aperte: boolean): void {
  const p = parti(r);
  p.scelte.hidden = !aperte;
  p.apri.setAttribute('aria-expanded', String(aperte));
  if (!aperte) return;
  const behavior = movimento() ? 'smooth' : 'auto';
  // Telefono: il foglio scorre fino in fondo. Desktop: il corpo del biglietto
  // scorre fino alle scelte (il foglio lì non scorre).
  p.foglio.scrollTo({ top: p.foglio.scrollHeight, behavior });
  p.scelte.scrollIntoView({ block: 'nearest', behavior });
  p.interruttore.focus({ preventScroll: true });
}

function mostra(r: HTMLElement, modo: Modo): void {
  const p = parti(r);
  r.dataset.modo = modo;
  p.interruttore.setAttribute('aria-checked', String(CookieConsent.acceptedCategory('analytics')));
  r.hidden = false;
  // Telefono: all'inizio spunta solo testa e matrice (titolo e pulsanti).
  const visibile = [...p.biglietto.children]
    .filter((el) => !el.classList.contains('corpo'))
    .reduce((h, el) => h + el.getBoundingClientRect().height, 0);
  r.style.setProperty('--visibile', `calc(${Math.ceil(visibile)}px + var(--space-3))`);
  p.foglio.scrollTo({ top: 0 });
  if (modo === 'preferenze') apriScelte(r, true);
  else {
    apriScelte(r, false);
    p.biglietto.focus({ preventScroll: true });
  }
}

function nascondi(r: HTMLElement): void {
  r.hidden = true;
  daRiprendere?.focus();
  daRiprendere = null;
}

function scegli(r: HTMLElement, categorie: string | string[]): void {
  CookieConsent.acceptCategory(categorie);
  nascondi(r);
}

function collega(r: HTMLElement): void {
  if (collegato) return;
  collegato = true;
  r.addEventListener('click', (e) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-azione]');
    if (!el) return;
    const p = parti(r);
    switch (el.dataset.azione) {
      case 'tutti':
        return scegli(r, 'all');
      case 'nessuno':
        return scegli(r, []);
      case 'salva':
        return scegli(r, p.interruttore.getAttribute('aria-checked') === 'true' ? ['analytics'] : []);
      case 'preferenze':
        return apriScelte(r, p.scelte.hidden !== false);
      case 'interruttore':
        return p.interruttore.setAttribute('aria-checked', String(p.interruttore.getAttribute('aria-checked') !== 'true'));
      case 'chiudi':
        return nascondi(r);
    }
  });
  // Esc chiude solo le preferenze riaperte: al primo avviso serve una scelta.
  r.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && r.dataset.modo === 'preferenze') nascondi(r);
  });
}

export function initCookieConsent(): Promise<void> {
  avvio ??= CookieConsent.run(creaConsentConfig());
  return avvio.then(() => {
    const r = radice();
    if (!r) return;
    collega(r);
    if (!r.hidden || CookieConsent.validConsent() || eBot()) return;
    mostra(r, 'avviso');
  });
}

export async function showCookiePreferences(): Promise<void> {
  await initCookieConsent();
  const r = radice();
  if (!r) return;
  daRiprendere = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  mostra(r, 'preferenze');
}
