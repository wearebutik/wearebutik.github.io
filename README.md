# butik — sito

Sito di butik: Astro statico, contenuti su Sanity, pubblicato su GitHub Pages.
Monorepo pnpm + turbo (`apps/web` il sito, `apps/studio` lo Studio Sanity,
`packages/*` token e componenti). Le decisioni stanno in [`docs/adr/`](docs/adr/README.md);
le regole di lavoro in [`CLAUDE.md`](CLAUDE.md).

## Comandi

Dalla radice, con Node ≥ 24:

| Comando | Cosa fa |
| :-- | :-- |
| `pnpm install` | Installa le dipendenze |
| `pnpm --filter @butik/web dev` | Sito in locale su `localhost:4321` |
| `pnpm build` | Build del sito in `apps/web/dist/` |
| `pnpm --filter @butik/web build:anteprima` | Binario `butik-anteprima` (anteprima delle bozze) |
| `pnpm --filter @butik/studio dev` | Studio Sanity in locale |
| `pnpm --filter @butik/studio run deploy` | Pubblica lo Studio |

## Rivedere i testi prima di pubblicarli

I testi nuovi si scrivono come bozze nello Studio, nel dataset `production`.
Il sito pubblicato mostra solo i documenti pubblicati; le bozze si vedono
nell'anteprima locale `butik-anteprima`, nella scheda *Presentation* dello
Studio ([ADR-0004](docs/adr/0004-content-architecture.md),
istruzioni in [`apps/web/anteprima/README.md`](apps/web/anteprima/README.md)).
Una bozza va sul sito quando la si pubblica.
