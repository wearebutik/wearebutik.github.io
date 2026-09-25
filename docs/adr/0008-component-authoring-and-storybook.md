---
status: accepted
date: 2026-07-10
tags: [design-system, components, react, storybook, workshop, ui]
supersedes: 0005-design-system.md#workshop
---

# ADR-0008: Component authoring and Storybook workshop

Supersedes the **[#workshop](./0005-design-system.md#workshop)** section of
ADR-0005, which left the catalogue surface open (gallery vs Storybook) and leaned
toward an Astro-native gallery.

## Context

ADR-0005 deferred the choice of the **component workshop** to a comparative pilot
run in the design-system branch. The pilot produced a concrete Astro-native
gallery under `apps/web/src/pages/lab/workshop` and a written trade-off note. Its
recommendation leaned toward the gallery, on the grounds that the shared catalogue
(`@butik/ui`) was authored in `.astro` and Storybook has no first-class `.astro`
support.

That recommendation hinged on `.astro` staying the **authoring format** for shared
components. The team has now reconsidered that premise: it wants the shared
catalogue authored in a format with a mature workshop and testing ecosystem, and
consistent with the framework the rest of the team already uses. That reframes the
question — if the components are framework islands, Storybook's lack of `.astro`
support stops being a drawback.

## Decision

- **`@butik/ui` components are authored as React islands** (`.tsx`), styled with
  CSS Modules + tokens from `@butik/ui-tokens` exactly as before (ADR-0005
  [#css-modules](./0005-design-system.md#css-modules) /
  [#design-tokens](./0005-design-system.md#design-tokens) are unchanged). React was
  chosen over Svelte/Vue/Solid for **consistency with the team's stack**.
- **The workshop surface is Storybook** (`@storybook/react-vite`), scoped to
  `packages/ui`. Stories live co-located with components
  (`src/*.stories.tsx`); `.storybook/preview` imports `@butik/ui-tokens/tokens.css`
  so specimens render with the site's visual vocabulary.
- **The site consumes the islands via `@astrojs/react`.** Presentational
  components render to **static HTML at build time** (no client directive, no
  shipped JS); a client directive is added only when a component needs
  interactivity. This keeps the static-first posture of ADR-0002 intact — no SSR
  adapter.
- **Storybook is a dev tool only.** It has its own build (`build-storybook`) and
  never participates in `pnpm --filter @butik/web build`.
- The `lab/workshop` pages are demoted to a lightweight in-site preview of the
  React Button plus a historical note of the trade-off; `story-check` now tracks
  coverage against Storybook.

### Using the catalogue {#catalogue-usage}

The catalogue is only a source of truth if the site uses it as it is, and if the
workshop shows what the site shows.

- **Every state the site reaches has a story.** A state of a `@butik/ui`
  component is reachable when a call site in `apps/web` can produce it: a prop
  value or combination (fallbacks included), a context hook the site sets
  around the island (`--accent`, `--accent-ink`, `--meta-label-color`…), empty
  or boundary data, hover and focus-visible (forced with
  `storybook-addon-pseudo-states`), a photographic background, an arrival state
  set by the site (`data-morph` on the component, `data-entrata-saltata` on an
  ancestor). A story shows its state visibly: a `className`
  specimen sits on a background where the effect shows, and a `play` function
  asserts what a picture cannot. `story-check` maps coverage from the call sites.
- **`className` is for layout and local effects, not for variants.** The hook
  exists for what only the context knows: a width, a margin, a scroll-driven
  state, a focus ring legible on the surrounding panel. Changing the colours,
  borders or shape of a component from outside creates a variant the catalogue
  does not know and no story shows. A new look becomes a prop of the component,
  with its story.
- **The app does not reimplement what an atom does.** One behaviour has one
  implementation. When two exist, the one that renders static wins
  ([ADR-0002](./0002-runtime-and-delivery.md)): either the static behaviour is
  the atom's (`Underline` draws with CSS only) or the atom goes, and the site's
  version stays (the count-up of `Numbers.astro`, the vinyl discs of the Metodo
  section).

## Alternatives considered

### Astro-native gallery (the pilot's recommendation)

Rejected as the primary workshop. It has zero drift and no second runtime, but no
first-class interactive controls/args, autodocs, or a11y / visual-regression
addons, and it required hand-written variant × state matrices. With React islands
adopted, Storybook's ecosystem outweighs the gallery's simplicity. The gallery
survives, trimmed, as an in-site smoke test.

### Keep components as `.astro`

Rejected: `.astro` has no first-class Storybook support and no framework-agnostic
component testing story. The team preferred a widely-supported island format.

### Let the app restyle catalogue components through `className`

Rejected: it is the fastest way to get a one-off look, and each one is a
variant that Storybook, Chromatic and `design-check` never see. The header's
mobile CTA was a `tone="dark"` Button repainted red from outside; it is now the
`primary` Button it imitated.

### A different island framework (Svelte / Vue / Solid)

Rejected for now: all are Storybook-supported, but React matches the team's
existing stack, minimising onboarding cost. Revisit only if the team's stack
shifts.

## Consequences

### Positive

- Interactive controls/knobs, autodocs, and an addon ecosystem (interaction tests,
  a11y, visual regression) for the catalogue.
- The component in a story **is** the component the site ships — no gallery-vs-real
  drift.
- Tokens stay the single visual source of truth, shared by site and Storybook.

### Negative / accepted risks

- A **second build/runtime** (Storybook) to maintain and update, plus a **React**
  dependency in the site and the `@butik/ui` package.
- Shared components are **no longer pure `.astro`**; contributors author `.tsx`
  islands. App-level page composition stays `.astro` (e.g. `CtaBanner` remains an
  app `.astro` component — not everything migrates to React). **Superseded for
  `CtaBanner` specifically** — see [Amendment
  2026-07-21](#amendment-2026-07-21-ctabanner-revisit-and-atomic-design-foldering)
  below; the general principle (page composition stays `.astro`) still holds.
- The island runtime is opt-in per component; forgetting that a component is an
  island (and needs a client directive for interactivity) is a new footgun.

### When to deviate (revisit triggers)

- The team's stack moves away from React → reconsider the island framework with a
  new ADR.
- Storybook's maintenance cost outweighs its value for a still-small catalogue →
  reconsider a lighter surface.

## Amendment (2026-07-21): CtaBanner revisit and atomic-design foldering

Issue #38 (cataloguing shared components in Storybook) prompted a fresh
reuse audit of `apps/web/src/components/**`. Two additions to the original
decision:

### CtaBanner qualifies as a shared island after all

The "Negative / accepted risks" example above named `CtaBanner` as page
composition that stays `.astro`. That was true at the time of writing
(single consumer). It no longer is: `CtaBanner` now has **6 real consumption
points across 6 distinct pages** (home ×2, chi-siamo, servizi/index, plus the
servizi-a/b/c comparison prototypes) with varying props (with/without a
secondary CTA). That crosses the same reuse bar already applied to `Button`.

`@butik/ui/CtaBanner` becomes a React island like any other shared component.
Its PostHog click-tracking (`#lib/analytics/posthog.client`, an app-only
subpath import — ADR-0007) cannot live inside `packages/ui` without breaking
the monorepo boundary, so `apps/web/src/components/CtaBanner.astro` stays as
a **thin wrapper**: same public Props, renders the island, keeps the tracking
`<script>`. This is consistent with the still-valid general principle above —
app-specific concerns (analytics wiring) stay at the app layer even when the
presentational component moves to `@butik/ui`.

The general example is superseded; the general principle ("app-level page
composition stays `.astro`") is not.

### `packages/ui/src` adopts atomic-design foldering

As the catalogue grows past a single pilot component, components are grouped
by composition level to keep the workshop navigable:

```
packages/ui/src/{atoms,molecules,organisms}/Component.{tsx,module.css,stories.tsx}
```

- **atoms** — smallest reusable primitives with no internal composition
  (`Button`, `Eyebrow`, `MetaLabel`, `Logo`, `SocialLinks`, `NumberBadge`,
  `ArrowCircle`, `ArrowLink`).
- **molecules** — small compositions of atoms/markup serving one purpose
  (`CtaBanner`, `SectionHeading`, the `mdx/Image*` family).
- **organisms** — larger sections composed of molecules/atoms (`HeroBanner`).

This is filesystem organisation only — it does not change the authoring
format (`.tsx` + CSS Modules + tokens), the Storybook setup (the stories glob
is already recursive), or the `client:` directive rules from the Decision
section above. `packages/ui/package.json` `exports` map one entry per
component regardless of folder, so consumer import paths
(`@butik/ui/ComponentName`) are unaffected by which subfolder a component
lives in.

### The Astro ↔ island boundary {#astro-island-boundary}

Moving presentational components into `@butik/ui` draws a line that the
original decision left implicit. Two Astro features do not cross it, and the
wrapper has to resolve them before handing data to the island. Seven files
already cite this amendment for these rules; here they are on the record.

**Images.** `astro:assets` (`<Image>`, `getImage()`) is a build-time Astro/Vite
concern: it runs in neither React nor Storybook. The `.astro` wrapper resolves
the asset with `getImage()` and passes **primitives** (`src`, `srcSet`,
`sizes`, `width`, `height`) to the island, which renders a plain `<img>`. This
keeps the island renderable in the workshop, where no Astro pipeline exists.
See `Logo`, the `mdx/Image*` family, `HeroBanner`.

**View transitions.** The `transition:name` directive is compiled by Astro and
is not available inside an island. Components that need to participate in a
view transition take the name as a prop and apply it as an inline
`view-transition-name` style instead. See `HeroBanner`.

**Scoped styles.** Astro's scoped `<style>` stamps `data-astro-cid-*` only on
the markup Astro itself compiles. A scoped selector therefore **never reaches
an island's DOM**: a rule written that way is dead CSS. When a wrapper must
style an element rendered by an island — the header does, for its overlay
state — the descendant part of the selector goes through `:global()`, with the
Astro-owned element staying as the scoped pivot.

The general rule behind all three: **anything Astro compiles stays in the
wrapper; the island receives plain data and renders plain DOM.**

### Related product decision

Connecting `Button` to production pages for the first time surfaced a visual
discrepancy (pill-shaped pilot vs. rectangular CTAs sitewide) — that is a
design/brand call, not an architecture one, and is recorded separately in
[PDR-0001](../product/decisions/0001-cta-pill-shape.md), not folded into this
amendment.
