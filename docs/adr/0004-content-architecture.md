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

- **Sanity project** `uvzsc0vv`, datasets `production` and `anteprima` (both
  public), Free plan. The
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
  that queries Sanity with GROQ during `astro build`, with the `published`
  perspective: drafts never reach the public site. If Sanity is unreachable the
  build fails, and the last deploy keeps being served.
- **Two versions of the copy: A at `/`, B at `/b/`.** Version A, the site, is
  built from `production`. Version B, an alternative copy under review, is the
  same code built from `anteprima` and published under `/b/` on the same host.
  `pnpm build` produces both into one `dist/`: `astro build` writes A to the
  root, then `build:b` (`BUTIK_VERSIONE=b`) sets `base: '/b'`, `outDir:
  dist/b` and the `anteprima` dataset (`apps/web/astro.config.mjs`,
  `apps/web/src/lib/sanity.ts`). Both datasets are read with the `published`
  perspective: drafts never reach any page, and no token is needed.
  - **Links stay inside `/b/`.** Astro prefixes what goes through its pipeline
    (`/_astro/`, `url()` in CSS). Internal paths written in code or coming from
    Sanity are prefixed after the build by the `base-path` integration
    (`apps/web/src/lib/basePath.ts`), which then fails the build if any link in
    `dist/b` still leads outside `/b/`. Content keeps unprefixed paths, so
    `lib/links.ts` checks them the same way in both versions. Code that reads
    `Astro.url.pathname` strips the base with `senzaBase()`
    (`apps/web/src/lib/versione.ts`); HTML built in client JS (the consent
    banner) uses `BASE`.
  - **B stays out of search engines.** Every B page carries `noindex`, its
    canonical points at the corresponding A page, and a strip at the top says
    it is version B, with the one link back to A (`data-versione-a`, the only
    exception the `base-path` guard accepts). `sanity-cdn-guard` checks both
    builds.
  - **Review and adoption.** Reviewers compare `/` and `/b/` page by page. A
    passage chosen from B reaches the site by copying it into `production` in
    the Studio and publishing. The hosted Studio edits `production`; B is
    edited with a local Studio on `anteprima`
    (`SANITY_STUDIO_DATASET=anteprima pnpm --filter @butik/studio dev`) or
    through the `testi.ts` import. Each build has its own dataset override
    (`SANITY_DATASET` for A, `SANITY_DATASET_B` for B).
  - **Lifecycle.** `anteprima` holds B for as long as a review is open. When it
    closes, `build:b` comes out of the `build` script in
    `apps/web/package.json`: `/b/` disappears with the next deploy, and `anteprima` can be emptied.
- **Images never come from Sanity's CDN.** Every image from Sanity goes through
  Astro's image pipeline at build (`image.domains: ['cdn.sanity.io']`,
  `getImage`/`<Image>` with `inferSize`) and is served from `/_astro/` on our
  hosting — including `og:image`. The built site contains no `cdn.sanity.io`
  URL: the `sanity-cdn-guard` integration (`apps/web/src/lib/sanityCdnGuard.ts`)
  scans `dist/` at the end of every build and fails it if the domain appears. This keeps public traffic off Sanity: on the Free plan there are no
  overages, and exceeding a quota blocks the project.
  The one image that skips the pipeline is the **blurred placeholder (LQIP)**
  of progetto and servizio hero photos and of the home hero slideshow: the loader downloads a small version
  at build, shrinks it with `sharp` and inlines it in the HTML as a `data:`
  URI (`apps/web/src/lib/lqip.ts`), so it is text in the page, never a URL.
  A failed download leaves the placeholder out instead of failing the build.
- **Publishing.** A publish in the Studio reaches the site through a new build
  and deploy: a Sanity webhook on published documents in `production` calls
  GitHub's `repository_dispatch` (`event_type: sanity-publish`), which runs
  `deploy-pages.yml`. The webhook authenticates with a fine-grained GitHub token
  stored only in Sanity's webhook settings. Every deploy rebuilds both A and B.
  `anteprima` has no webhook: a change there goes live on `/b/` when the
  workflow is run by hand (`gh workflow run deploy-pages.yml`, or *Run
  workflow* in GitHub Actions), or with the next deploy for any reason.
- **Structured bodies.** A `servizio` body is a list of reorderable sections
  (Cosa facciamo, Adatto a, Di cosa ci occupiamo, Metodo, Bandi vinti, Rimando
  ai progetti, Banner di chiusura), one Sanity object per site component. Text
  that needs bold, italics or links is a `testoFormattato` field, never HTML in
  a string.
- **Pages** are one fixed document each (`_id` `pagina-<id>`: home, chi-siamo,
  contatti, partners, servizi, progetti, testimonials, privacy, termini, and
  `footer` — the footer shared by every page, whose social profiles the
  contatti page reuses),
  shown in the Studio as fixed entries that cannot be created, duplicated or
  deleted. Rich text is rendered inline by `apps/web/src/lib/richText.ts` so
  the containing element keeps the page's scoped styles; legal bodies keep the
  heading ids Markdown used to generate, and the Cookie Policy heading keeps the
  fixed `#cookie` anchor the consent banner links to.
- **Image sizes** of Sanity images are read from the asset URL (`…-WxH.ext`,
  `imageSize()` in `apps/web/src/lib/media.ts`), not fetched with `inferSize`:
  one network error would otherwise fail the build.
- **Links that lead nowhere** — placeholders (`#`, example domains, "todo")
  and internal paths to pages that do not exist — are kept in Sanity and flagged
  as warnings in the Studio, and the site does not render them
  (`apps/web/src/lib/links.ts`) until they resolve
  ([PDR-0004](../product/decisions/0004-unresolved-links.md)). Both sides read
  the same rules from `@butik/site-config/links`; the site's build checks its
  page list against `src/pages`
  ([ADR-0007](./0007-monorepo-and-workspace-layout.md#decision)).
- **Format rules shared by Studio and Zod** (email addresses, social networks)
  come from `@butik/site-config`, so a value the Studio accepts never fails
  the build.
- **Bulk content changes** go through repeatable scripts in
  `apps/studio/scripts/`: `foto.ts` uploads photos from an assignment file
  (resized, metadata stripped, deduplicated by content hash) and wires them to
  documents; `testi.ts` exports copy to Markdown files and generates the NDJSON
  of changed documents, imported with `sanity dataset import --replace` (into
  `anteprima` for version B). A `dataset export` backup precedes every write to
  a dataset.
- Purely structural pages (e.g. the experimental `lab/*`) stay in code; editorial
  copy does not live hardcoded in `.astro` pages.

## Alternatives considered

### Sitepins (git-native CMS)

Content as Markdown/MDX in the repo, edited through Sitepins: content stays in
git with no external service. The editor handles MDX bodies poorly (imports
leak into the editor as paragraphs, components show up as code blocks), media
paths need a convention of their own to resolve in both Astro and the editor,
and every schema exists twice, in Zod and in `.sitepins/schema/**`.

### Strapi Cloud

No free plan since July 2026.

### Contentful, Hygraph

Free plans too tight for the content model (Contentful: 25 content types;
Hygraph: 1,000 records), and Contentful's first paid tier is ~$300/month.

### Version B as drafts over `production`

Drafts are not public even on a public dataset: building them needs a read
token and a preview behind access control (another host, e.g. Cloudflare
Access). In the Studio, *Publish* on any page publishes its B draft, so a
routine edit can replace A by mistake.

### A webhook on `anteprima`

A second Sanity webhook would rebuild `/b/` on every publish in `anteprima`.
B changes in batches (imports, review rounds), so a manual run is enough and
keeps one fewer GitHub token in Sanity's settings.

### Rewriting B's links with a helper in every component

A `BASE_URL` helper at each place that renders a link (about twenty files,
plus rich text and Portable Text) also covers `astro dev`, but every new link
has to remember it; the post-build rewrite covers links from Sanity by
construction, and the guard is needed either way.

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
- Two datasets with the same schema while a B review is open: a schema change
  deployed to the Studio applies to both. A and B ship in one deploy, so a B
  build that fails (`anteprima` not satisfying the Zod schemas, or a link the
  `base-path` guard rejects) also stops a `production` publish from reaching
  `/`.
- B pages carry both `noindex` and a canonical to A: `noindex` keeps B out of
  the index, the canonical names the page that stands for it.
- `astro dev` serves version A only; B is checked on a build
  (`pnpm --filter @butik/web build:b`, then any static server on `dist/`).
- Free-plan limits: 20 seats with only Administrator and Viewer roles, 10k
  documents, 250k API requests/month.

### When to deviate (revisit triggers)

- Sanity usage approaches the Free-plan quotas, or the team needs roles beyond
  Administrator/Viewer → evaluate the Growth plan or another CMS.
- Editors need to see changes live without a build → consider on-demand
  revalidation, which conflicts with static-first (ADR-0002).
