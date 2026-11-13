// /llms.txt: la presentazione di butik per gli agenti AI (PDR-0007), in
// Markdown come da llmstxt.org: titolo, citazione, sezioni di link.
import { describe, expect, it } from 'vitest';
import { testoLlms } from './llms';

const dati = {
  site: new URL('https://wearebutik.com'),
  nome: 'Butik',
  descrizione: 'Impresa sociale che attiva territori attraverso la musica.',
  dettagli: 'Dal 2018 lavoriamo con istituzioni e festival.',
  servizi: [{ title: 'Consulenza strategica', desc: 'Mappatura e co-progettazione.', ancora: 'consulenza-strategica' }],
  progetti: [{ id: 'napoli-music-city', title: 'Napoli Music City', subtitle: 'La città che suona.' }],
  pagine: [{ percorso: '/chi-siamo', titolo: 'Chi siamo — Butik', descrizione: 'Il team.' }],
  contatti: { ragioneSociale: 'Butik s.r.l. Impresa Sociale', indirizzo: 'Via Plinio 14, Milano', partitaIva: '10429130965', email: 'info@wearebutik.com' },
};

describe('testoLlms', () => {
  const t = testoLlms(dati);

  it('apre con il nome, la descrizione citabile e i dettagli', () => {
    expect(t.startsWith('# Butik\n\n> Impresa sociale che attiva territori attraverso la musica.\n\nDal 2018')).toBe(true);
  });

  it('elenca servizi, progetti e pagine con indirizzi assoluti', () => {
    expect(t).toContain('## Servizi\n\n- [Consulenza strategica](https://wearebutik.com/servizi/#consulenza-strategica): Mappatura e co-progettazione.');
    expect(t).toContain('## Progetti\n\n- [Napoli Music City](https://wearebutik.com/progetti/napoli-music-city/): La città che suona.');
    expect(t).toContain('- [Chi siamo](https://wearebutik.com/chi-siamo/): Il team.');
  });

  it('chiude con i contatti', () => {
    expect(t).toContain('## Contatti\n\n- Butik s.r.l. Impresa Sociale, P. IVA 10429130965\n- Via Plinio 14, Milano\n- info@wearebutik.com');
  });

  it('senza dettagli e senza progetti salta le parti vuote', () => {
    const corto = testoLlms({ ...dati, dettagli: undefined, progetti: [] });
    expect(corto).not.toContain('## Progetti');
    expect(corto).toContain('> Impresa sociale che attiva territori attraverso la musica.\n\n## Servizi');
  });
});
