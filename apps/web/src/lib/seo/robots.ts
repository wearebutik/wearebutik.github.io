// Il testo di /robots.txt (pages/robots.txt.ts), secondo PDR-0007:
// - motori di ricerca e assistenti che cercano e citano (ChatGPT search,
//   Claude, Perplexity, Google con le sue risposte AI) leggono tutto: è il
//   gruppo «*»;
// - i crawler che raccolgono testi per addestrare i modelli sono chiusi fuori,
//   uno per uno. Google-Extended riguarda solo l'addestramento di Gemini: la
//   ricerca Google e le sue risposte passano da Googlebot, che resta aperto.
// Le pagine noindex non si bloccano con Disallow: il crawler deve leggerle per
// vedere il noindex. La sitemap c'è solo con `site` (@astrojs/sitemap). La beta
// sostituisce questo file con uno che blocca tutto (deploy-beta.yml,
// «Intestazioni della beta»).

/** Crawler di addestramento dei modelli, chiusi fuori (PDR-0007). */
export const CRAWLER_ADDESTRAMENTO = [
  'GPTBot', // OpenAI
  'ClaudeBot', // Anthropic
  'anthropic-ai', // Anthropic, nome storico
  'Google-Extended', // Google, addestramento di Gemini
  'Applebot-Extended', // Apple
  'CCBot', // Common Crawl, base di molti dataset
  'Meta-ExternalAgent', // Meta
  'Bytespider', // ByteDance
  'cohere-training-data-crawler', // Cohere
] as const;

export function testoRobots(site: URL | undefined): string {
  const gruppi = [
    'User-agent: *\nAllow: /',
    ...CRAWLER_ADDESTRAMENTO.map((bot) => `User-agent: ${bot}\nDisallow: /`),
  ];
  const sitemap = site ? `\n\nSitemap: ${new URL('sitemap-index.xml', site).href}` : '';
  return `${gruppi.join('\n\n')}${sitemap}\n`;
}
