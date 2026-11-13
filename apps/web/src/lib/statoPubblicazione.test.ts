// Lo stato «Pubblicata» di un documento Sanity come lo legge il build, anche
// dai documenti scritti prima del campo `pubblicata` (draft, nascosta,
// paginaRaggiungibile), finché lo script di migrazione non li ha convertiti.
import { describe, expect, it } from 'vitest';
import { ricavaPubblicata } from './statoPubblicazione';

describe('ricavaPubblicata', () => {
  it('il campo pubblicata, se c\'è, decide sempre', () => {
    expect(ricavaPubblicata('progetto', { pubblicata: false, draft: false })).toBe(false);
    expect(ricavaPubblicata('servizio', { pubblicata: true, paginaRaggiungibile: false })).toBe(true);
    expect(ricavaPubblicata('pagina', { pubblicata: false, nascosta: false })).toBe(false);
  });

  it('progetto senza il campo: pubblicato se non è in bozza', () => {
    expect(ricavaPubblicata('progetto', {})).toBe(true);
    expect(ricavaPubblicata('progetto', { draft: true })).toBe(false);
  });

  it('servizio senza il campo: la scheda è pubblicata solo se era raggiungibile', () => {
    expect(ricavaPubblicata('servizio', {})).toBe(false);
    expect(ricavaPubblicata('servizio', { paginaRaggiungibile: true })).toBe(true);
    expect(ricavaPubblicata('servizio', { paginaRaggiungibile: true, draft: true })).toBe(false);
  });

  it('pagina senza il campo: pubblicata se non era nascosta', () => {
    expect(ricavaPubblicata('pagina', {})).toBe(true);
    expect(ricavaPubblicata('pagina', { nascosta: true })).toBe(false);
  });
});
