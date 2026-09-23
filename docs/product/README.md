# Product decisions

The **granular log of product & design decisions** — one file per call. This is
deliberately what the [ADRs](../adr/README.md) are *not*: ADRs are a small,
thematic foundation to start aligned
([ADR-0001](../adr/0001-recording-decisions.md) — "a small, coherent set … not a
long list of granular records"). Product choices are many and frequent, so they
get their own space.

| Space | Holds | Nature |
|---|---|---|
| [`../adr/`](../adr/README.md) | architectural decisions | few, thematic, kept current |
| **`decisions/`** | product/design decisions (PDR) | many, granular, source of truth |
| [`../../reference/`](../../reference/README.md) | raw input (legacy, dumps, prototypes) | read-only history, quarantined |

## Writing a PDR

1. Copy [`decisions/template.md`](./decisions/template.md) to
   `decisions/NNNN-short-kebab-title.md` (next free number). Or let the
   `product-decision` skill scaffold it.
2. Keep it short: Context, Decision, Rationale, Consequences. Link the
   `reference/` material it draws on.
3. PDRs are **append-only** — don't rewrite an accepted decision to mean something
   else; write a new one and mark the old `superseded by PDR-NNNN`.

For the *how* of writing and reviewing a PDR (including the review surface) see the
[product-decisions guidance](../guidances/product-decisions.md).
