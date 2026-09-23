# Architecture Decision Records

butik's architectural decisions are recorded as ADRs — **thematic**, one file per
area, in [MADR](./template.md) format (YAML frontmatter with
`status`/`date`/`deciders`/`tags` for search, then Context / Decision /
Alternatives considered / Consequences). See
[ADR-0001](./0001-recording-decisions.md) for the process (including how ADRs
relate to the [`../guidances/`](../guidances/README.md) recommendations).

| ADR | Title | Status |
|---|---|---|
| [0001](./0001-recording-decisions.md) | Recording decisions | accepted |
| [0002](./0002-runtime-and-delivery.md) | Runtime and delivery | accepted |
| [0003](./0003-build-and-tooling.md) | Build and tooling | accepted |
| [0004](./0004-content-architecture.md) | Content architecture | accepted |
| [0005](./0005-design-system.md) | Design system | accepted |
| [0006](./0006-analytics-and-consent.md) | Analytics and consent | accepted |
| [0007](./0007-monorepo-and-workspace-layout.md) | Monorepo and workspace layout | accepted |
| [0008](./0008-component-authoring-and-storybook.md) | Component authoring and Storybook workshop | accepted |
| [0009](./0009-sitepins-media-paths.md) | Sitepins media path convention | accepted |
| [0010](./0010-motion-in-the-catalogue.md) | Motion lives in the component catalogue | accepted |

## Writing a new ADR

1. Copy [`template.md`](./template.md) to `NNNN-short-kebab-title.md` (next free
   number), or extend an existing thematic ADR with a new `## ` section.
2. Keep it short: Context (why a decision was needed), Decision (what we do),
   Alternatives considered (fairly represented), Consequences (positive,
   negative/accepted risks, and the triggers that reopen the decision). Fill the
   `tags` — that's what makes the log searchable.
3. ADRs are **append-only**: never rewrite an accepted decision to mean something
   different — write a new one and mark the old `superseded by ADR-NNNN`.
4. Add a row to the index above.

Choices that depend on the specific feature (which serverless runtime to use) or
design vocabulary a linter can't verify are **recommendations**, not decisions:
they live in [`../guidances/`](../guidances/README.md). **Product** decisions live
in [`../product/`](../product/README.md).
