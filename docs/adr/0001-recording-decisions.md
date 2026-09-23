---
status: accepted
date: 2026-07-10
tags: [process, adr, guidances]
---

# ADR-0001: Recording decisions

## Context

butik's architectural decisions need a home that travels with the repo. A single
large architecture document is hard to consume incrementally (by humans and AI
agents alike) and mixes decisions of very different weight and age in one place. Small,
separately addressable records are needed instead. At the same time the project
should start from a *small, coherent* set of decisions — not a long list of
granular records to reconstruct in your head.

## Decision

Record architectural decisions as **numbered ADRs** in `docs/adr/`, in **MADR**
format ([`template.md`](./template.md)): YAML frontmatter (`status`, `date`,
`deciders`, `tags` — machine-readable, so ADRs can be searched and filtered by
tag) and the sections Context / Decision / Alternatives considered / Consequences
(Positive · Negative / accepted risks · When to deviate), numbered sequentially
(`0001`, `0002`, …).

An ADR may be **thematic**: related decisions live in one file under `## `
sections (e.g. `0005-design-system.md` covers tokens, CSS Modules, component
workshop). Reference a specific decision by file + heading anchor, e.g.
`docs/adr/0005-design-system.md#css-modules`.

**ADRs are living documents.** An ADR states the decision in force. When a
decision changes, its ADR is edited in place to describe the new decision — the
old text is not kept alongside it, and git history is the record of how it
evolved. A new ADR is written only for a genuinely new topic. Where the
alternatives a reader would otherwise propose again are worth keeping, they live
under *Alternatives considered*, each with the reason it does not hold.

**Guidances vs ADRs.** Practices the project does **not** fix as a decision —
choices that depend on the specific feature (e.g. which serverless runtime to use
for a dynamic function) or design vocabulary a linter can't verify — live in
`docs/guidances/`, separate from the ADRs. A guidance becomes an ADR once the
decision is actually made and holds for the whole site.

**Product decisions.** Product/design choices are many and frequent: they get
their own granular space in `docs/product/decisions/` (PDRs), not here.

## Consequences

### Positive

- A newcomer starts from a small set of thematic ADRs readable in one sitting (or
  loadable into an AI context), plus clearly-labelled guidances.
- `CLAUDE.md` and code comments point to specific ADR sections instead of a
  monolith.
- Guidances never masquerade as decisions already made.

### Negative / accepted risks

- Recording a decision is a manual discipline; nothing enforces it. Review must
  ask "does this change need an ADR — or a guidance?".

### When to deviate (revisit triggers)

- If the thematic ADRs grow past being readable in one sitting, reorganize the
  taxonomy (a new ADR that declares it).
