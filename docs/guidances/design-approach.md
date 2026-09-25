> **Recommended, not enforced.** The design vocabulary a linter can't fully
> verify. Applies within the boundaries decided in
> [ADR-0005](../adr/0005-design-system.md). The `design-check` skill covers the
> mechanizable part (tokens vs raw values, contrast, focus).

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

## Accessibility

- **AA** contrast: ≥ 4.5:1 normal text, ≥ 3:1 large text / UI.
- **Visible focus** on every interactive element (`:focus-visible` with a
  token-based outline); never `outline: none` without a replacement.
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
- A motion atom that observes the viewport (`Underline` in its default
  `trigger="view"`) needs `client:visible` in Astro; without a directive it renders
  frozen at its initial state. `Underline trigger="load"` draws with CSS on page
  load and needs no directive — use it for text already in view (a hero title).
- The count-up of the home's impact numbers is CSS-only, in
  `apps/web/src/components/home/Numbers.astro`: a counter on a custom property,
  started when the row enters the view. Without support or with reduced motion
  the final number shows, never a zero.
- **Entrance motion is one system** ([PDR-0002](../product/decisions/0002-motion-musical-rhythm.md)):
  `@butik/ui/reveal` (armed by `BaseLayout` on every page) plus the styles in
  `apps/web/src/styles/motion.css`. Grid and list items bounce up once, the first
  time they enter; items entering together follow each other; section `h2`s get a
  red line drawn under them. A component opts in with `data-reveal-group` when its
  container is not a grid/list/cards by name, opts an element out with
  `data-no-reveal`, picks the sideways variant with `data-reveal-effetto="scivola"`;
  a page opts out with `BaseLayout reveal={false}`.
- **Heroes enter on load, not on scroll**: `data-hero` on the section (excluded from
  the reveal), `data-battito` + `--ritardo` on the pieces that bounce up in
  sequence, `data-assesta` on the photo that settles from a slight zoom.
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

## Simplicity

- YAGNI/KISS: don't abstract a component before it has 2-3 real uses.
- New code reads like the code around it: same comment density, same naming
  conventions.
