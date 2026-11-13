# PDR-0007: AI assistants may read the site, model training may not

- Status: accepted
- Date: 2026-11-13
- Reviewers: Gabriele Consiglio

## Context

People increasingly find organisations through AI assistants (ChatGPT
search, Claude, Perplexity, Google's AI answers) as well as through search
engines. These assistants send two kinds of crawler: one that fetches pages to
answer a question and cites the source, and one that collects text to train
future models, with no citation and no visit back. `robots.txt` can treat
them differently, and Cloudflare can block AI crawlers at the edge on its own
(AI Crawl Control, managed `robots.txt`). Issue #103.

## Decision

- **Search and answer crawlers read everything**, like search engines: no
  rule of their own, the `User-agent: *` group allows all
  (`OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`,
  `PerplexityBot`, Googlebot for Google's AI answers).
- **Training crawlers are disallowed**, one group each: `GPTBot`,
  `ClaudeBot`, `anthropic-ai`, `Google-Extended`, `Applebot-Extended`,
  `CCBot`, `Meta-ExternalAgent`, `Bytespider`,
  `cohere-training-data-crawler` (`apps/web/src/lib/seo/robots.ts`).
- **`/llms.txt`** presents butik to agents: a short description written in
  the Studio («Descrizione per gli agenti AI», elementi del sito), then
  services, projects, pages and contacts generated from the content at build
  time (`apps/web/src/lib/seo/llms.ts`).
- **The repository holds the only policy.** Cloudflare's AI Crawl Control and
  managed `robots.txt` stay off on `wearebutik.com`.

## Rationale

- Allowing every AI crawler: butik's texts would feed model training with no
  citation and no visit in return.
- Blocking every AI crawler: butik would disappear from the answers of the
  assistants people use to find partners.
- Letting Cloudflare manage the policy: rules outside the repository, not
  reviewed, and able to override the `robots.txt` the site serves.

## Consequences

- \+ butik can be found and cited by AI assistants, with a curated
  description in `llms.txt`.
- \+ One place to change the policy: `robots.ts`, reviewed like any code.
- − `robots.txt` is a request, not a lock: a crawler that ignores it still
  reads the site.
- − New training crawlers appear over time: the list needs a yearly look
  (issue #169 checks it a month after the go-live).
