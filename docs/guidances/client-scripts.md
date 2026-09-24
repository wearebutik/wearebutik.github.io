# Client scripts under the view-transitions router

> Recommendation, not an enforced rule. Context: `apps/web/src/layouts/BaseLayout.astro`
> renders `<ClientRouter />` (Astro view transitions) on every page.

## The rule

A component `<script>` in Astro is bundled as an ES module, and **an ES module
executes once per browser session**. The view-transitions router replaces the
DOM on every client-side navigation without reloading the page, so the module
does **not** run again — while the elements it captured are swapped for fresh
nodes.

The listener survives. The node it points at does not. Nothing throws.

So: **anything a `<script>` wires up must be re-wired on `astro:page-load`.**

```astro
<script>
  function initThing() {
    const el = document.getElementById('thing');
    if (!el) return;
    // …wire up listeners, observers, initial state
  }

  document.addEventListener('astro:page-load', initThing);
</script>
```

`astro:page-load` fires on the first load *and* after every client-side
navigation, so it replaces — not supplements — a bare top-level call.

## Idempotence

`initThing()` may run more than once against the same node (the event can fire
without a DOM swap). Two cases, two different answers:

- **Fresh node every time** — re-querying from scratch is enough; the old
  listeners go away with the old nodes.
- **The node may survive** — guard, or you double-bind. A dataset flag is
  enough, and it works precisely because it lives in the mutated DOM, not in
  the HTML the router re-inserts:

  ```js
  if (form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';
  ```

Double-binding is worst where a handler has side effects beyond the page. A
duplicated `trackEvent` is a silently wrong number in the analytics funnel — it
does not look like a bug from the code.

Long-lived observers (`IntersectionObserver`, `ResizeObserver`) that are
re-created per navigation should be disconnected on `astro:before-swap`, or
guarded the same way, so they stop observing detached nodes.

## Prefer deleting the script

The best fix for this class of bug is not having client state at all. It also
keeps the site closer to static-first ([ADR-0002](../adr/0002-runtime-and-delivery.md)).

Before writing an init function, check whether the behaviour has a CSS or
native-HTML form:

- disclosure / dropdown / accordion → `<details>` + `<summary>`;
- state driven by scroll position → a scroll-driven animation on a registered
  custom property (see the browser-support note in
  [design-approach.md](design-approach.md#browser-support));
- state driven by an element entering the viewport → `animation-timeline: view()`.

The header's scroll state went this way: it is a scroll-driven animation, with no
init function to forget. Its mobile menu is a native `<details>`.

## When a script is the right tool

Some behaviour has no CSS form yet, and a short script is the honest answer:

- **Run once, when an element first enters the viewport** —
  `@butik/ui/reveal`, armed by `BaseLayout`. A scroll-driven animation replays
  and reverses with the scroll; "once" needs an `IntersectionObserver`. It binds
  to the fresh `<main>` on every `astro:page-load` (a dataset flag guards
  re-entry) and disconnects on `astro:before-swap`.
- **Side effects outside the component** — the mobile menu in `Header.astro`
  locks page scroll, makes the page behind it `inert` and closes on Escape. A
  global side effect (`documentElement.style.overflow`) must be undone on
  `astro:before-swap`, or the next page inherits it.

The rule above still holds: re-wire on `astro:page-load`, guard what may
survive, tear down what outlives the page.

## Paths built in client code

The site is also published under `/b/` (version B, ADR-0004). Internal links in
the HTML are prefixed after the build, but a path assembled in client JS is not:
build it with `BASE` from `#lib/versione` (as the consent banner does in
`lib/consent/config.client.ts`), or read it from an `href` already in the DOM.

## Why this is written down

This failure mode is invisible in review and in the build. It produced three
separate bugs in a single PR — a header that stopped changing colour, carousel
dots that stopped responding, and a newsletter form whose conversion event
stopped firing — and each was diagnosed from scratch.
