// I disegni delle icone delle card dei servizi (home e /servizi), una per id
// di @butik/site-config/icone: lì le sceglie lo Studio, qui stanno i
// tracciati. Icone monolinea, geometriche, niente clip-art.
import type { IconaCard } from '@butik/site-config/icone';

export const ICONE_SVG: Record<IconaCard, string> = {
  stella: '<path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/>',
  bussola: '<circle cx="12" cy="12" r="9"/><path d="M9.5 14.5 11 9l4.5-1.5L14 13z"/>',
  tocco: '<path d="M12 4 2 9l10 5 10-5z"/><path d="M6 11v4c0 1.1 2.7 3 6 3s6-1.9 6-3v-4"/>',
  equalizzatore: '<path d="M4 12v1.5M8 8.5v7M12 5v14M16 9v6M20 11v2.5"/>',
  luogo: '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
};
