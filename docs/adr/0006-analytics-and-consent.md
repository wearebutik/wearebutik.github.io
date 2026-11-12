---
status: accepted
date: 2026-07-10
tags: [analytics, consent, gdpr, posthog, gtm, cookie]
---

# ADR-0006: Analytics and consent

## Context

butik wants analytics (PostHog) and readiness for Google Tag Manager, **fully
compatible with a GDPR cookie banner** that is not tied to a provider and is
opensource. The site is static-first (ADR-0002), so consent is handled
**client-side**. We have a pattern already proven in our `monowai` repo to reuse.

## Decision

- **Cookie banner**: **`vanilla-cookieconsent` v3** (opensource,
  provider-agnostic) as a **headless consent engine**: it stores the choice in
  `cc_cookie`, clears a revoked category's cookies and fires `onConsent` /
  `onChange`. Configuration and init live in `src/lib/consent/` (config, init,
  cookie list), with a hook in the layout and a "cookie preferences" button in
  the footer. The interface is ours: the ticket in
  `components/BannerCookie.astro` (look and behaviour in
  [PDR-0006](../product/decisions/0006-cookie-banner-ticket.md)), which records
  the choice with `acceptCategory()`. `run()` starts with `autoShow: false` and
  the library never builds its own HTML or loads its CSS. The ticket skips bots
  and automated browsers, matching the library's `hideFromBots`.
- **Categories**: `necessary` (readOnly, always on) and `analytics` (with
  `autoClear` of the provider's cookies). Further categories (e.g. `marketing`)
  are added if and when needed.
- **No tracking before consent.** PostHog initializes with
  `opt_out_capturing_by_default: true` and `opt_out_persistence_by_default: true`.
  Consent drives `opt_in_capturing()` / `opt_out_capturing()` + `reset()` via the
  banner's `onConsent` / `onChange` callbacks.
- **Google Consent Mode** for GTM/GA: a `safeGtag` wrapper, no-op until GTM is
  loaded, that forwards `gtag('consent','update', { analytics_storage })` based on
  the `analytics` category. GTM/GA aren't loaded by default; the consent hook is
  ready.
- All logic is **client-side** (`*.client.ts` by convention), consistent with
  static-first. The `consent-check` skill verifies no third-party script is
  loaded/activated outside the consent gates.

## Alternatives considered

### A provider-bound banner (e.g. an analytics vendor's native consent)

Rejected by explicit requirement: we want an opensource, provider-independent
banner, so we can change analytics without changing consent.

### Load PostHog and activate it afterwards

Rejected: it risks tracking before consent. `opt_out_by_default` guarantees
nothing fires until the user accepts.

## Consequences

### Positive

- GDPR compliance by design; no tracking without consent.
- Consent decoupled from the provider: changing analytics doesn't touch the banner.
- Works on any static host (no server runtime required).

### Negative / accepted risks

- Consent isn't propagated server-side (not needed, but worth remembering if SSR
  is ever added).
- Two hooks (PostHog opt-in/out + Consent Mode gtag) to keep in sync.

### When to deviate (revisit triggers)

- Server-side tracking is added, or a provider that requires server-propagated
  consent → new ADR.

## Update (2026-07-13): GTM enabled via Google Consent Mode v2

The original decision left GTM/GA loaded-on-demand only ("GTM/GA aren't loaded by
default; the consent hook is ready"). We now **load GTM on every page** using the
pattern documented by `vanilla-cookieconsent` for tag managers — **Google Consent
Mode v2** — because we want the tag manager in place now, not later.

- **Loading model**: an inline script in `<head>` sets
  `gtag('consent','default', { ad_storage, ad_user_data, ad_personalization,
  analytics_storage: 'denied', wait_for_update: 500 })` **before** `gtm.js` is
  requested, then loads the GTM container. No tag fires while consent is denied;
  Consent Mode gates behaviour, not the script load.
- **Container id**: read from `PUBLIC_GTM_ID` (Astro env, `PUBLIC_` required — the
  id is public by nature). If unset, GTM is not injected and the build stays
  green — same graceful-degradation contract as PostHog.
- **Consent mapping** (`config.client.ts` → `applyConsent`): the `analytics`
  category drives `analytics_storage` (and PostHog opt-in/out). There is no
  `marketing` category while the GTM container holds no marketing tag: the
  three ad signals (`ad_storage`, `ad_user_data`, `ad_personalization`) stay
  at their `denied` default. A `marketing` category comes back together with
  the first real marketing tag and its real cookies.
- <a id="banner-copy"></a>**Banner copy and cookie list**: the banner's texts
  live on Sanity (document *Banner dei cookie*, `pagina-banner-cookie`,
  ADR-0004) and `BannerCookie.astro` renders them at build time. The
  categories and the technical cookie list (name, provider, duration, purpose:
  `lib/consent/cookie.ts`) stay in code, because they must match what the site
  actually writes.
- <a id="consent-audit"></a>**Live consent audit** (issue #22):
  `tools/consent-audit` opens the site in a clean browser and checks each
  choice — before choosing, accept all, reject, accept then revoke — against
  the cookie list the banner shows. Run it whenever the banner, PostHog or a
  GTM tag changes.
- **Module name**: the PostHog client is `lib/analytics/misure.client.ts`, not
  `posthog.client.ts`. Ad blockers often block files named after PostHog, and
  the same script starts the consent banner, which must show regardless.

### Accepted trade-off vs the original wording

The original decision's "no third-party script is loaded/activated outside the
consent gates" is relaxed for GTM: `gtm.js` itself loads before consent, but with
Consent Mode default-`denied` no storage is written and no tag fires until the
user accepts. Full script-blocking (loading `gtm.js` only after consent) was
considered and rejected in favour of Consent Mode's conversion/behaviour
modelling signals. If a stricter "zero Google contact before consent" posture is
required, switch GTM to `vanilla-cookieconsent`'s `data-category` script blocking
→ note it here.

## Update (2026-07-20): cookieless PostHog signals run without consent

The original decision read "no tracking before consent" as a blanket rule tied to
`opt_out_capturing_by_default`. That conflated two different things: whether a
**cookie** is written on the visitor's device, and whether **any** signal is
captured. ePrivacy art. 5(3) / art. 122 Codice Privacy require consent for storing
or accessing information on the device — not for every kind of data collection.
A signal that touches no cookie and carries no persistent identifier does not need
it; it rests on legitimate interest (measuring and keeping the site working).

- **Always on, cookieless, legitimate interest**: `$pageview`/`$pageleave` and web
  vitals (`capture_performance: { web_vitals: true }`). PostHog initializes
  immediately (if `PUBLIC_POSTHOG_KEY` is set) in posthog-js's own cookieless
  mode: `cookieless_mode: 'on_reject'` with `opt_out_capturing_by_default: true`,
  so "no decision yet" counts as rejected and events travel under the
  `$posthog_cookieless` sentinel (the server derives a daily-salted hash), with
  `persistence: 'memory'` — no cookie, no `localStorage`. `on_reject` alone
  would leave PostHog silent before consent. Cookieless mode must also be
  enabled in the PostHog project's settings, or the server drops these events.
  Off at this tier: `autocapture` (captures element text), heatmaps
  (`capture_heatmaps: false`; they record where and on what people click, and
  with them off PostHog does not load its dead-clicks module either), session
  recording, surveys and dead clicks (`disable_surveys`, `capture_dead_clicks:
  false`, unused by the site).
- **Consent-gated**: `analytics` opt-in calls `opt_in_capturing` (leaving
  cookieless mode, without an `$opt_in` event) and turns on durable persistence
  (`'localStorage+cookie'`), autocapture, heatmaps and session recording, which
  masks every text node and input (`maskTextSelector: '*'`, `maskAllInputs`).
  Revoking resets, turns those off, opts out and clears the opt-out record, so
  the visitor is back in cookieless mode: the pageview/web-vitals signals are
  **not** stopped, because they never needed the consent being revoked. The
  same client as pelion's (discentis), in
  `apps/web/src/lib/analytics/misure.client.ts`; every SDK call is wrapped, so
  blocked storage (Safari, sandboxed iframes) silences analytics instead of
  breaking the page. `misure.client.test.ts` runs the whole consent cycle
  against the real posthog-js in jsdom, in CI.
- <a id="after-first-paint"></a>**Loaded after the first paint.** posthog-js
  (~100 KB, through a dynamic `import()`) and `gtm.js` (~117 KB) load after the
  page's `load` event, when the browser is idle (at most 3 s later). Calls made
  earlier — init, consent, our events — wait in a queue and run in order
  (`creaAnalyticsDifferito`); Consent Mode's `denied` default is still set inline
  at once. This departs from PostHog's and Google's guidance (load early,
  asynchronously) on purpose: on Lighthouse's mobile simulation the two scripts,
  requested before the first paint, took the home from 92–93 to 78–84 (LCP from
  2.9–3.0 s to 3.9–4.9 s, measured on the beta by blocking them). The price: a
  visitor who leaves before the page finishes loading is not counted, and
  session recording (consent only) starts a moment later. The other pageviews
  are sent at init, and web vitals already measured are still read. Revisit
  when PostHog's own web vitals show the real visitors' LCP.
- **Banner and Cookie Policy wording**: rephrased from "no tracking before
  consent" to "no cookie before consent" (`config.client.ts`'s consent modal
  description, `privacy.astro`'s data-collection section) — the Cookie Policy
  section itself already said "no analytics *cookie* before consent"
  (`privacy.astro#cookie`), which was accurate all along; only the two broader
  claims needed correcting.
- **Interface state on the device**: a session-scoped, non-identifying value in
  `sessionStorage` that only changes how the interface behaves — `butik:home-vista`
  (`'1'`, the home entrance already played in this tab) — is strictly necessary
  for the service the visitor asked for, is never sent anywhere and needs no
  consent.
- **Scope**: this update covers PostHog only. GTM/GA stay exactly as the
  2026-07-13 update left them (Consent Mode v2, `analytics_storage` denied by
  default) — Consent Mode already expresses a device-side default-deny posture
  for Google's tags, so nothing there needed to change.

### Alternative considered: keep the original blanket rule

Rejected: it throws away real, low-risk product signal (pageviews and web vitals
correlate directly with real-world usage and performance) for a compliance
posture the actual regulation does not require, once no cookie is written.
