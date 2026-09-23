---
status: accepted
date: 2026-08-28
tags: [design-system, motion, components, ui, storybook]
supersedes: 0005-design-system.md#motion
---

# ADR-0010: Motion lives in the component catalogue

Supersedes the **[#motion](./0005-design-system.md#motion)** section of ADR-0005,
which pinned motion to `apps/web/src/lib/motion` and
`apps/web/src/components/motion`. Both directories are now gone; the constraint
they encoded is not.

## Context

ADR-0005 was written when the site was a single Astro app: there was no
`packages/`, shared components did not exist yet, and the ten motion accents
(Equalizer, Waveform, Marquee, BeatPulse, CountUp, Vinyl, TapeReels,
FlowDivider, Underline, Mark) were `.astro` components under
`src/components/motion`, with the scratch logic in `src/lib/motion`. Naming those
two directories was the cheapest way to say the real thing: **motion logic must be
isolated, not scattered across the components that happen to use it.**

Two decisions since then moved the ground:

- [ADR-0007](./0007-monorepo-and-workspace-layout.md) split the repo into
  `apps/*` + `packages/*`, with shared code under `@butik/*`.
- [ADR-0008](./0008-component-authoring-and-storybook.md) made `@butik/ui`
  components React islands with CSS Modules + tokens, catalogued in Storybook.

Meanwhile the ten accents had exactly **one consumer**: `/lab/animazioni`, a study
page. They were a component library with no catalogue and no production use —
precisely the drift ADR-0008 set out to remove for the rest of the components.
When the team closed the prototyping comparisons, the call was to make them atoms
in Storybook, and both directories emptied out. The ADR text then described a
layout that no longer exists, which is worse than no text at all.

## Decision

- **Reusable motion accents are atoms of `@butik/ui`**, under
  `packages/ui/src/atoms/motion/`, authored exactly like every other catalogue
  component (`.tsx` + `*.module.css` + tokens, one `*.stories.tsx` each) per
  ADR-0008. They are consumed by the site as `@butik/ui/<Name>`.
- **Motion logic shared across unrelated components lives in
  `packages/ui/src/lib/`** and is exported from the package
  (`@butik/ui/vinylScratch`). This is the direct heir of `src/lib/motion`: same
  role, new address, now reachable by both the site and the workshop.
- **Motion that belongs to one component stays with that component** — in its CSS
  Module under `packages/ui`, or in the `.astro` that owns the behaviour. This was
  already the exception written into
  [`design-approach.md`](../guidances/design-approach.md#motion); it is now the
  rule for anything that is not shared.
- **`prefers-reduced-motion` is respected everywhere**, unchanged from ADR-0005.
  This is the part of `#motion` that is not superseded, only relocated.
- **Motion atoms that need the client say so.** Most are pure CSS and render to
  static HTML with no directive. The two that observe entry into the viewport
  (`Underline`, `CountUp`) need `client:visible` in Astro, or they sit at their
  initial state; their docblocks say it.

What does **not** change: motion never gets sprinkled inline across unrelated
components. The invariant survives its address.

## Alternatives considered

### Keep the accents in `apps/web/src/components/motion`

Faithful to the ADR-0005 letter, and cheapest — no port, no React. Rejected: it
keeps a second, invisible component library alongside the catalogue, with no
stories, no controls, no a11y addon and no visual regression, which is exactly
the split ADR-0008 closed for every other shared component. It also leaves the
accents unusable from Storybook, so nobody would ever see them while designing.

### Move only the shared logic, leave the components as `.astro`

A halfway house: `vinylScratch` to `packages/ui/src/lib`, the ten components in
place. Rejected: the logic is a small fraction of the value. The visual
vocabulary — variants, tones, sizes, speeds — is what the team needs to browse,
and that only exists in the catalogue.

### A dedicated `@butik/motion` package

Cleanest boundary in the abstract. Rejected as premature for ten small
presentational components that share the token layer and the authoring format
with the rest of `@butik/ui`; a third package buys separation nobody has asked
for and costs another build target.

## Consequences

### Positive

- The accents are browsable, with variants and states, next to the components
  they are meant to decorate — Storybook's a11y addon covers them too.
- One vocabulary: the ports replaced raw brand colours with semantic tokens
  (`--color-accent`, `--color-highlight`, `--color-fg`), so tone props read the
  same as in the rest of the catalogue.
- The scratch logic has a single home reachable by both consumers, instead of
  living in the app and being imported across the boundary.

### Negative / accepted risks

- Two of the ten atoms now depend on the client to do their job, and Astro's
  default is no client. A missing `client:visible` fails quietly — the component
  renders, just frozen at its initial state.
- The accents are catalogued but **still unused in production**: moving them did
  not give them a consumer. If they stay unused, the honest next decision is to
  delete them, not to keep polishing a shelf.

### When to deviate (revisit triggers)

- Motion grows beyond presentational accents — a real animation runtime, a
  timeline library, orchestration across components — → it earns its own package
  and a new ADR.
- The accents are still without a production consumer at the next design review →
  reopen and consider removing them rather than maintaining them.
