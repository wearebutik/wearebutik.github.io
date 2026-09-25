---
name: design-check
description: Audit the design/UX discipline — tokens vs raw values, the roles of the reds, text over photographs, the two small-caps roles, catalogue components repainted or duplicated by the app, AA contrast, focus, motion — and report violations with path:line. Report-only, never edits files. Use when asked to verify design-system adherence, visual/UX quality or accessibility, AND automatically as part of every code review and PR review (see CLAUDE.md).
---

# Design & UX check

Produce a **report** on how well the UI respects butik's design discipline:
[ADR-0005](../../../docs/adr/0005-design-system.md) (`#css-modules`,
`#design-tokens`), [ADR-0008](../../../docs/adr/0008-component-authoring-and-storybook.md)
(`#astro-island-boundary`), [ADR-0010](../../../docs/adr/0010-motion-in-the-catalogue.md)
and the [design-approach guidance](../../../docs/guidances/design-approach.md).
Do **not** edit files — output violations and recommended actions, ordered by
severity.

Scope: `packages/ui/**`, `packages/ui-tokens/**`, `apps/web/src/components/**`,
`apps/web/src/layouts/**`, `apps/web/src/styles/**`, `apps/web/src/pages/**`,
`apps/web/src/lib/og/**`. `apps/web/src/pages/lab/**` is experimental — flag as
`note`, not `blocker`.

## What to look at

Run `pnpm lint:design` first (`tools/design-lint`): it fails on hand-written reds,
`color:` on the brand red and the small-caps recipe outside `Eyebrow`/`MetaLabel`.
Report its output as it is, then judge what it cannot: the role behind each
`design-lint-disable` comment, red surfaces carrying text, text over photos.

Two modes:

- **PR review**: the diff **and the code that landed on the base branch while
  the PR was open** (`git diff <merge-base>..origin/main`, against the rules the
  PR introduces). A rule a PR brings in applies to the code written alongside
  it, not only to the lines it touches.
- **Full audit** (asked explicitly, or no PR): the whole scope above.

## What to check

### 1. Token discipline

- **Raw values where a token exists**: in `*.module.css`, scoped `<style>` and
  inline `style=`, flag colours (`#hex`, `rgb(`, `rgba(`, `hsl(`, names like
  `red`/`white`) and `px`/`rem` for spacing, radius or font-size that should use
  `var(--…)`. Allowed: `0`, `1px` borders, percentages, `currentColor`,
  `color-mix()` of tokens. A photographic overlay or a shadow (`rgba(0,0,0,…)`)
  is allowed when a comment says so. Group repeated values: a raw value that
  has a token is **one** violation listing its count and locations; a recurring
  raw value with no matching token goes **once** under "Missing tokens", with
  its count and two examples.
- **Fluid type**: `--text-*` in `apps/web/src/styles/global.css` are fluid
  sizes (`clamp(…)`). A hand-written `clamp()` identical to one of them, or a
  comment claiming "no token" where one exists, is a violation.
- **Undefined tokens**: `var(--x)` used but defined neither in
  `packages/ui-tokens/tokens.css` nor as an app alias in
  `apps/web/src/styles/global.css` (exclude local custom properties). App
  aliases (`--color-butik-*`) do not exist in Storybook: a story that uses one
  renders with the fallback.
- **Tailwind** (utility classes, `@apply`, `tailwind.config`) is a `blocker`:
  the migration is done.

### 2. The three reds

Per [design-approach `#accessibility`](../../../docs/guidances/design-approach.md#accessibility):

- `--color-accent-fill` for a red **surface that carries text** (buttons,
  badges, active chips, CTA hover), with `--color-fg-invert` on top.
- `--color-accent-text` for red **text** on a light background.
- `--color-accent` (brand red) only for what carries no text: glyphs, dots,
  borders, outlines, decorative strokes.

Flag text on `--color-accent` / `--color-butik-red`, red text in
`--color-accent` / `--color-butik-red`, and hand-written reds (`#e21929`,
`#cc1523`). Where custom properties cannot be read (Satori in
`lib/og/render.ts`), every hex constant matches a token, with a comment naming
it.

### 3. Text over photographs

Text on an image holds AA **whatever the photo and the layout**: the scrim or
panel sits under the text block (as in `HeroBanner.module.css`), not at a
position of a gradient that depends on where the text lands.

- **Pattern first**: what matters is the **total** opacity of everything under
  the text (veil + gradient + panel). A uniform veil holds the same everywhere,
  so compute it once. A gradient whose total drops below the level the text
  needs somewhere inside the text block is a `blocker` by itself — the text's
  position depends on content and viewport, so no estimate saves it. As a
  reference, white text at 80% needs ~0.65 of `--color-fg` over a white photo;
  full white needs less.
- **Then compute** for every text on a photo (heroes, glass panels, lists over a
  hero, carousel captions, cards, OG images in `lib/og/render.ts`): the contrast
  on the **worst photo for that text colour** (white for light text, black for
  dark text) at the weakest point of the scrim or panel under the text,
  including hover states and semi-transparent text colours.
- **Focus rings on photos**: an atom's focus outline (e.g. Button's
  `--color-accent`) over a photo or a dark veil must reach 3:1 there, not only
  on the workshop's plain background. Check atoms in the context they are used.

### 4. Small caps: two roles

Per [design-approach `#two-small-caps-roles`](../../../docs/guidances/design-approach.md#two-small-caps-roles):
the recipe (display font, `--font-size-xs`, bold, 0.1em, uppercase) is written
once, in `Eyebrow` and `MetaLabel`. Grep for `text-transform: uppercase` with
`letter-spacing: 0.1em` outside those two atoms. For each copy decide the role:
opens a section → `Eyebrow`; metadata over or next to a value → `MetaLabel`
(re-toned with `--meta-label-color`, spacing and `aria-hidden` on a wrapping
element). The roles outside both are listed in the guidance; a
`design-lint-disable small-caps` naming a role that is **not** in that list is
a `note`: either the guidance gains the role or the copy is one of the two.

### 5. Catalogue components used as they are

Per ADR-0008 `#astro-island-boundary`, `className` on an island is a hook for
local effects (a scroll state, a width), not a way to make a new variant:

- **Repainted from outside**: an `.astro` that uses `:global(.x)` on a
  `@butik/ui` component to change its colours, borders or shape → `warning`.
  Fix: the variant/tone the component already has, or a new prop with a story.
  Layout (width, margin, position) is fine, and so is a state only the context
  knows that changes the look over time — the header's CTA turning from glass
  over the hero to solid with the scroll (`--header-solid`) — per ADR-0008
  `#catalogue-usage`.
- **Duplicated**: code that reimplements what a `@butik/ui` atom does — in the
  app (a vinyl disc, an underline, an arrow link) or inside the catalogue (a
  molecule restyling its own pill instead of using `Button`) → `warning`. Same
  behaviour *and* same look: a straight rule under a whole heading is not the
  hand-drawn stroke of `Underline`. One
  implementation stays; say which by static-first (ADR-0002): the one that
  needs no hydration wins.
- **Dead variants**: a prop value or tone no call site uses — in `@butik/ui` or
  in an app `.astro` component — is a `note`; if it also fails a check, say so:
  the fix may be removing it.
- **Repeated app patterns**: the same hand-written look in three or more app
  components with no atom behind it (e.g. a rectangular dark CTA) is a `note`:
  a candidate variant or atom, not a violation.

### 6. Accessibility

- **AA contrast** (≥ 4.5:1 normal text, ≥ 3:1 large text and UI): compute from
  the real token hex values; report pairs below threshold.
- **Dimmed text**: grep `color-mix(` with a percentage on a foreground colour
  (any colour space: `in srgb`, `in oklab`; any colour: `var(--color-fg…)`,
  `currentcolor`), and `opacity:` on text — including `reset.css`, which sets
  the default placeholder. Secondary text (placeholders, captions, small print,
  muted lines) below ~65% of the foreground is where AA fails most often;
  compute each. A placeholder that is the only visible label is text.
- **Non-text contrast** (WCAG 1.4.11, 3:1): what identifies a control or its
  state — an input's border when the field and the page have about the same
  colour, a toggle's on/off, an icon-only button, the focus ring itself.
- **Visible focus**: every interactive element has a `:focus-visible` outline
  on tokens, legible on its background (white on dark panels). No visible
  indicator at all (`outline: none` without a replacement) → `blocker`; the
  browser's default ring left in place → `warning` (visible, but not the
  system's and not checked against the background).
- **Keyboard**: non-native clickable elements have keyboard handling + roles;
  prefer native elements. Labels associated with controls; correct `aria-*`.

### 7. Motion

- Every animation and transition that moves or scales (including hover zooms)
  respects `prefers-reduced-motion`.
- Reusable motion accents are atoms in `packages/ui/src/atoms/motion/`; motion
  logic shared across components lives in `packages/ui/src/lib/`; motion that
  belongs to one component lives with it (ADR-0010).
- Entrance animations use fill mode `backwards` when their final state is the
  element's base state: `both` leaves an identity transform that becomes a
  containing block. An animation that *draws* something the base state doesn't
  have (an underline growing `background-size`, a counter on `--n`) needs
  `both`. So does a **state** animation driven by scroll on a custom property
  (`--header-solid`, `--in-vista`): it is not an entrance. A `both` without a
  comment saying which case it is → `note`.
- A CSS feature that is not Baseline is gated with `@supports` and degrades to
  readable text and working controls (design-approach `#browser-support`).

## Output format

```
# Design & UX check

## Violations
- [severity] <rule>. Evidence: path:line. Fix: …

## Missing tokens
- <value> — N× (path:line, path:line). Add: <token name>.

## Contrast
| Where | Pair (text / background, worst case) | Ratio | Needs |
|---|---|---|---|
| path:line | … | x.xx:1 | 4.5 / 3 |

## Passing checks (brief)
- <rule>: holds.
```

Violations are ordered blocker → warning → note. The contrast table lists every
pair computed, passing or not, so two runs can be compared.

Severities: **blocker** (fails AA text or 1.4.11, text on a photo below
threshold, no visible focus, Tailwind), **warning** (browser-default focus,
wrong red for the role, hand-written small caps, component repainted from
outside or duplicated, raw value where a token exists, motion without a
reduced-motion path), **note** (lab/, dead variants, repeated patterns,
undocumented `both`, minor).
