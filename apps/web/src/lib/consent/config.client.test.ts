// @vitest-environment jsdom
// vanilla-cookieconsent come motore senza interfaccia (ADR-0006, PDR-0006): il
// biglietto registra la scelta con acceptCategory(), e la libreria deve
// scrivere `cc_cookie`, chiamare i callback verso PostHog e non costruire
// niente del suo HTML. Va rilanciato a ogni aggiornamento della libreria.
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const misure = vi.hoisted(() => ({ optInPostHog: vi.fn(), optOutPostHog: vi.fn() }));
vi.mock('#lib/analytics/misure.client', () => misure);

import * as CookieConsent from 'vanilla-cookieconsent';
import { creaConsentConfig } from './config.client';

beforeAll(async () => {
  await CookieConsent.run(creaConsentConfig());
});
beforeEach(() => {
  misure.optInPostHog.mockClear();
  misure.optOutPostHog.mockClear();
});

describe('senza interfaccia', () => {
  it('prima della scelta: nessun consenso, nessun cookie, nessun HTML della libreria', () => {
    expect(CookieConsent.validConsent()).toBe(false);
    expect(document.cookie).toBe('');
    expect(document.getElementById('cc-main')).toBeNull();
  });

  it('«Accetta tutti» scrive cc_cookie e accende PostHog', () => {
    CookieConsent.acceptCategory('all');
    expect(CookieConsent.validConsent()).toBe(true);
    expect(CookieConsent.acceptedCategory('analytics')).toBe(true);
    expect(document.cookie).toMatch(/cc_cookie=/);
    expect(misure.optInPostHog).toHaveBeenCalled();
  });

  it('la revoca dalle preferenze spegne PostHog', () => {
    CookieConsent.acceptCategory([]);
    expect(CookieConsent.acceptedCategory('analytics')).toBe(false);
    expect(CookieConsent.acceptedCategory('necessary')).toBe(true);
    expect(misure.optOutPostHog).toHaveBeenCalled();
  });

  it('«Salva le scelte» con l\'analisi accesa la riaccende', () => {
    CookieConsent.acceptCategory(['analytics']);
    expect(CookieConsent.acceptedCategory('analytics')).toBe(true);
    expect(misure.optInPostHog).toHaveBeenCalled();
    expect(document.getElementById('cc-main')).toBeNull();
  });
});
