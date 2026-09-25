---
name: story-check
description: Check that every @butik/ui component has Storybook stories for the states the site actually reaches — prop combinations, context hooks, empty data, hover/focus, photo backgrounds, arrival states. Report-only, never edits files. Use when asked to audit component-catalogue coverage, AND as part of code/PR review when components or their call sites change (see CLAUDE.md).
---

# Storybook coverage check

Produce a **report** on whether the states of the shared components are shown in
the workshop. The workshop is **Storybook**, scoped to `packages/ui`
([ADR-0008](../../../docs/adr/0008-component-authoring-and-storybook.md)); stories
sit next to the component (`*.stories.tsx`). Do **not** edit files.

The rule: **every state of a `@butik/ui` component that the site can reach has a
story.** A state nobody sees in the workshop is a state nobody reviews, and
Chromatic cannot catch its regressions.

## What to look at

In a PR review, check the diff **and the code that landed on the base branch
while the PR was open**: a new call site in `apps/web` can reach a state of a
component the PR never touched.

## Procedure

1. **Enumerate the components**: `packages/ui/src/{atoms,molecules,organisms}/**/*.tsx`
   (excluding `*.stories.tsx`) and the exports in `packages/ui/package.json`.
2. **Find the reachable states** from the call sites in `apps/web/src/**`
   (`grep -rn "@butik/ui/<Name>"`), for each component:
   - **Props**: every value and combination used, including fallbacks (an
     invalid tone × variant) and optional props left out.
   - **Context hooks**: custom properties the site sets around the island
     (`--accent`, `--accent-ink`, `--meta-label-color`, `--arrow-link-accent`…),
     with the real pairs the call site uses.
   - **Data edges**: empty lists, a single item, the longest list the content
     allows (e.g. every social network the Sanity schema accepts), long text,
     portrait images.
   - **Backgrounds**: light, dark, and a photograph when the site puts the
     component on one. A bright photo for text over images.
   - **Interaction**: hover and focus-visible, forced with
     `storybook-addon-pseudo-states` (`parameters.pseudo`); intermediate states
     reached by clicking (a `play` function).
   - **Arrival and motion states** set by the site (`data-morph`,
     `trigger="load"`), and viewports where layout changes (`globals.viewport`).
   - **`className` hooks**: the story shows the effect on a background where it
     is visible, and a `play` checks the class is merged.
3. **Map coverage** against the `*.stories.tsx` of each component.
4. **Stale**: stories for props, states or components that no longer exist.

## Output format

```
# Storybook coverage

## Missing states
- <Component> — <state>. Reached at: path:line. Add: <StoryName> (args / decorator / pseudo).

## Stories that don't show their state
- <Component>/<Story> — <why it looks identical to another story>. Fix: …

## Stale stories
- <Component>/<Story> — <prop/state no longer exists>.

## Covered (brief)
- <Component>: <stories>.
```

Severities: **warning** (a reachable state with no story, a story that does not
show its state), **note** (stale story, optional edge case).
