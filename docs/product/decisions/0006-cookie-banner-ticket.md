# PDR-0006: The cookie banner is an entrance ticket

- Status: accepted
- Date: 2026-11-13
- Reviewers: Gabriele Consiglio

## Context

Issue #105 asks for a cookie banner that belongs to butik's design system and
to its musical identity. The library's default bar
(`vanilla-cookieconsent`) looks like any other site's, and its preferences
open in a separate window. The banner has legal constraints that the look
cannot bend: "Accept" and "Reject" with the same visual weight (EDPB
guidelines on deceptive patterns), a second layer of information with every
cookie's name, provider, duration and purpose (Garante, 2021), and a way to
change the choice at any time.

Two directions were compared on a throwaway `lab/banner-cookie` page,
*Biglietto* and *Scaletta*, each with several copy variants.

## Decision

- **The banner is a ticket.** A white ticket with a body and a stub separated
  by a dashed tear line, with two notches on the line. Small caps eyebrow
  «Ingresso libero · butik», a "Sempre attivi" stamp on the necessary
  category, a red switch for the analytics category.
- **Desktop**: the ticket sits bottom right, 25rem wide, and never blocks the
  page.
- **Phone** (below 768px): a sheet rises from the bottom showing only eyebrow,
  title and buttons; scrolling up reveals the text and the preferences. The
  empty area above lets taps through to the page.
- **Preferences open inside the ticket**, from «Gestisci preferenze» and from
  the footer's «Preferenze cookie». Each category has a «Quali cookie»
  disclosure with the cookie list. The close button and Esc exist only when
  the preferences are reopened from the footer: on first visit a choice is
  required.
- **Standard copy.** Title, text and buttons use the wording visitors already
  recognise: «Questo sito usa i cookie», «Accetta tutti», «Rifiuta tutti»,
  «Gestisci preferenze». The personality is in the shape and the eyebrow, not
  in the words. The copy lives on Sanity and goes through legal review (#77).
- **The library stays the engine.** `vanilla-cookieconsent` stores the choice,
  clears revoked cookies and drives PostHog and Consent Mode; the ticket only
  calls `acceptCategory()` (ADR-0006).

## Rationale

- *Biglietto* over *Scaletta* (a dark setlist card): the light ticket reads as
  an invitation and keeps the two buttons equal on a white background.
- Playful copy («Accordiamo gli strumenti?», «Uno sguardo dal backstage») was
  dropped: on a phone only the title shows before the buttons, and it has to
  say plainly that the question is about cookies.

## Consequences

- \+ The banner looks like butik and stays inside the legal constraints;
  `tools/consent-audit` checks the behaviour is the same as before.
- \+ The library's CSS (~31 KB) is no longer downloaded.
- − We own the banner's markup and accessibility (focus, Esc, switch, reading
  order), which the library used to provide.
- − On phones the reading order (text before buttons) differs from the visual
  order (buttons before text).
