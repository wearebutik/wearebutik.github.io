# PDR-0005: Every CTA is the Button, and its hover fills

- Status: accepted
- Date: 2026-09-25
- Reviewers: Gabriele Consiglio

## Context

[PDR-0001](./0001-cta-pill-shape.md) made the pill the shape of every CTA. It
settled the shape, not the type or the hover, and two languages survived it:

- `@butik/ui/Button`: pill, `--font-size-sm`, sentence case, hover lifts it by
  1px with no change of colour.
- `CtaBanner` and three app CTAs (the "about" link in the home, the newsletter
  submit, the contact form submit): small caps (`--font-size-xs`, uppercase,
  0.1em), dark fill turning red on hover, the secondary one filling in. The three
  app CTAs were also still rectangular, against PDR-0001.

The review tooling (`design-check`) reports a molecule redrawing `Button` and
an app pattern repeated three times with no atom behind it.

## Decision

- **Every CTA is `@butik/ui/Button`.** `CtaBanner` renders two Buttons (the
  primary with `tone="dark"`, the secondary `variant="ghost"`); the three app
  CTAs are Buttons with `tone="dark"`. The page gives them only width and
  spacing.
- **Button's type stays**: `--font-size-sm`, sentence case.
- **Button's hover fills.** The dark tone turns to the red fill
  (`--color-accent-fill`); a ghost fills with the colour of its outline
  (dark, white on photos, red for the accent ghost) and its text inverts. The
  red primary only lifts, as before.
- **A disabled Button** (the contact form while sending) is dimmed and keeps
  its colours on hover.

## Rationale

- Small caps for every CTA: rejected — it changes every Button on the site
  (header, heroes, service pages) to fix four places, and small caps are the
  label recipe of `Eyebrow` and `MetaLabel`.
- Button as it is, no hover colour: rejected — the red on hover is the one
  feedback the four CTAs had, and the header CTA already turns red over the
  hero.
- Keep a separate rectangular dark CTA: rejected by PDR-0001 (one visual
  language per role).

## Consequences

- \+ One component for every CTA, with its states in Storybook and Chromatic.
- \+ Hover feedback on every Button, not only in the header.
- − The four CTAs lose their small caps, and the three app CTAs turn from
  rectangles into pills.
- − The newsletter submit is a pill next to a rectangular field.
