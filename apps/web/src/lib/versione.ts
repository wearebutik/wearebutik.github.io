// Versione dei testi di questa build (ADR-0004). La A è il sito, alla radice,
// dal dataset `production`; la B è la riscrittura in revisione, dal dataset
// `anteprima`, servita sotto /b/ (build con BUTIK_VERSIONE=b → base '/b').
// I link interni della B li prefissa l'integrazione `basePath` dopo il build:
// qui servono solo i percorsi letti da Astro.url, che contengono la base.

/** '' nella A, '/b' nella B. */
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** true nella build della versione B. */
export const VERSIONE_B = BASE !== '';

/** Percorso della pagina senza la base: '/b/contatti/' → '/contatti/', '/b/' → '/'. */
export function senzaBase(pathname: string): string {
  if (!BASE) return pathname;
  if (pathname === BASE) return '/';
  return pathname.startsWith(`${BASE}/`) ? pathname.slice(BASE.length) : pathname;
}
