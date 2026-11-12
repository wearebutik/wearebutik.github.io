// ── I cookie che il sito scrive, per categoria (ADR-0006) ──────────────────
// Il secondo livello dell'informativa nel banner: per ogni cookie nome,
// fornitore, durata e finalità (Linee guida del Garante sui cookie, 2021).
// Deve coincidere con quello che il sito scrive davvero: lo verifica
// tools/consent-audit, che legge i nomi dal banner. «…» vale qualunque testo
// (qui la chiave del progetto PostHog).
export interface CookieDichiarato {
  nome: string;
  fornitore: string;
  durata: string;
  finalita: string;
}

export const COOKIE_NECESSARI: CookieDichiarato[] = [
  { nome: 'cc_cookie', fornitore: 'butik (prima parte)', durata: '6 mesi', finalita: 'ricorda la tua scelta sui cookie' },
];

export const COOKIE_ANALISI: CookieDichiarato[] = [
  {
    nome: 'ph_…_posthog',
    fornitore: 'PostHog Inc. (terza parte, dati in UE)',
    durata: '1 anno',
    finalita: 'identificativo anonimo per riconoscere le visite successive',
  },
];
