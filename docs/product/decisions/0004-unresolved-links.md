# PDR-0004: Links that lead nowhere are hidden on the site, flagged in the Studio

- Status: accepted
- Date: 2026-09-24
- Reviewers: Gabriele Consiglio

## Context

The copy review found links with no destination: founders' LinkedIn set to `#`,
a Spotify link to Spotify's home, footer links to pages that do not exist
(Formats, Network, Sostienici, Transparency), a Blog link to a 404.

## Decision

A link without a destination is **kept in Sanity and flagged**, and **not
rendered on the site** until it resolves:

- The Studio warns (yellow, not blocking) on placeholders (`#`, example domains,
  "todo"/"tbd") and on internal paths that are not pages of the site.
- The site drops those links at build (`apps/web/src/lib/links.ts`); they appear
  by themselves at the next build once fixed.
- Links that live in code (header navigation) are removed until the page exists.

The open ones are tracked in issue #74.

## Rationale

- **Leave them on the site** — a link to nowhere is worse than no link.
- **Delete them from Sanity** — loses the intent; nobody remembers to add them
  back.

## Consequences

- \+ No broken links reach visitors; the Studio shows what is missing.
- − The two lists of internal pages (Studio warning, site filter) must be kept in
  sync when a page is added.
