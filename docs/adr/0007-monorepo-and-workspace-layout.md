---
status: accepted
date: 2026-07-10
tags: [monorepo, workspace, packages, apps, structure]
---

# ADR-0007: Monorepo and workspace layout

## Context

butik started as a single Astro package. But the near-term roadmap has three
concerns that each want their own boundary:

- **Design tokens** shared between the site and (later) a component workshop /
  Storybook — a single source of truth consumed in more than one place.
- A **shared component catalogue** (CSS Modules + tokens, ADR-0005) separate from
  the site's page-level code.
- **Cloudflare functions** (and other per-feature serverless, ADR-0002) with a
  deploy lifecycle separate from the static site.

Keeping all of this in one package means tangled dependencies and one deploy
surface for things that ship differently. A workspace gives each concern a clean
boundary while sharing one lockfile and toolchain.

## Decision

butik is a **pnpm + turbo monorepo** (toolchain in
[ADR-0003](./0003-build-and-tooling.md)) with this layout:

```
apps/
  web/          # the Astro site (@butik/web) — src, public, .env, wrangler, astro.config
  studio/       # Sanity Studio (@butik/studio) — schemas and editing UI (ADR-0004)
  functions/    # Cloudflare Workers / Pages Functions (@butik/functions) — added when the first one lands
packages/
  ui-tokens/    # @butik/ui-tokens — design tokens as CSS custom properties
  ui/           # @butik/ui — shared component catalogue (React islands + CSS Modules + tokens, ADR-0008; Storybook workshop)
  site-config/  # @butik/site-config — plain TS rules shared by site and Studio (pages that exist, placeholder links, social networks)
docs/  .claude/  reference/  design/   # repo-wide, stay at root
```

- **Scopes**: workspace packages are `@butik/*`. Cross-package consumption uses
  the scope (`import '@butik/ui-tokens/tokens.css'`, `import Button from
  '@butik/ui/Button'`); intra-app paths use the `#*` subpath imports. Since
  [ADR-0008](./0008-component-authoring-and-storybook.md) `packages/ui` components
  are **React islands** (`.tsx`), consumed by the site via `@astrojs/react` and
  authored in a **Storybook** workshop.
- **Rules both apps enforce live in a package**: when the Studio warns about
  something and the site acts on the same rule (a link to a page that does not
  exist, a social network the footer cannot show), the rule is written once in
  `@butik/site-config` — plain TypeScript, no framework — and both import it. The
  site's build checks the page list against `src/pages`
  (`apps/web/src/lib/pagineGuard.ts`). An app never imports from another app.
- **What's at root, not in a package**: `docs/`, `.claude/`, `reference/`,
  `design/` are repo-wide (decisions, agent config, raw input, brand assets) and
  don't belong to any single app/package.
- **Grow on demand, no empty boxes**: `apps/functions` is created when the first
  serverless function is actually needed (its options live in
  [`functions.md`](../guidances/functions.md)); `packages/ui` starts with a single
  pilot component and grows as components are migrated to CSS Modules.

## Alternatives considered

### Stay a single package

Rejected: tokens, catalogue, and functions would share one dependency tree and one
deploy. The boundaries we want (a token package consumed by site + workshop; a
functions app deployed to Cloudflare independently of the static site) are exactly
what a workspace expresses cleanly.

### Split into separate repos (polyrepo)

Rejected: the packages are tightly co-evolved with the site and versioned
together; separate repos would add cross-repo release friction for no gain at this
size.

## Consequences

### Positive

- Clean boundaries: tokens/catalogue/functions each isolated and independently
  consumable or deployable.
- One lockfile, one toolchain, atomic cross-package changes in a single PR.

### Negative / accepted risks

- More structure than a single package needs today (mitigated by "grow on
  demand").

### When to deviate (revisit triggers)

- A package needs an independent release cadence / external consumers → consider
  publishing it (or extracting to its own repo) with a new ADR.
