---
status: accepted
date: 2026-07-10
tags: [runtime, hosting, astro, static, serverless]
---

# ADR-0002: Runtime and delivery

## Context

butik is an Astro site. Today it is built as a **static site** and published to
GitHub Pages (`.github/workflows/deploy-pages.yml`). A trial `wrangler.jsonc`
(Cloudflare) already exists in the repo. The recurring question: where does
"server logic" live when it's needed (forms, auth, storage, dynamic endpoints)?

Explicit team constraint: **we don't want to bind ourselves to a server runtime.**
The site must stay publishable on any static host, and dynamic functions are to be
chosen case by case based on what's most effective — not imposed by an adapter.

## Decision

**Static-first and host-agnostic.** Astro produces a static build (`astro build`,
no SSR adapter committed by default). The site must be serveable from any static
host — GitHub Pages today, but also Cloudflare Pages, Netlify or others — without
changing the build model.

Dynamic needs are **not** solved by introducing global SSR. They are solved,
case by case, with a **serverless function chosen for the specific case**:
Cloudflare Workers / Pages Functions, Supabase (edge functions / DB), or managed
services (e.g. Web3Forms for the contact form, already in use). The selection
criteria and options are described as a **guidance**, not a fixed decision — see
[`docs/guidances/functions.md`](../guidances/functions.md).

When such a function is our own code (not a managed service), it lives as a
**separate app in the monorepo** — `apps/functions` (`@butik/functions`), with its
own deploy lifecycle — not mixed into the static site's build
([ADR-0007](./0007-monorepo-and-workspace-layout.md)). That app is created when the
first function actually lands, not scaffolded empty.

Cookie consent and analytics stay **client-side** (see
[ADR-0006](./0006-analytics-and-consent.md)), so they need no server runtime and
don't constrain this choice.

**What ships in the page is decided at build.** Astro writes CSS to files
(`inlineStylesheets: 'never'`), and integrations in `apps/web/src/lib/` rewrite
the built HTML:
- `cssCritico.ts` (beasties) inlines the rules that match the page's elements,
  plus the states scripts add at runtime (`data-*`, `aria-*`, `[open]`, `.is-*`),
  and loads the full files without blocking the first paint, as `rel=preload`
  that turns into a stylesheet on load, so later pages find the shared CSS in
  cache. Using `rel=preload` rather than `media=print` also keeps the ClientRouter
  fast: before a swap it waits for every new `rel=stylesheet` of the incoming
  page.
- `fontCritici.ts` inlines the fonts of the sections marked `data-font-critici`
  (the home hero), cut down to the characters they use.
- `@font-face` rules are always inline (`styles/fonts.css`). They reach the text
  through tokens (`var(--font-sans)`), which the critical-CSS pass cannot follow.
- The cookie banner's CSS loads only when the banner or the preferences open.

Every step works on static files, with no runtime on the host.

## Alternatives considered

### Migrate everything to Cloudflare Pages/Workers with an SSR adapter

`@astrojs/cloudflare`, hybrid build, native server functions. Rejected as the
*default*: nothing requires it today (form via Web3Forms, OG at build-time,
consent client-side) and it would bind the project to a runtime before it's
needed. Still available as a per-feature choice via the guidance.

### A single fixed backend (e.g. Supabase only)

Rejected: it would force every dynamic function into one provider even when
another option would be simpler. We prefer to choose per case.

## Consequences

### Positive

- Zero hosting migration now; low risk.
- Portability: switching static host is a CI change, not an architecture change.
- Dynamic functions stay isolated and replaceable.

### Negative / accepted risks

- No "obvious place" for server logic: each dynamic function needs a micro-decision
  (mitigated by the guidance with its criteria).
- Features needing request-time logic on the HTML (not delegable to a client→
  serverless call) aren't supported while we stay static-first.

### When to deviate (revisit triggers)

- A feature needs request-time server rendering (per-user HTML personalization,
  auth-gating pages, etc.) that can't be done with a client→serverless call. Then
  write a new ADR adopting an SSR adapter and fixing its runtime.
