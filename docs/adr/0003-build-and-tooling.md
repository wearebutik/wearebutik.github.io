---
status: accepted
date: 2026-07-10
tags: [build, tooling, astro, node, pnpm, turbo, og, sharp]
---

# ADR-0003: Build and tooling

## Context

We need to fix the build stack and tools, so skills and reviews know what to take
for granted. The repo is a **monorepo** (see
[ADR-0007](./0007-monorepo-and-workspace-layout.md) for the why and the layout);
this ADR records the toolchain that drives it.

## Decision

- **Monorepo toolchain**: **pnpm workspaces** + **turbo**. `pnpm-workspace.yaml`
  globs `apps/*` and `packages/*`; `turbo.json` defines the `build`/`dev`/`preview`
  task graph (`build` depends on upstream `^build`, outputs `dist/**`). Run from
  the root: `pnpm build` → `turbo run build`.
- **Package manager**: **pnpm** (`packageManager: pnpm@10.x`, `pnpm-lock.yaml`,
  `pnpm install --frozen-lockfile` in CI). npm is no longer used.
- **Framework**: Astro 6 (static `astro build`, run twice by `@butik/web`'s
  `build` — version A in `dist/`, version B in `dist/b/`, ADR-0004 — see
  [ADR-0002](./0002-runtime-and-delivery.md)). Content in MDX via `@astrojs/mdx`.
- **Node**: ≥ 24 (`.nvmrc` = 24, `engines` at root).
- **Import aliases**: subpath imports in `apps/web/package.json` (`#components/*`,
  `#lib/*`, `#layouts/*`, `#styles/*`, `#assets/*`) for intra-app paths.
  Cross-package code uses the workspace scope `@butik/*`.
- **pnpm specifics** (recorded because they bit us on migration):
  - `sharp` is declared as an **explicit dependency of `@butik/web`** — Astro
    treats it as optional and pnpm's isolated `node_modules` won't resolve it
    otherwise.
  - Native build scripts are allow-listed in the root `pnpm.onlyBuiltDependencies`
    (`esbuild`, `sharp`, `@resvg/resvg-js`) — pnpm 10 blocks them by default.
  - The `vite` override lives in root `pnpm.overrides`.
- **Open Graph**: cards generated at **build-time** with `satori` +
  `@resvg/resvg-js` (`apps/web/src/pages/og/[...path].png.ts`). The base layout
  rasterizes the SVG logo → PNG via `getImage`, so `astro.config.mjs` sets
  `image.dangerouslyProcessSVG: true` (Astro ≥ 6.4 disables SVG rasterization by
  default; our use is limited to our own branding assets).
- **Deploy**: GitHub Actions → GitHub Pages. CI sets up pnpm, installs frozen,
  runs `pnpm build`, and uploads `apps/web/dist`. The host is replaceable
  (ADR-0002).

### Open (to be decided, not yet fixed)

- **Formatter/linter**: no Biome/ESLint/Prettier yet. Proposal: adopt **Biome**
  at the root with a `PostToolUse` hook. A later ADR/commit.
- **Type-check**: `@astrojs/check` not installed. Add it with the linter.

## Alternatives considered

### npm workspaces (no turbo)

Rejected: pnpm + turbo is the toolchain of our other repos (lunette, monowai), so
the team already knows it, and turbo gives task caching/orchestration npm scripts
don't. The small extra tooling is worth the consistency.

### Single package (no monorepo)

Rejected — see [ADR-0007](./0007-monorepo-and-workspace-layout.md): shared design
tokens, a component catalogue, and future Cloudflare functions each want their own
package/deploy boundary.

## Consequences

### Positive

- One command builds everything with caching; clear package boundaries.
- Consistent with the team's other repos.

### Negative / accepted risks

- pnpm's strict resolution needs explicit deps for optional/native packages (noted
  above) — a known footgun, documented here.
- Without a linter/type-check in CI, quality depends on review until that item
  closes.

### When to deviate (revisit triggers)

- Build times or task graph outgrow turbo's local cache → consider remote caching.
