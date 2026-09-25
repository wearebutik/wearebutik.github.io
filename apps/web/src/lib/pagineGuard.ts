// Guardia di build: l'elenco delle pagine in @butik/site-config/links (che lo
// Studio usa per segnalare i link a pagine inesistenti, e il sito per non
// mostrarli) corrisponde alle pagine vere di src/pages. Una pagina aggiunta o
// tolta senza aggiornare l'elenco farebbe sparire i link verso di lei, o
// mostrare link a un 404: il build fallisce e dice cosa manca. In dev lo
// segnala soltanto, per non fermare il server.
import type { AstroIntegration } from 'astro';
import { PAGINE_STATICHE, SEZIONI_CON_SCHEDE } from '@butik/site-config/links';

// Pagine fuori dal sito pubblico: la galleria sperimentale e le immagini OG.
const ESCLUSE = /^\/(lab|og)(\/|$)/;

export function pagineGuard(): AstroIntegration {
  let build = false;
  return {
    name: 'pagine-guard',
    hooks: {
      'astro:config:setup': ({ command }) => {
        build = command === 'build';
      },
      'astro:routes:resolved': ({ routes, logger }) => {
        const pagine = routes.filter((r) => r.origin === 'project' && r.type === 'page' && !ESCLUSE.test(r.pattern));
        const statiche = new Set(pagine.filter((r) => r.params.length === 0).map((r) => r.pattern));
        const schede = new Set(pagine.filter((r) => r.params.length > 0).map((r) => r.pattern));
        const attese = new Set<string>(PAGINE_STATICHE);
        const attesiSchede = new Set(SEZIONI_CON_SCHEDE.map((s) => `/${s}/[slug]`));

        const problemi = [
          ...[...statiche].filter((p) => !attese.has(p)).map((p) => `${p}: pagina che manca in PAGINE_STATICHE`),
          ...[...attese].filter((p) => !statiche.has(p)).map((p) => `${p}: in PAGINE_STATICHE ma la pagina non esiste`),
          ...[...schede].filter((p) => !attesiSchede.has(p)).map((p) => `${p}: sezione con schede che manca in SEZIONI_CON_SCHEDE`),
          ...[...attesiSchede].filter((p) => !schede.has(p)).map((p) => `${p}: in SEZIONI_CON_SCHEDE ma la pagina non esiste`),
        ];
        if (!problemi.length) return;
        const messaggio = `Le pagine del sito non corrispondono a packages/site-config/src/links.ts:\n  ${problemi.join('\n  ')}`;
        if (build) throw new Error(messaggio);
        logger.error(messaggio);
      },
    },
  };
}
