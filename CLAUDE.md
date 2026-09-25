# CLAUDE.md — butik

Operational guide for working in this repo. Decisions live in `docs/`; this file
is the index and the review contract.

## What this is

butik's website — **Astro 6**, built **static** (`astro build`) and host-agnostic,
deployed today to GitHub Pages. Content lives in **Sanity** (read at build time
into Astro content collections; Studio in `apps/studio`). Node ≥ 24.

It's a **pnpm + turbo monorepo** (ADR-0007):

```
apps/web/            # the Astro site (@butik/web)
apps/studio/         # Sanity Studio (@butik/studio) — schemas, editing UI
apps/functions/      # Cloudflare/serverless functions (@butik/functions) — added on demand
packages/ui-tokens/  # @butik/ui-tokens — design tokens (CSS custom properties)
packages/ui/         # @butik/ui — shared component catalogue (CSS Modules + tokens)
docs/ .claude/ reference/ design/   # repo-wide, at root
```

Build from root: `pnpm build` (turbo). Site-only: `pnpm --filter @butik/web build`.
Studio: `pnpm --filter @butik/studio dev` (local), `… deploy` (butik.sanity.studio).

## Where decisions live

- **`docs/adr/`** — architectural decisions (few, thematic, MADR, edited in place
  when a decision changes; git history is the record).
  Start at [`docs/adr/README.md`](docs/adr/README.md).
- **`docs/guidances/`** — recommendations, not enforced (per-feature choices like
  which serverless runtime; design vocabulary).
- **`docs/product/`** — product/design decisions (PDR, granular).
- **`reference/`** — raw input in quarantine (read-only history).

Read the ADRs before making an architectural change. Cite them by file + anchor
(e.g. `docs/adr/0005-design-system.md#css-modules`).

## Architecture rules (distilled from the ADRs)

- **Static-first, host-agnostic** (ADR-0002): no SSR adapter in
  `astro.config.mjs`. Dynamic logic = isolated client→serverless call, chosen
  per-feature (see `docs/guidances/functions.md`), never global SSR.
- **Content-driven, Sanity as CMS** (ADR-0004): editorial copy is not hardcoded in
  `.astro` pages. Sanity is read only at build time by content-layer loaders
  (`apps/web/src/lib/sanity.ts`); the Studio lives in `apps/studio`. Keep each
  Sanity schema aligned with its Zod schema in `apps/web/src/content.config.ts`.
  **No image is ever served from `cdn.sanity.io`**: Sanity images go through
  Astro's image pipeline and ship from `/_astro/` (the build fails otherwise —
  `apps/web/src/lib/sanityCdnGuard.ts`). All collections
  (`progetti`, `servizi`, `pagine`) are on Sanity; a field the site requires
  is `required` in the Studio too.
- **CSS Modules + tokens** (ADR-0005): style in `*.module.css` co-located with the
  component, values from tokens in `@butik/ui-tokens`. Shared components go in
  `@butik/ui`. **Tailwind is gone** — app-level styling is Astro scoped
  `<style>` on tokens. `reset.css` and `prose.css` are the plugin's own output,
  frozen: don't hand-edit them, and don't reintroduce a utility framework.
  Verify styling changes with `tools/visual-diff` (see its README).
  `apps/web/src/pages/lab/**` stays (experimental gallery).
- **Component model = React islands + Storybook** (ADR-0008, supersedes ADR-0005
  #workshop): `@butik/ui` components are authored as **React islands** (`.tsx`,
  CSS Modules + tokens), consumed by the site via `@astrojs/react` — presentational
  ones render to static HTML at build time (no client directive unless interactive),
  so static-first (ADR-0002) holds. The **workshop is Storybook**
  (`@storybook/react-vite`, scoped to `packages/ui`); it's a dev tool and never runs
  in the site build. App-level page composition stays `.astro` (e.g. `CtaBanner`).
  Use a catalogue component as it is: `className` is for layout and local
  effects, never to repaint it into a variant the catalogue doesn't know, and
  app code doesn't reimplement what an atom does. Every state the site reaches
  (props, context hooks like `--accent`, empty data, hover/focus, photo
  backgrounds) has a story.
- **Design roles** (`docs/guidances/design-approach.md`): red text is
  `--color-accent-text`, a red surface with text is `--color-accent-fill`,
  `--color-accent` only for what carries no text. Text over a photo holds AA on
  a white photo, on a scrim anchored to the text. The small-caps label is
  `Eyebrow` (opens a section) or `MetaLabel` (metadata), never hand-written.
- **Client scripts run under view transitions**: `BaseLayout` renders
  `<ClientRouter />`, so a component `<script>` executes once per session while
  the DOM is swapped on every navigation. Wire behaviour up in an idempotent
  `init()` on `astro:page-load`, or drop the script for CSS/native HTML — see
  `docs/guidances/client-scripts.md`.
- **No tracking before consent** (ADR-0006): analytics gated by
  `vanilla-cookieconsent`; PostHog opt-out-by-default; Google Consent Mode wired.
- **Monorepo** (ADR-0007): `apps/*` + `packages/*`, pnpm + turbo. Cross-package
  imports use `@butik/*`; intra-app paths use subpath imports (`#components/*`,
  `#lib/*`, `#layouts/*`, `#styles/*`, `#assets/*`), not deep relative paths.
  Functions we own go in `apps/functions`, not the site build (ADR-0002).

## Reviews (skills to run)

On every code review / PR review, run the report-only skills that apply to the
change and lead with blockers. Check the diff **and the code that landed on
`main` while the PR was open**: a rule the PR introduces applies to that code
too, and fixing it belongs in the same PR.

| Skill | Checks |
|---|---|
| `adr-check` | code vs `docs/adr/` (+ guidances); unrecorded decisions |
| `design-check` | tokens, roles of the reds, text over photos, small caps, repainted/duplicated components, AA, focus, motion |
| `content-check` | Zod ↔ Sanity schema drift; hardcoded copy |
| `consent-check` | tracking gated by consent; opt-out-by-default; Consent Mode |
| `story-check` | every state the site reaches of a `@butik/ui` component has a story |

Write skills (ask before writing): `product-decision` (scaffold a PDR),
`design-explore` (throwaway `lab/` prototypes, incl. the ADR-0005 workshop pilot).

Read-only review personas in `.claude/agents/`: `architect` (Ada), `design-system`
(Dana), `content` (Cora), `qa` (Quinn).

## Conventions

- **Language**: everything in `docs/**` and the operational files
  (`CLAUDE.md`, `.claude/**`) is in **English**. Only `reference/**` stays in
  **Italian** — it's raw editorial input (the site copy is Italian by nature).
  Commit messages follow the repo's existing Italian convention
  (`feat(scope): …`), no `Co-Authored-By` trailers.
- **Verify before claiming**: run the build (`pnpm build`) before saying a
  change is safe; never call a check "passing" without running it.
- **Open items** (ADR-0003): linter/formatter (Biome) and `@astrojs/check` are not
  yet installed — a follow-up.
