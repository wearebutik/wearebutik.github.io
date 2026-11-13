// Il testo di /robots.txt (pages/robots.txt.ts): tutto aperto ai crawler, con
// l'indirizzo della sitemap (@astrojs/sitemap, solo con `site`). Le pagine
// noindex non si bloccano con Disallow: il crawler deve leggerle per vedere il
// noindex. La beta lo sostituisce con un robots.txt che blocca tutto
// (deploy-beta.yml, «Intestazioni della beta»).

export function testoRobots(site: URL | undefined): string {
  const base = 'User-agent: *\nAllow: /\n';
  return site ? `${base}\nSitemap: ${new URL('sitemap-index.xml', site).href}\n` : base;
}
