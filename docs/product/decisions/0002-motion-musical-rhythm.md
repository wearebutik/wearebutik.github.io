# PDR-0002: Entrance motion — "musical rhythm"

- Status: accepted
- Date: 2026-09-24
- Reviewers: Gabriele Consiglio (to be reviewed with Alessandra Di Caro)

## Context

The site moved to full-bleed photos, glass cards and a looping hero. Sections
appeared all at once, static, and the heroes had no entrance: the new visual
language had no motion to go with it.

## Decision

One entrance language across the site, "musical rhythm":

- **Grid and list items** (service and project cards, numbers, method steps,
  partner logos) rise from the bottom with a small bounce, like equalizer bars,
  **once**, the first time they enter the viewport. Items entering together
  follow each other at 120ms steps (capped at six steps).
- **Tall stacked lists on mobile** (the method steps) slide in from the left
  instead of squashing vertically.
- **Section headings** get a red line drawn under them, left to right.
- **Heroes** (home, service pages, page banners) enter on load: the photo
  settles from a slight zoom, title, text and buttons bounce up in sequence. On
  the home the header arrives last, after the hero.
- **Page transitions** with a shared element (project card → project banner)
  land with the same bounce; when the photo morphs in, the banner's own entrance
  is skipped.
- **Numbers** count up once when they enter.
- The contact page has no entrance motion. `prefers-reduced-motion` turns all of
  it off.

Implementation: `@butik/ui/reveal` + `apps/web/src/styles/motion.css`, token
`--ease-bounce` (see [design-approach.md#motion](../../guidances/design-approach.md#motion)).
Prototypes: `/lab/motion/a`, `/lab/motion/b` (this one), `/lab/motion/c`.

## Rationale

- **Sober reveal (A)** — fade and slight rise: elegant, but indistinguishable
  from any site; nothing of butik's music in it.
- **Editorial (C)** — masked titles, photo wipes: premium, heavy on long pages,
  and the wipes compete with the photos instead of showing them.
- **Scroll-driven (CSS-only) triggers** — tried first: the animation followed the
  scroll back and forth, so a slow scroll never showed the bounce. A small
  observer script plays each entrance once.

## Consequences

- \+ One recognisable motion vocabulary for every page, extensible with a data
  attribute (`data-reveal-group`, `data-no-reveal`, `data-battito`).
- \+ Works in every browser (Firefox included), since the trigger is a script.
- − A client script on every page (small, idempotent under the view-transition
  router).
- − The lab variants A and C stay until the review with Alessandra; their
  exclusions live in production CSS until they are removed.
