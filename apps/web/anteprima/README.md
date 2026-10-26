# butik-anteprima

The butik site with your Sanity drafts, on your Mac. Open the Studio's
**Presentation** tab to see the page you are editing as it will look once
published. Why and how it is built: `docs/adr/0004-content-architecture.md`
(*Draft preview*).

## Install (macOS, Apple Silicon)

```sh
mkdir -p ~/.local/bin
curl -fL -o ~/.local/bin/butik-anteprima \
  https://github.com/wearebutik/wearebutik.github.io/releases/download/anteprima/butik-anteprima-macos-arm64
chmod +x ~/.local/bin/butik-anteprima
```

Download it with `curl`, not the browser: a file downloaded by the browser is
quarantined by macOS (`xattr -d com.apple.quarantine <file>` releases it).
`~/.local/bin` must be on `PATH`.

To update, run the same `curl` again: the link always points to the latest
build.

## Use

```sh
butik-anteprima login     # once: opens the browser to sign in to Sanity
butik-anteprima           # serves the preview on http://localhost:4321
```

- `login` opens Sanity's login page: choose the same method you use for the
  Studio (Google, GitHub, email or SSO), since each one is a different Sanity
  user. `--provider google|github|sanity` skips the choice. The token is
  stored in `~/.config/butik-anteprima/config.json`; run `login` again when
  the binary says it has expired.
- `--port` changes the port; the Studio's Presentation tab expects `4321`.
- Without a login the preview shows published content only.

## In the Studio

Open the **Presentation** tab with the preview running:

- the page reloads by itself a moment after you stop typing;
- with **Edit** on, hovering a text outlines it and a click opens its field
  in the form next to the page;
- the panel lists the documents shown on the page, and following a link in
  the preview moves the Studio along.

A text the code splits (the underlined last word of a headline) is outlined
only on the part that carries the field reference.

The preview skips image optimization and has no blurred placeholders, social
cards, cookie banner or analytics: everything else is the site's own code.

## Build it locally

```sh
pnpm --filter @butik/web build:anteprima   # → apps/web/dist-anteprima/butik-anteprima
```

Needs Bun (version in `.tool-versions`).
