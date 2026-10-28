# butik — sito

Sito di butik: Astro statico, contenuti su Sanity, pubblicato su GitHub Pages.
Monorepo pnpm + turbo (`apps/web` il sito, `apps/studio` lo Studio Sanity,
`packages/*` token e componenti). Le decisioni stanno in [`docs/adr/`](docs/adr/README.md);
le regole di lavoro in [`CLAUDE.md`](CLAUDE.md).

## Comandi

Dalla radice, con gli strumenti di `mise.toml` (`mise install`):

| Comando | Cosa fa |
| :-- | :-- |
| `pnpm install` | Installa le dipendenze |
| `pnpm --filter @butik/web dev` | Sito in locale su `localhost:4321` |
| `pnpm build` | Build del sito in `apps/web/dist/` |
| `pnpm check` | Controllo dei tipi (TypeScript 7, anche i `.astro`) di sito, anteprima e Studio |
| `pnpm --filter @butik/web build:preview` | Anteprima delle bozze nel browser, in `apps/web/dist-preview/client/` |
| `pnpm --filter @butik/studio dev` | Studio Sanity in locale |
| `pnpm --filter @butik/studio run deploy` | Pubblica lo Studio |

## Rivedere i testi prima di pubblicarli

I testi nuovi si scrivono come bozze nello Studio, nel dataset `production`.
Il sito pubblicato mostra solo i documenti pubblicati; le bozze si vedono
nella scheda *Anteprima web* dello Studio, o da sole su
https://butik.consiglio.fyi con il login a Sanity
([ADR-0004](docs/adr/0004-content-architecture.md), *Draft preview*).
Una bozza va sul sito quando la si pubblica.
