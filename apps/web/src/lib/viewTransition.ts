// Nome della view transition come stile inline, al posto di `transition:name`.
// Astro, per ogni `transition:name`, scrive nella pagina un blocco di CSS di
// ~2,4 KB (la sua dissolvenza da 180 ms, ripetuta per andata, ritorno e
// browser senza view transition): 18 card × foto, titolo e sottotitolo
// facevano ~125 KB su /progetti. Con il solo nome il morph resta quello del
// browser, lo stesso che già si vede andando dalla card all'header del
// progetto (HeroBanner usa lo stile inline per la stessa ragione, ADR-0008
// #astro-island-boundary). BaseLayout trova l'elemento d'origine del morph
// anche così (selettore [style*="view-transition-name"]).
export const vtName = (name: string) => `view-transition-name: ${name}`;

/** Unisce dichiarazioni di stile inline, saltando quelle assenti. */
export const stili = (...parti: (string | undefined)[]) => parti.filter(Boolean).join('; ') || undefined;
