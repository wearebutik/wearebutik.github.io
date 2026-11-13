// robots.txt e dati strutturati (JSON-LD): testi e oggetti costruiti dai
// dati del sito, con indirizzi assoluti da `site`.
import { describe, expect, it } from 'vitest';
import { testoRobots } from './robots';
import { briciole, organizzazione, perScript, sitoWeb } from './datiStrutturati';

const site = new URL('https://wearebutik.com');

describe('testoRobots', () => {
  it('apre tutto e indica la sitemap con l’indirizzo assoluto', () => {
    expect(testoRobots(site)).toBe('User-agent: *\nAllow: /\n\nSitemap: https://wearebutik.com/sitemap-index.xml\n');
  });

  it('senza site non indica la sitemap, che non viene generata', () => {
    expect(testoRobots(undefined)).toBe('User-agent: *\nAllow: /\n');
  });
});

const footer = {
  ragioneSociale: 'Butik s.r.l. Impresa Sociale',
  indirizzo: 'Via Plinio 14, 20129 Milano — Italy',
  partitaIva: '10429130965',
  email: 'info@wearebutik.com',
  social: [
    { rete: 'instagram', href: 'https://www.instagram.com/wearebutik/' },
    { rete: 'linkedin', href: 'https://www.linkedin.com/company/wearebutik/' },
  ],
};

describe('organizzazione', () => {
  it('descrive butik con i dati del footer e il logo assoluto', () => {
    const o = organizzazione({ site, nome: 'Butik', footer, logo: '/_astro/logo.png' });
    expect(o).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': 'https://wearebutik.com/#organizzazione',
      name: 'Butik',
      legalName: 'Butik s.r.l. Impresa Sociale',
      url: 'https://wearebutik.com/',
      logo: 'https://wearebutik.com/_astro/logo.png',
      email: 'info@wearebutik.com',
      vatID: 'IT10429130965',
      address: 'Via Plinio 14, 20129 Milano — Italy',
      sameAs: ['https://www.instagram.com/wearebutik/', 'https://www.linkedin.com/company/wearebutik/'],
    });
  });

  it('senza profili social non scrive sameAs', () => {
    expect(organizzazione({ site, nome: 'Butik', footer: { ...footer, social: [] }, logo: '/l.png' })).not.toHaveProperty('sameAs');
  });

  it('una partita IVA già con il prefisso del paese resta com’è', () => {
    expect(organizzazione({ site, nome: 'Butik', footer: { ...footer, partitaIva: 'IT10429130965' }, logo: '/l.png' }).vatID).toBe('IT10429130965');
  });
});

describe('sitoWeb', () => {
  it('collega il sito all’organizzazione che lo pubblica', () => {
    expect(sitoWeb({ site, nome: 'Butik' })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': 'https://wearebutik.com/#sito',
      name: 'Butik',
      url: 'https://wearebutik.com/',
      inLanguage: 'it-IT',
      publisher: { '@id': 'https://wearebutik.com/#organizzazione' },
    });
  });
});

describe('briciole', () => {
  it('elenca il percorso con posizioni e indirizzi assoluti', () => {
    expect(
      briciole(site, [
        { nome: 'Butik', percorso: '/' },
        { nome: 'Portfolio', percorso: '/progetti/' },
        { nome: 'Napoli Music City', percorso: '/progetti/napoli-music-city/' },
      ]),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Butik', item: 'https://wearebutik.com/' },
        { '@type': 'ListItem', position: 2, name: 'Portfolio', item: 'https://wearebutik.com/progetti/' },
        { '@type': 'ListItem', position: 3, name: 'Napoli Music City', item: 'https://wearebutik.com/progetti/napoli-music-city/' },
      ],
    });
  });
});

describe('perScript', () => {
  it('produce JSON valido che non può chiudere il tag <script>', () => {
    const testo = perScript([{ name: 'a </script><b>' }]);
    expect(testo).not.toContain('</script>');
    expect(JSON.parse(testo)).toEqual([{ name: 'a </script><b>' }]);
  });
});
