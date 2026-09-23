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
- No Tailwind in components once the migration is done
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
- A motion atom that observes the viewport (`Underline`, `CountUp`) needs
  `client:visible` in Astro; without a directive it renders frozen at its initial
  state.

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
