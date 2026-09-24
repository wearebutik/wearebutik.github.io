# PDR-0003: Full-screen glass mobile menu

- Status: accepted
- Date: 2026-09-24
- Reviewers: Gabriele Consiglio

## Context

The mobile menu was a pale panel dropping under the header: small uppercase
links, a black button, and a visible break from the dark hero it opened over.

## Decision

The mobile menu covers the screen with dark glass (65% dark, 24px blur, a
diagonal sheen at the top). Links are large, in the heading typeface, and enter
one after the other with the entrance bounce; the current page is highlighted;
"Lavoriamo insieme" is a red pill; the icon turns into an X. While open the page
behind does not scroll and is `inert`; Escape closes it. It stays a native
`<details>`.

## Rationale

- **Dark dropdown under the header** — prototyped side by side; more
  conservative, but it keeps the menu a strip over the page instead of a moment
  of its own.
- **The previous pale panel** — broke the hero's language and gave the links no
  weight on a phone.

## Consequences

- \+ The menu speaks the glass-and-bounce language of the hero.
- − Two small client behaviours (scroll lock, Escape/inert) in `Header.astro`.
- − On light pages the glass reads grey; contrast stays above AA for the large
  text.
