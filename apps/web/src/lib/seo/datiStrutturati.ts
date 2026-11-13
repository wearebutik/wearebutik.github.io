// Dati strutturati (JSON-LD, schema.org) che il sito dichiara ai motori di
// ricerca: chi è butik (Organization) e il sito (WebSite) in home, il
// percorso di navigazione (BreadcrumbList) nel portfolio. I dati vengono dal
// footer su Sanity (ragione sociale, indirizzo, partita IVA, email, social),
// gli indirizzi sono assoluti da `site`. Li scrive components/seo/
// DatiStrutturati.astro.

type Oggetto = Record<string, unknown>;

const CONTESTO = 'https://schema.org';
const idOrganizzazione = (site: URL) => new URL('#organizzazione', site).href;

interface DatiFooter {
  ragioneSociale: string;
  indirizzo: string;
  partitaIva: string;
  email: string;
  social: { href: string }[];
}

/** butik come Organization: nome, ragione sociale, contatti, logo e profili social. */
export function organizzazione({ site, nome, footer, logo }: { site: URL; nome: string; footer: DatiFooter; logo: string }): Oggetto {
  const sameAs = footer.social.map((s) => s.href);
  return {
    '@context': CONTESTO,
    '@type': 'Organization',
    '@id': idOrganizzazione(site),
    name: nome,
    legalName: footer.ragioneSociale,
    url: new URL('/', site).href,
    logo: new URL(logo, site).href,
    email: footer.email,
    // Partita IVA italiana nel formato europeo, con il prefisso del paese.
    vatID: /^[A-Z]{2}/.test(footer.partitaIva) ? footer.partitaIva : `IT${footer.partitaIva}`,
    // L'indirizzo è un testo unico nello Studio: schema.org accetta Text.
    address: footer.indirizzo,
    ...(sameAs.length > 0 && { sameAs }),
  };
}

/** Il sito, pubblicato da butik. */
export function sitoWeb({ site, nome }: { site: URL; nome: string }): Oggetto {
  return {
    '@context': CONTESTO,
    '@type': 'WebSite',
    '@id': new URL('#sito', site).href,
    name: nome,
    url: new URL('/', site).href,
    inLanguage: 'it-IT',
    publisher: { '@id': idOrganizzazione(site) },
  };
}

/** Il percorso dalla home alla pagina, una voce per livello. */
export function briciole(site: URL, voci: { nome: string; percorso: string }[]): Oggetto {
  return {
    '@context': CONTESTO,
    '@type': 'BreadcrumbList',
    itemListElement: voci.map((v, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: v.nome,
      item: new URL(v.percorso, site).href,
    })),
  };
}

/** JSON da mettere dentro <script>: `<` diventa <, così il testo non chiude il tag. */
export function perScript(dati: unknown): string {
  return JSON.stringify(dati).replace(/</g, '\\u003c');
}
