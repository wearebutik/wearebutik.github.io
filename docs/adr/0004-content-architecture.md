---
status: accepted
date: 2026-09-23
tags: [content, cms, sanity, content-collections]
---

# ADR-0004: Content architecture

## Context

butik's content must be editable by the team without touching code, while the
site stays static (ADR-0002): no runtime backend serves pages. The site's
collections are typed with Zod in `apps/web/src/content.config.ts` and consumed
through Astro content collections.

## Decision

**Sanity is the CMS; Astro content collections are the typed interface the site
reads.** Sanity is read **only at build time**: the published site never calls
it.

- **Sanity project** `uvzsc0vv`, dataset `production` (public), Free plan. The
  editing UI is Sanity Studio, in `apps/studio` (`@butik/studio`), published
  on Sanity's Studio hosting with `pnpm --filter @butik/studio deploy`.
  `butik.sanity.studio` redirects to the Studio inside the organization's Sanity
  Dashboard (login required). The deployed Studio is pinned to the `sanity`
  version in the lockfile (`autoUpdates: false` in `sanity.cli.ts`).
- **Schemas.** Each collection has a Sanity schema in `apps/studio/schemaTypes/`
  mirroring its Zod schema; the two stay aligned (the `content-check` skill
  watches for drift). A field the site requires (required in Zod, or used
  without a fallback by a component) is `required` in the Studio too: Sanity
  then refuses to publish a document that would break the build. Rich bodies are **Portable Text**, rendered with
  `astro-portabletext`; custom blocks (`imageBlock`, `imageSide`,
  `imageCarousel`) map onto the existing image components.
- **Loading.** Each collection has a content-layer loader (`apps/web/src/lib/sanity.ts`)
  that queries Sanity with GROQ during `astro build`. Drafts are excluded in the
  query. If Sanity is unreachable the build fails, and the last deploy keeps
  being served.
- **Images never come from Sanity's CDN.** Every image from Sanity goes through
  Astro's image pipeline at build (`image.domains: ['cdn.sanity.io']`,
  `getImage`/`<Image>` with `inferSize`) and is served from `/_astro/` on our
  hosting — including `og:image`. The built site contains no `cdn.sanity.io`
  URL: the `sanity-cdn-guard` integration (`apps/web/src/lib/sanityCdnGuard.ts`)
  scans `dist/` at the end of every build and fails it if the domain appears. This keeps public traffic off Sanity: on the Free plan there are no
  overages, and exceeding a quota blocks the project.
- **Publishing.** A publish in the Studio reaches the site through a new build
  and deploy: a Sanity webhook on published documents calls GitHub's
  `repository_dispatch` (`event_type: sanity-publish`), which runs
  `deploy-pages.yml`. The webhook authenticates with a fine-grained GitHub token
  stored only in Sanity's webhook settings.
- **Structured bodies.** A `servizio` body is a list of reorderable sections
  (Cosa facciamo, Adatto a, Di cosa ci occupiamo, Metodo, Bandi vinti, Rimando
  ai progetti, Banner di chiusura), one Sanity object per site component. Text
  that needs bold, italics or links is a `testoFormattato` field, never HTML in
  a string.
- **Migration status.** `progetti` and `servizi` read from Sanity. `pagine` is
  still Markdown in `apps/web/src/content/pagine`, edited via Sitepins (media
  paths per [ADR-0009](./0009-sitepins-media-paths.md)), until it moves to
  Sanity — tracked in issue #50.
- Purely structural pages (e.g. the experimental `lab/*`) stay in code; editorial
  copy does not live hardcoded in `.astro` pages.

## Alternatives considered

### Sitepins (git-native CMS)

Content as Markdown in the repo, edited through Sitepins. It keeps content in git
with no external service, but the editor handles MDX bodies poorly (imports leak
into the editor as paragraphs, components show up as code blocks), and every
schema exists twice, in Zod and in `.sitepins/schema/**`. It is being phased out.

### Strapi Cloud

No free plan since July 2026.

### Contentful, Hygraph

Free plans too tight for the content model (Contentful: 25 content types;
Hygraph: 1,000 records), and Contentful's first paid tier is ~$300/month.

### Serving images from Sanity's CDN

Simpler (no download at build), but ties public traffic to Sanity's bandwidth
quota, which on the Free plan blocks the project when exceeded.

## Consequences

### Positive

- The team edits structured content, including rich bodies with images, in a
  purpose-built editor; the site stays static and host-agnostic.
- Strong typing (Zod) on what the loader returns → content errors caught at
  build time.
- Sanity usage grows with the number of builds, not with site traffic.

### Negative / accepted risks

- Content lives outside git: it is not reviewed via PR, and a publish needs a
  build to go live.
- Vendor dependency on Sanity (its API at build time, its Studio for editing).
- Two schemas to keep aligned (Zod ↔ Sanity).
- Free-plan limits: 20 seats with only Administrator and Viewer roles, 10k
  documents, 250k API requests/month.

### When to deviate (revisit triggers)

- Sanity usage approaches the Free-plan quotas, or the team needs roles beyond
  Administrator/Viewer → evaluate the Growth plan or another CMS.
- Editors need to see changes live without a build → consider on-demand
  revalidation, which conflicts with static-first (ADR-0002).
