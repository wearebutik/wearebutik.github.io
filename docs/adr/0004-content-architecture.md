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
  on Sanity's Studio hosting with `pnpm --filter @butik/studio run deploy`.
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
- **Copy under review lives as drafts in `production`.** New copy is written,
  or imported with `testi.ts --bozze`, as drafts next to the published
  documents. The site shows published documents only; whoever reviews the
  copy sees the drafts in the draft preview (*Draft preview*, below). A draft
  reaches the site when its document is published in the Studio.
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
  stored only in Sanity's webhook settings.
- **Draft preview: in the browser.** Whoever writes sees their drafts
  rendered by the site's own code before publishing, with nothing to install.
  The preview is the site built as a server and run inside a Service Worker
  (`apps/web/preview/`), published on Cloudflare Pages (project
  `butik-preview`, https://butik.consiglio.fyi). The Studio shows it next to
  the form in the **Anteprima web** tab (the `anteprima-web` presentation tool
  in `apps/studio/sanity.config.ts`); on its own, in a browser tab, it shows
  the site with the drafts of whoever signs in.
  - **Build.** `pnpm --filter @butik/web build:preview` builds the same site
    with `BUTIK_ANTEPRIMA=1`: `output: 'server'` with a minimal adapter
    (`apps/web/src/lib/anteprima/`); `BUTIK_PREVIEW_SW=1` picks the entry for
    the worker (`apps/web/src/lib/preview/server.ts`), which renders a
    browser `Request` into a `Response`. ADR-0002's static build is untouched:
    the adapter exists only in this build. The
    pages are unchanged: in this build `astro:content` is a module that runs
    the collection loaders and Zod schemas of `content.config.ts` on every
    request (cached for two seconds), with the `drafts` perspective. A draft
    that fails its Zod schema does not fail the page: the preview falls back
    to the published document (or leaves it out) and a strip at the bottom
    of the page lists the draft and the failing fields
    (`components/anteprima/AvvisoBozze.astro`). Photos
    are not optimized (`passthroughImageService`, straight from Sanity's
    CDN); `sharp`, `satori` and `resvg` are stubbed out, so there is no LQIP
    placeholder and no OG card; consent banner and analytics are off.
    With a token the client turns on stega and the page loads
    `@sanity/visual-editing`: click-to-edit, document list and navigation in
    the Studio tab, and a reload after each change. The reload waits until
    Sanity serves the revision the Studio is saving (`POST /_aggiorna` with
    `{ id, rev }`, at most six seconds): the Studio saves with `visibility:
    async`. A discarded draft gets no event from the Presentation tool, so
    the Studio's layout listens for drafts and versions that disappear and
    sends the page `butik-preview/ricarica` with `postMessage`; the page
    waits until the draft is gone (`rev: null`) and reloads. The perspective chosen
    in the Studio (drafts, published, or a release) reaches the worker
    through `onPerspectiveChange` (`POST /_perspective`) and the page reloads
    with it; outside the Studio the preview shows drafts. Fields the code
    compares or validates (enums, links, filter ids, `category`, e-mails) and
    link-shaped values stay out of stega (`NON_CODIFICATI` in
    `apps/web/src/lib/sanity.ts`). `apps/web/preview/build.ts` bundles the
    server and the worker (`worker.ts`) into `_astro/preview.<hash>.js`, and
    writes `sw.js`, a one-line `importScripts` of that bundle.
  - **The worker.** Every page is rendered in the browser; the static files
    (`/_astro/`, any path with an extension), `/sw.js` and Cloudflare's
    `/cdn-cgi/` go to the network. A deploy changes the bundle's hash, hence
    `sw.js` (`no-cache` in `_headers`; the bundle is `immutable`): the new
    worker takes over at once (`skipWaiting`, `clients.claim`) and reloads the
    open tabs. Pages also ask for an update on every `astro:page-load`,
    since the `ClientRouter` moves between pages with `fetch` and Chrome
    checks for updates only on navigations. `/_version` returns the commit
    the worker was built from.
  - **Authentication.** The site shows only with a Sanity session of a
    project member (`apps/web/preview/session.ts`): the token is valid when
    `/users/me` and `/projects/uvzsc0vv` both answer, checked again at every
    worker start, so a revoked session or a removed member loses the preview.
    The session lives in IndexedDB. It comes from one of two places:
    - **the Studio's tab**: the page in the iframe asks the Studio with
      `postMessage`, the Studio answers only to the preview's origin
      (`apps/studio/anteprimaWeb.tsx`) and the page hands the token to the
      worker (`POST /_token`). The token never travels in a URL: the Studio
      shows the preview's URL;
    - **a login in the preview** (`/_login`): Sanity's providers with
      `type=token`, back to `/_callback`, which exchanges the session id on
      the project's API host. Sanity accepts the callback only from an origin
      in the project's CORS list (`https://butik.consiglio.fyi`, with
      credentials). `/_logout` revokes this session; the Studio's stays with
      the Studio.

    Without a session a tab gets the login page, the Studio's iframe a page
    waiting for the token, any other request a `401`. Anyone can still fetch
    the static files: they are the public site's code and assets. The drafts
    need the Sanity token.
  - **Not indexed.** `X-Robots-Tag: noindex` on every path and a `robots.txt`
    that disallows everything.
  - **Isolation from the site.** `__BUTIK_ANTEPRIMA__` is a build-time
    constant (`astro.config.mjs`), so no environment variable at runtime can
    turn drafts on in the static build.
  - **Distribution.** `.github/workflows/preview.yml` builds and deploys the
    preview on every code change on `main`, with `CLOUDFLARE_API_TOKEN`
    (Pages Edit on that account only) in the repository's secrets. The
    preview holds code, not copy: a publish in the Studio does not rebuild
    it. The Cloudflare account and the `consiglio.fyi` domain are personal,
    a temporary home until the preview moves to a butik account and domain.
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
- **Photos go through `apps/web/src/lib/foto.ts`**:
  - Every photo ships as AVIF with a WebP fallback, in a `<picture>`: `Foto.astro` in pages, and the `sources` prop of the `@butik/ui` components that show photos.
  - Quality comes from the photo's role: hero or thumbnail.
  - `sizes` caps the density at 2×.
  - The AVIF encoder settings live in `astro.config.mjs` (`image.service`).
  - The deploy workflow caches the optimized images (`node_modules/.astro/assets`), because AVIF makes a cold build several times slower. Astro's cached file names do not account for the encoder settings: after changing `image.service`, delete `apps/web/node_modules/.astro/assets` locally.

  Logos and icons are not photos and keep `<Image>`.
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
  of changed documents, imported with `sanity dataset import --replace`; with
  `--bozze` the changes come out as drafts. A `dataset export` backup precedes
  every write to a dataset.
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

### A public version B under `/b/`

A second build from another dataset, published under `/b/`, lets reviewers
compare the copy by opening a link. It costs a second dataset kept in step by
hand, a second build in every deploy, and a post-build rewrite of every
internal link; the draft preview shows the same copy from the documents that
will be published.

### Serving images from Sanity's CDN

Simpler (no download at build), but ties public traffic to Sanity's bandwidth
quota, which on the Free plan blocks the project when exceeded.

### A preview binary on the writer's computer

The same server compiled by Bun into a single macOS binary, serving the site
on `localhost:4321` for the Studio's Presentation tool, with the Sanity CLI's
login at every start. It needs a download, a terminal and Chrome's local
network permission, runs only on Apple Silicon, and a code change means a
new download. The preview in the browser does the same with nothing to
install.

### Cloudflare Access in front of the draft preview

A login on the preview's host (Access with one-time PIN for `@wearebutik.com`
addresses) keeps the preview's files private. In the Studio the preview runs
in a third-party iframe, where Chrome does not send Access's cookie even with
`SameSite=None`: the worker can no longer update and `@sanity/visual-editing`
never loads. The files are the public site's anyway, and the drafts are
behind the Sanity session.

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
- Publishing a document publishes all of its draft: a routine fix made on a
  document whose copy is still under review also publishes that copy.
- Reviewing the copy needs a Sanity login on the project: there is no public
  link to share with a reviewer outside the project.
- The draft preview's access control runs in the browser, in the worker: the
  host serves the same files to everyone.
- Free-plan limits: 20 seats with only Administrator and Viewer roles, 10k
  documents, 250k API requests/month.

### When to deviate (revisit triggers)

- Sanity usage approaches the Free-plan quotas, or the team needs roles beyond
  Administrator/Viewer → evaluate the Growth plan or another CMS.
- The draft preview moves to a butik domain → change `ANTEPRIMA_WEB`
  (`SANITY_STUDIO_ANTEPRIMA_WEB`) in the Studio and the CORS origin in
  Sanity, then redeploy the Studio.
