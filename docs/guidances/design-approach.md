> **Recommended, not enforced.** The design vocabulary a linter can't fully
> verify. Applies within the boundaries decided in
> [ADR-0005](../adr/0005-design-system.md). `pnpm lint:design`
> (`tools/design-lint`, in CI) fails on the mechanical part: reds by role and the
> small-caps recipe. The `design-check` skill covers the rest in review.

# Design approach

## Tokens as source of truth

- Colours, spacing, radii, typography are **tokens** (CSS custom properties in
  `src/styles/`). Components **consume** them; they don't redefine tokens and don't
  use raw values where a token exists.
- Values allowed without a token: `0`, `1px` for borders, percentages,
  `currentColor`, `color-mix()` of tokens only. If a token is missing for a
  recurring value, **add the token**, not the raw value.

## CSS Modules

- One `*.module.css` co-located with the component. Semantic class names
  (`.card`, `.cardTitle`), not utility ones.
- No Tailwind, full stop: the migration is done (ADR-0005 #css-modules). App
  styling is Astro scoped `<style>` on tokens; `packages/ui` uses CSS Modules.
  Before landing a change that touches styling, check it renders identically
  with `tools/visual-diff`.
  ([ADR-0005](../adr/0005-design-system.md#css-modules)).

## Small caps: two roles {#two-small-caps-roles}

The small uppercase label (display font, `--font-size-xs`, bold, 0.1em
tracking, red text) serves two roles, and each has its own component in
`@butik/ui`:

- **`Eyebrow`** opens a section: it sits above the section's heading, directly
  or through `SectionHeading`. It is a page-structure element.
- **`MetaLabel`** is metadata inside a card or a record: a project's category, a
  team member's role, the "Cliente"/"Anno" fields of a project. It opens
  nothing and may come before or after the title it belongs to.

The two start from the same recipe and are free to diverge: a change of scale
for section eyebrows does not reach card metadata. Pick by role, not by look.
A context that re-tones the metadata sets `--meta-label-color`, holding 4.5:1
on its background.

Neither component takes margins from the page: the island's DOM is out of
reach of Astro's scoped styles (ADR-0008 `#astro-island-boundary`), so the
surrounding `.astro` provides the spacing on its own elements.

Outside both roles, and hand-written where they live: the category **chip** on
the home portfolio cards (a tag with its own background), the regular-weight
grey client line on the project cards, the red seal of the service hero, the
proof row of the service hero (value and label on one line), the partner name
shown on hover (decorative, `aria-hidden`), and the uppercase tracking of CTAs,
buttons, links, navigation links, form labels and filter chips. Each of these rules
names its role in a `design-lint-disable small-caps: <role>` comment, so a new
copy without one fails CI.

## Accessibility

- **AA** contrast: ≥ 4.5:1 normal text, ≥ 3:1 large text / UI.
- The red has three tokens, one per role. `--color-accent` (the brand red) is
  for what carries no text: glyphs, dots, borders, focus outlines.
  `--color-accent-text` is red **as text** on a light background (5.20:1 on
  `--color-bg`). `--color-accent-fill` is a red **surface that carries text**
  (buttons, badges, active chips, CTA hover states), always with
  `--color-fg-invert` on top (5.68:1). White on the brand red is 4.77:1 —
  passing, but with no margin for any future tweak of the red.
- The home hero's background photos are decorative (`alt=""`): the hero's text
  carries the content, so the Studio does not ask for their alternative text.
- Text over a photograph sits on a scrim anchored to the text block, not to
  the image: see `HeroBanner.module.css`, where the floor holds whatever the
  alignment and the photo.
- **Visible focus** on every interactive element (`:focus-visible` with a
  token-based outline); never `outline: none` without a replacement. The site
  sets a baseline in `global.css`: a `--color-accent` ring on everything
  interactive, at zero specificity (`:where()`), which holds 3:1 on the light
  and the dark backgrounds. On a photo or a dark panel the component sets its
  own white ring. A `@butik/ui` component declares its own ring anyway: the
  baseline is the site's, and Storybook does not load it.
- Non-native clickable elements have keyboard handling and correct roles; prefer
  native elements.

## Motion

- Always respect `prefers-reduced-motion`.
- Reusable motion accents are atoms of `@butik/ui`
  (`packages/ui/src/atoms/motion/`), and motion logic shared across unrelated
  components lives in `packages/ui/src/lib/`
  ([ADR-0010](../adr/0010-motion-in-the-catalogue.md), superseding
  [ADR-0005 #motion](../adr/0005-design-system.md#motion)). Motion that belongs to
  one component lives with it — in the component's CSS Module under
  `packages/ui`, or in the `.astro` that owns the behaviour. Co-location is the
  point of CSS Modules; the shared `lib` is for what genuinely crosses components.
- Motion atoms are CSS-only and need no client directive. `Underline` draws on
  page load — use it for text already in view (a hero title).
- The count-up of the home's impact numbers is CSS-only, in
  `apps/web/src/components/home/Numbers.astro`: a counter on a custom property,
  started when the row enters the view. Without support or with reduced motion
  the final number shows, never a zero.
- **Entrance motion is one system** ([PDR-0002](../product/decisions/0002-motion-musical-rhythm.md)):
  `@butik/ui/reveal` (armed by `BaseLayout` on every page) plus the styles in
  `apps/web/src/styles/motion.css`. Grid and list items bounce up once, the first
  time they enter; items entering together follow each other; section `h2`s get a
  red line drawn under them. A container opts its children in with
  `data-reveal-group` (numbered lists outside the prose are in by tag; class names
  play no part), an element opts out with `data-no-reveal`, picks the sideways variant with `data-reveal-effetto="scivola"`;
  a page opts out with `BaseLayout reveal={false}`.
- **Heroes enter on load, not on scroll**: `data-hero` on the section (excluded from
  the reveal), `data-battito` + `--ritardo` on the pieces that bounce up in
  sequence, `data-assesta` on the photo that settles from a slight zoom.
- **A loop that runs longer than 5 s can be paused** (WCAG 2.2.2): it pauses while
  keyboard focus is inside it and toggles with a tap or click outside its links and
  buttons (`data-paused`), as the partner marquee and the home hero photos do. A
  strip pauses on hover too; a loop that fills the screen does not, or it would
  never run under the pointer. The animation lives in CSS, not in an inline
  `style` shorthand, which would override `animation-play-state`.
- **The home enters once per session** ([PDR-0002](../product/decisions/0002-motion-musical-rhythm.md)):
  `BaseLayout` records the visit in `sessionStorage` (`butik:home-vista`) and, on
  a router navigation back to the home, sets `data-entrata-saltata` on the new
  `<html>` in `astro:before-swap`. Anything that enters on load turns its
  entrance off under that attribute (`[data-entrata-saltata] …`), the reveal is
  not armed, and a catalogue atom that draws on load (`Underline`) honours it
  too. A full load never carries it.
- **Entrance animations end clean**: fill mode `backwards`, never `both`. A
  leftover identity transform becomes the containing block of positioned
  descendants (it collapsed the mobile menu panel) and overrides the element's own
  `transform` (it misaligned the metodo rail).
- **Easing**: `--ease-bounce` for the musical bounce, `--ease-out` for the rest.

## Browser support

There is no fixed baseline. A CSS feature that is not yet Baseline may be used
when it degrades cleanly:

- the fallback must preserve **legibility and interaction** — losing a visual
  effect is acceptable, losing readable text or a working control is not;
- gate it explicitly with `@supports`, don't rely on the browser ignoring the
  declaration;
- state in a comment what is lost and where.

Example: the home header's overlay state uses a scroll-driven animation
(`animation-timeline`, not Baseline — Firefox lacks it). Under
`@supports not (…)` the header is simply solid from the start: the overlay
over the hero is lost, nothing else is.

## The arrow in a circle {#arrow-circle}

The drawn arrow in a circle that fills on hover is one atom,
`@butik/ui/ArrowCircle`, and it is never a link itself: it sits inside one.
`ArrowLink` renders it next to its text; a card that is a link as a whole (the
service cards on the home hero) renders it directly. The interactive ancestor
carries the `data-arrow-circle-host` attribute, and its `:hover` and
`:focus-visible` fill the circle and move the arrow — an attribute rather than
a class, so an `.astro` caller turns it on without a scoped rule reaching into
the island (ADR-0008 `#astro-island-boundary`).

## Simplicity

- YAGNI/KISS: don't abstract a component before it has 2-3 real uses.
- New code reads like the code around it: same comment density, same naming
  conventions.

## Discarded directions

- **One `Eyebrow` with a role prop** (`role="section" | "meta"`). It keeps a
  single import, but the metadata role would live inside a component named
  after the other role, and every divergence would become a branch in it.
- **A written rule only, metadata left hand-written.** Smallest change, but it
  leaves the same recipe copied into every card that needs it, with nothing
  tying the copies together.
- **A non-link `ArrowLink` (`as="span"`)** for cards that are links as a whole.
  A link component rendering something that is not a link carries text and
  props the card does not need; the arrow alone is the atom `ArrowCircle`.
