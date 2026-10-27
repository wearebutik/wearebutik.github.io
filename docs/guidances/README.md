# Guidances

Recommendations for the site, **not** mechanically enforced. Two kinds, each
opening with a banner that says which:

- **Per-feature choice** — decisions we don't fix globally because they depend on
  the concrete case (e.g. which serverless runtime for a given dynamic function).
  When a choice becomes stable and holds for the whole site, record it as an
  [ADR](../adr/README.md).
- **Recommended, not enforced** — design practices a linter can't mechanize (the
  design vocabulary), to apply within the decided boundaries.

| Guidance | Kind | Covers |
|---|---|---|
| [Functions](./functions.md) | per-feature choice | Where dynamic logic goes: Cloudflare Workers, Supabase, managed services |
| [Design approach](./design-approach.md) | recommended | Tokens as source of truth, CSS Modules, AA accessibility, motion |
| [Product decisions](./product-decisions.md) | recommended | How to write PDRs in `docs/product/` and take them to review |
| [Client scripts](./client-scripts.md) | recommended | Component `<script>` under `<ClientRouter />`: re-init on `astro:page-load`, idempotence, when to drop the script |
| [Marketing onboarding](./marketing-setup.md) | recommended | Accounts, draft preview and brand-voice changes for the marketing team, with the Claude Desktop prompt that sets up the Mac |

See [ADR-0001](../adr/0001-recording-decisions.md) for how guidances relate to ADRs.
