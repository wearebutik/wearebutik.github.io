---
status: accepted
date: 2026-07-10
tags: [design-system, css-modules, tokens, storybook, motion]
---

# ADR-0005: Design system

Thematic: covers styling (CSS Modules + tokens), the component workshop, and
motion. The *workshop* section is superseded by
[ADR-0008](./0008-component-authoring-and-storybook.md), the *motion* section by
[ADR-0010](./0010-motion-in-the-catalogue.md) — see each section.

## Context

Today styling is **Tailwind 4** (via `@tailwindcss/vite`) plus a single
`src/styles/global.css`. The team wants to move to **CSS Modules** with a shared
**design-token** layer, for style co-located with the component and an explicit
visual vocabulary. A motion library already exists (`src/lib/motion`,
`src/components/motion`) and a de-facto gallery (the `src/pages/lab/*`,
`card-varianti`, `servizi-*` pages).

## Decision

### CSS Modules {#css-modules}

Component styling is in **CSS Modules** (`*.module.css`, natively supported by
Astro), co-located with the component. **Tailwind is removed** via a full
migration (dedicated branch, folder by folder). The only allowance during the
migration is transitional and must reach zero by the end of the sweep.

### Design tokens {#design-tokens}

Visual values (colours, spacing, radii, typography) are **tokens** as CSS custom
properties, owned by the **`@butik/ui-tokens`** package
([ADR-0007](./0007-monorepo-and-workspace-layout.md)) — a single source of truth
consumable by the site and, later, a component workshop. The site loads them once
(`import '@butik/ui-tokens/tokens.css'` in the base layout). Components **consume**
tokens; they don't redefine them and don't use raw values where a token exists.
The `design-check` skill watches this discipline (tokens vs raw values, AA
contrast, visible focus).

Shared components live in the **`@butik/ui`** package (CSS Modules + tokens), grown
from `apps/web/src/components` as they are migrated. During the Tailwind→CSS
Modules migration, `@butik/ui-tokens` coexists with the Tailwind `@theme` in
`apps/web/src/styles/global.css`; once the migration lands, the package is the only
token source.

### Motion {#motion} — superseded by ADR-0010

> **Superseded by [ADR-0010](./0010-motion-in-the-catalogue.md).** The two
> directories named below no longer exist: the motion accents are atoms of
> `@butik/ui` and the shared scratch logic lives in `packages/ui/src/lib`. The
> constraint the text encoded — motion logic isolated, not scattered across
> components — still holds, and so does `prefers-reduced-motion`; only the
> address changed. The text below is kept as written.

Animations respect `prefers-reduced-motion`. Motion logic stays isolated in
`src/lib/motion` / `src/components/motion`, not scattered across components.

### Component workshop {#workshop} — superseded by ADR-0008

> **Superseded by [ADR-0008](./0008-component-authoring-and-storybook.md).** The
> pilot ran; the team chose **Storybook** (`@storybook/react-vite`) with `@butik/ui`
> components authored as **React islands**. The text below is kept as the original
> context that framed the choice.

For the **component catalogue / review surface** there are two roads, and the
choice is deferred to a comparative pilot (`design-explore` skill) in the
design-system branch:

- **A — Astro-native gallery**: formalize `src/pages/lab/*` as a showcase (index,
  variants, states). Zero friction with `.astro`, everything stays in Astro.
- **B — Storybook**: powerful but with no first-class support for `.astro`
  (it renders framework components); would require UI as islands.

The pilot decides on real code; the outcome will be recorded as a **new ADR** (or
a thematic amendment superseding this section). Until then `lab/` stays and is not
removed.

## Alternatives considered

### Stay on Tailwind with tokens only

Rejected: the team wants co-located styling and a clean CSS Modules catalogue;
inline utilities don't give the explicit vocabulary we're after.

## Consequences

### Positive

- Co-located styling, explicit visual vocabulary (tokens), a verifiable catalogue.

### Negative / accepted risks

- The Tailwind→CSS Modules migration touches every component: it's the biggest
  piece of the maturity pass.
- The workshop stays undecided until the pilot runs.

### When to deviate (revisit triggers)

- If the pilot shows neither gallery nor Storybook holds up, consider a third
  approach (e.g. generated MDX doc pages).
