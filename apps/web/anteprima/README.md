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
butik-anteprima           # sign in to Sanity, then the preview runs on http://localhost:4321
```

- Every start opens Sanity's login page in the browser: choose the same
  method you use for the Studio (Google, GitHub, email or SSO), since each
  one is a different Sanity user. `--provider google|github|sanity` skips the
  choice.
- The Sanity session lives only while the preview runs: nothing is written
  to disk, and stopping the preview (Ctrl+C, or closing the terminal) revokes
  it. A preview killed without warning leaves its session open until Sanity
  expires it; it can be closed from the sessions of your Sanity account.
- `butik-anteprima logout` revokes and deletes the token that the first
  version of the preview saved in `~/.config/butik-anteprima/config.json`.
- `--port` changes the port; the Studio's Presentation tab expects `4321`.
- `SANITY_AUTH_TOKEN` skips the login (for scripts and CI); that token is
  never revoked by the preview.

## In the Studio

Open the **Presentation** tab with the preview running:

- the page reloads by itself a moment after you stop typing;
- with **Edit** on, hovering a text outlines it and a click opens its field
  in the form next to the page;
- the panel lists the documents shown on the page, and following a link in
  the preview moves the Studio along.

A text the code splits (the underlined last word of a headline) is outlined
only on the part that carries the field reference.

If the tab shows a grey page with "Unable to connect", the preview is not
running: start `butik-anteprima` and reload the tab. The first time, Chrome
asks the Studio for permission to reach apps on this device (local network):
allow it, or the preview stays blank.

A draft whose fields the site cannot accept (a required field left empty,
for instance) does not break the page: the preview shows the published
version of that document, or leaves it out if it was never published, and a
dark strip at the bottom lists the document and the fields to fix.

The preview skips image optimization and has no blurred placeholders, social
cards, cookie banner or analytics: everything else is the site's own code.

## Build it locally

```sh
pnpm --filter @butik/web build:anteprima   # → apps/web/dist-anteprima/butik-anteprima
```

Needs Bun (version in `mise.toml`).
