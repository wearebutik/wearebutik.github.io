# PDR-0001: CTA a forma di pillola sito-wide

- Status: accepted (type and hover: [PDR-0005](./0005-cta-one-button.md))
- Date: 2026-07-21
- Reviewers: Gabriele Consiglio

## Context

Durante la migrazione issue #38 (catalogazione componenti in Storybook,
atomic design in packages/ui/), `@butik/ui/Button` è stato collegato per la
prima volta a pagine di produzione. Il componente esisteva già da mesi come
pilota (ADR-0008) ma era consumato solo da `/lab` — mai da una pagina reale.

Button ha `border-radius` pieno (forma a pillola). Tutte le CTA reali del
sito (Header, Hero home, ServiceHero A/B/C, CtaProgetti, CtaBanner) erano
invece rettangolari, senza arrotondamento — nessuna aveva mai usato Button
prima d'ora. Collegare Button così com'è cambia la forma di ogni CTA del
sito; la discrepanza non era mai stata visibile finché Button restava
isolato in `/lab`.

## Decision

Adottare la pillola (border-radius pieno) come forma standard di tutte le
CTA del sito. `@butik/ui/Button` non viene reso rettangolare per adattarsi
allo stato esistente — è lo stato esistente ad allinearsi al pilota.
Aggiornato anche `packages/ui/src/molecules/CtaBanner.module.css` (`.cta`)
allo stesso border-radius per coerenza tra i due componenti CTA condivisi.

## Rationale

- Rendere Button rettangolare (allinearlo alle CTA esistenti): scartata —
  avrebbe richiesto ridisegnare il pilota già validato per un secondo
  scenario mai testato in Storybook.
- Lasciare Button a pillola solo nei componenti nuovi, CTA esistenti
  rettangolari: scartata — due linguaggi visivi per lo stesso ruolo (CTA)
  sullo stesso sito, incoerenza non valutata come accettabile.

## Consequences

- \+ Un solo linguaggio visivo per le CTA, riflesso nel catalogo Storybook.
- \+ Nessun secondo componente/variante da mantenere per la forma rettangolare.
- − Cambio visivo percepibile su Header, Hero home, ServiceHero A/B/C,
  CtaProgetti, CtaBanner — tutte le pagine che le usano.
