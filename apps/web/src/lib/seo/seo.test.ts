// robots.txt e dati strutturati (JSON-LD): testi e oggetti costruiti dai
// dati del sito, con indirizzi assoluti da `site`.
import { describe, expect, it } from 'vitest';
import { testoRobots } from './robots';
import { briciole, organizzazione, perScript, sitoWeb } from './datiStrutturati';

const site = new URL('https://wearebutik.com');

describe('testoRobots', () => {
  it('apre tutto ai motori e agli assistenti che cercano e citano, e indica la sitemap', () => {
    const t = testoRobots(site);
    expect(t.startsWith('User-agent: *\nAllow: /\n')).toBe(true);
    expect(t.endsWith('\nSitemap: https://wearebutik.com/sitemap-index.xml\n')).toBe(true);
    for (const bot of ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot']) {
      expect(gruppo(t, bot)).toBe(undefined); // nessun gruppo proprio: vale «*», tutto aperto
    }
  });

  it('chiude il sito ai crawler che raccolgono testi per addestrare i modelli', () => {
    const t = testoRobots(site);
    for (const bot of ['GPTBot', 'ClaudeBot', 'Google-Extended', 'CCBot', 'Applebot-Extended', 'Meta-ExternalAgent']) {
      expect(gruppo(t, bot)).toBe('Disallow: /');
    }
  });

  it('senza site non indica la sitemap, che non viene generata', () => {
    expect(testoRobots(undefined)).not.toMatch(/Sitemap:/);
  });
});

/** La regola del gruppo di un crawler nel robots.txt, se ne ha uno suo. */
function gruppo(robots: string, bot: string): string | undefined {
  const blocco = robots.split('\n\n').find((b) => b.split('\n').includes(`User-agent: ${bot}`));
  return blocco?.split('\n').find((r) => !r.startsWith('User-agent:') && !r.startsWith('#'));
}

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
