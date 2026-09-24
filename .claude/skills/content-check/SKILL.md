---
name: content-check
description: Check content architecture — Sanity Studio schemas vs Astro content collections (Zod) drift, required-field parity, and pages hardcoding editorial copy that should be content-driven. Report-only, never edits files. Use when asked to audit content/CMS alignment, AND automatically as part of every code review and PR review (see CLAUDE.md).
---

# Content architecture check

Produce a **report** on how well the content follows
[ADR-0004](../../../docs/adr/0004-content-architecture.md): Sanity as the CMS,
read only at build time into Astro content collections, content-driven pages.
Do **not** edit files.

## Procedure

1. **Load the model.** Read `apps/web/src/content.config.ts` (Zod collections),
   the loaders and GROQ queries in `apps/web/src/lib/sanity.ts`, and the Studio
   schemas in `apps/studio/schemaTypes/**` (plus `apps/studio/structure.ts` for
   the fixed page documents).

2. **Schema drift (Studio ↔ query ↔ Zod).** For each collection, compare the
   Sanity document type, what the GROQ query projects and how the loader maps
   it, and the Zod schema. A field present in one and missing or differently
   typed in another is drift. Report as
   `collection.field — Studio: <x> / query: <y> / Zod: <z>`.

3. **Required parity.** A field the site requires — required in Zod, or used by
   a page/component without a fallback — must be `required` in the Studio
   (including fields of objects inside arrays and of Portable Text blocks).
   Otherwise an editor can publish a document that breaks the build. Report as
   `blocker` when the gap is reachable by a normal edit in the Studio.

4. **ADR-0004 rules.**
   - Text with bold/italic/links is Portable Text (`testoFormattato`,
     `testoLegale`, block fields), never HTML inside a string field.
   - Link URLs are validated in the Studio (`hrefField`/`urlSicuro` in
     `apps/studio/schemaTypes/testo.ts`) and filtered on the site
     (`apps/web/src/lib/richText.ts`).
   - No image reaches the public site from `cdn.sanity.io`: every Sanity image
     goes through `getImage`/`<Image>` with sizes from `imageSize()`
     (`apps/web/src/lib/media.ts`); a raw `<img src>` or an `og:image` with a
     Sanity URL is a blocker.

5. **Hardcoded editorial copy.** Scan `apps/web/src/pages/**/*.astro` and the
   components they render (exclude `apps/web/src/pages/lab/**` — experimental).
   Flag user-facing copy (headings, paragraphs, CTA text, meta title/description)
   written inline instead of coming from a collection:
   - `warning` — a **new** hardcoded page or section (regression vs ADR-0004);
   - `note` — existing hardcoded copy (known debt).

6. **Orphans.** Studio document types no page renders, Zod collections with no
   Studio type, fields in the Studio that the site never reads.

## Output format

```
# Content architecture check

## Schema drift (Studio ↔ query ↔ Zod)
- [severity] collection.field — Studio: … / query: … / Zod: … . Fix: …

## Required parity
- [severity] collection.field — required in Zod/used without fallback, optional in Studio. Fix: …

## ADR-0004 rules
- [severity] path:line — <rule broken>. Fix: …

## Hardcoded copy (should be content-driven)
- [severity] path:line — <what copy>. Move to: <collection/field>.

## Orphans / gaps
- <type|collection|field> — <issue>.

## Passing checks (brief)
- <collection>: Studio ↔ Zod aligned, required parity ok; rendered by <page>.
```

Severities: **blocker** (an editor can break the build, or a Sanity CDN URL /
unsafe link reaches the site), **warning** (drift, new hardcoded copy),
**note** (known debt).
