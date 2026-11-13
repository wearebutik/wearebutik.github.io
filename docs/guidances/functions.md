> **Per-feature choice.** The site is static-first and host-agnostic
> ([ADR-0002](../adr/0002-runtime-and-delivery.md)). This guidance does NOT fix a
> runtime: it lists the options and the criteria to choose, case by case, where a
> single feature's dynamic logic goes. When a choice becomes stable and holds for
> the whole site, promote it to an ADR.

# Functions — where dynamic logic goes

The site is static. When a feature needs runtime logic (form submission, reading/
writing data, auth, webhooks, on-demand generation), add it as an **isolated
function**, called from the client. Do not introduce global SSR.

When the function is our own code (not a managed service), it lives in the
monorepo as `apps/functions` (`@butik/functions`), with its own deploy — created
when the first one lands, not scaffolded empty
([ADR-0007](../adr/0007-monorepo-and-workspace-layout.md)).

## The options

### 1. Managed service (no backend of ours)

For standard cases well served by SaaS. Prefer this road when a mature service
covers the need and its data handling is acceptable for the privacy policy.

- ✅ Zero infra to maintain, fast.
- ❌ Light vendor lock-in, less control.

### 2. Cloudflare Workers / Pages Functions

For lightweight custom logic near the edge (proxying, transforms, small
endpoints). The repo already has a trial `wrangler.jsonc`.

- ✅ Fast edge, same account as the site; data stays with a provider already in
  the privacy policy.
- ❌ One more runtime to know; state/persistence needs KV/D1/R2.

In use: the **contact form** (`apps/functions`, `butik-form` on
form.wearebutik.com). It checks Cloudflare Turnstile and forwards the message
to info@wearebutik.com through Email Routing on **wearebutik.it**, sender
`form@wearebutik.it` (sending to a verified address is free on every plan).
Email Routing puts its MX records on the zone apex, so it cannot run on
wearebutik.com, whose mail is on Google. It stores nothing. Deploy:
`.github/workflows/deploy-functions.yml`.

### 3. Supabase (edge functions + Postgres/Storage/Auth)

When you need **persistent state**: database, authentication, file storage.

- ✅ Full opensource backend, relational DB, auth ready.
- ❌ Heavier; only worth it if the data need justifies it.

## How to choose

1. **Is there a managed service that covers it well?** → use that (option 1).
2. **Just lightweight stateless logic?** → Cloudflare Worker (option 2).
3. **Need persistent state (data, auth, files)?** → Supabase (option 3).

Cross-cutting rules:

- The function is **isolated and replaceable**: the client calls it behind a clear
  interface, so switching provider is a local change.
- Secrets don't end up in the client bundle (only public-by-design keys, like
  the Turnstile site key, may).
- If a choice repeats across features and becomes "the way butik does X", stop
  deciding it case by case and write an **ADR**.
