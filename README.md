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
| `pnpm --filter @butik/web dev` | Sito in locale (versione A) su `localhost:4321` |
| `pnpm build` | Build completa: versione A in `apps/web/dist/`, versione B in `apps/web/dist/b/` |
| `pnpm --filter @butik/web build:b` | Solo la versione B (dopo una build A, che svuota `dist/`) |
| `pnpm --filter @butik/studio dev` | Studio Sanity in locale |
| `pnpm --filter @butik/studio deploy` | Pubblica lo Studio |

## Versioni dei testi: A su `/`, B su `/b/`

Il sito pubblico ha due versioni dei testi, dallo stesso codice
([ADR-0004](docs/adr/0004-content-architecture.md)):

- **A**, alla radice: il sito, dal dataset Sanity `production`.
- **B**, sotto [`/b/`](https://wearebutik.github.io/b/): una riscrittura in
  revisione, dal dataset `anteprima`. Ha una fascia in alto che la dichiara, è
  fuori dai motori di ricerca (`noindex`, canonical verso la pagina A) e tutti i
  suoi link restano dentro `/b/`.

Per rivedere, si confrontano `/pagina` e `/b/pagina`. Un testo scelto dalla B
passa nel sito copiandolo nel documento corrispondente di `production`, nello
Studio, e pubblicandolo.

**Aggiornare `/b/`.** Dopo una modifica in `anteprima`, lancia a mano il
workflow *Deploy to GitHub Pages*: `gh workflow run deploy-pages.yml`, oppure
*Run workflow* dalla scheda Actions di GitHub. Ogni deploy ricostruisce A e B,
quindi la modifica esce anche con il deploy successivo, qualunque cosa lo
faccia partire.

**Vedere la B in locale.** `pnpm build`, poi un server statico su
`apps/web/dist/` (per esempio `python3 -m http.server -d apps/web/dist`) e apri
`/b/`. `astro dev` mostra solo la A.
