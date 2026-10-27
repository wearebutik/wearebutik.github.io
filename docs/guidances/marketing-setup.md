# Marketing onboarding: Sanity, draft preview and brand voice with Claude

> Recommendation, not an enforced rule. Context: whoever writes the site copy
> works in Sanity and changes the brand voice through Claude, without knowing
> git. The rules Claude follows live in [`CLAUDE.md`](../../CLAUDE.md)
> (*Editing the product marketing context*, *Writing site copy in Sanity*).

A new person on the marketing team ends the onboarding able to:

1. **write and publish copy** in the Sanity Studio
   (https://butik.sanity.studio);
2. **see their drafts on the real site** before publishing, with
   `butik-anteprima` in the Studio's **Presentation** tab;
3. **have Claude draft copy** straight into Sanity, through the Sanity
   connector;
4. **change the brand voice** — the sections *Brand Voice* and *Customer
   Language* of [`.agents/product-marketing.md`](../../.agents/product-marketing.md),
   which Claude reads before writing any copy — through a pull request that a
   developer reviews.

The onboarding has three parts: what an admin prepares, what the person does
in the browser, and what Claude Desktop sets up on the Mac with the prompt
below.

## 1. The admin prepares the accounts

| Account | Where | What to give |
|---|---|---|
| Sanity | sanity.io/manage → project *butik* (`uvzsc0vv`) → *Members* → *Add members* | An invitation to the person's `@wearebutik.com` e-mail. *Editor* is enough to write and publish; *Administrator* also manages members, tokens and settings. |
| GitHub | github.com/orgs/wearebutik → *People* → *Invite member* | Membership with write access to `wearebutik/wearebutik.github.io`, needed to open pull requests. The person creates a GitHub account first if they have none. |
| Claude | The person's Claude account | Access to Claude Desktop with the **Code** tab, and to the Sanity connector. |

## 2. The person, in the browser

1. **Sanity.** Open the invitation e-mail and accept it, signing in with
   **Google** and the `@wearebutik.com` account. Every Sanity login method
   (Google, GitHub, e-mail) is a separate Sanity user: the Studio, the preview
   and the connector must all use the same one. Then open
   https://butik.sanity.studio and check that the documents are there.
2. **GitHub.** Accept the invitation to the `wearebutik` organization
   (from the e-mail or github.com/orgs/wearebutik).
3. **Claude Desktop.** Install it from https://claude.ai/download, sign in,
   and check that the **Code** tab is there.
4. **Sanity connector.** In Claude: *Settings → Connectors* → add **Sanity**
   and authorize it with the same Google account as in step 1. Claude can then
   read and write drafts in the butik project. Publishing stays in the Studio,
   done by the person.
5. **Chrome** is the browser for the Studio: the Presentation tab reaches the
   preview on the Mac only after Chrome's *local network* permission is
   granted (Chrome asks the first time).

## 3. Claude Desktop sets up the Mac

Open the **Code** tab of Claude Desktop, choose the home folder, and paste the
prompt below, replacing `<nome>` and `<email>`. It is in Italian, the language
the person works in. Claude installs the tools, the preview and the
repository, and walks through the first brand-voice change. A Mac with Apple
Silicon is needed: the preview binary is `macos-arm64`.

What gets installed and why:

- **Xcode Command Line Tools** — provide `git`, which Claude uses to work on
  the repository;
- **Homebrew** and **GitHub CLI** (`gh`) — the GitHub login and the pull
  requests;
- **`butik-anteprima`** — the draft preview, a single binary downloaded from
  the GitHub Release `anteprima`. It contains the site's code, not the copy:
  it reads the drafts from Sanity while the person writes, so publishing copy
  never requires a new download; a change to the site's code does. It holds
  no secret: every start asks for the Sanity login and revokes the session on
  exit. Details: [`apps/web/anteprima/README.md`](../../apps/web/anteprima/README.md),
  [ADR-0004 *Draft preview*](../adr/0004-content-architecture.md);
- **the repository**, cloned into `~/butik/wearebutik.github.io` — the folder
  where Claude works on the brand voice.

````text
Ciao Claude, sono <nome> di butik (<email>). Non sono una sviluppatrice o uno sviluppatore: guidami un passo alla volta, spiegami in parole semplici cosa stai per fare e chiedimi conferma prima di ogni comando che installa qualcosa o modifica file. Quando un passo lo devo fare io (una password, un clic nel browser), dimmelo chiaramente e aspettami. Parlami in italiano.

Sto facendo l'onboarding del marketing di butik. Alla fine voglio:
1. vedere sul mio Mac l'anteprima del sito con le bozze che scrivo su Sanity;
2. saper aggiornare il tone of voice di butik con il tuo aiuto.

## Passo 1: gli strumenti
Controlla cosa c'è già e installa solo quello che manca, uno alla volta:
- Xcode Command Line Tools (`xcode-select --install`): mi danno git. Si apre una finestra di macOS in cui devo cliccare io.
- Homebrew (https://brew.sh): mi chiederà la password del Mac, la scrivo io nel terminale. Alla fine segui le istruzioni che stampa per aggiungerlo al PATH.
- GitHub CLI: `brew install gh`, poi `gh auth login` (GitHub.com, HTTPS, login via browser) e `gh auth setup-git`. Controlla con `gh auth status`.

## Passo 2: la cartella di lavoro
- Crea la cartella ~/butik e clona dentro il repository del sito con `gh repo clone wearebutik/wearebutik.github.io`.
- Lavora dentro ~/butik/wearebutik.github.io e leggi prima CLAUDE.md e docs/guidances/marketing-setup.md.

## Passo 3: l'anteprima locale dei testi
Prima spiegami in breve come funziona, leggendo apps/web/anteprima/README.md e la sezione "Draft preview" di docs/adr/0004-content-architecture.md:
- `butik-anteprima` è un unico programma per Mac che contiene il codice del sito. Lo scarico dalla Release "anteprima" su GitHub, che si aggiorna da sola a ogni modifica del codice del sito: il link resta sempre lo stesso.
- Il programma non contiene i testi: le bozze le legge da Sanity mentre scrivo. Quindi non devo riscaricarlo quando pubblico qualcosa, solo quando il sito cambia (rilanciando lo stesso comando curl).
- Non contiene password: a ogni avvio mi chiede il login a Sanity e lo chiude quando lo fermo.

Poi:
- installa `butik-anteprima` come dice il README (scaricalo con curl, non dal browser) e controlla che ~/.local/bin sia nel PATH (se manca, aggiungilo a ~/.zshrc dopo avermelo chiesto);
- avvialo: si apre il login di Sanity, scelgo Google con il mio account @wearebutik.com, lo stesso che uso per lo Studio;
- dimmi di aprire in Chrome https://butik.sanity.studio, scheda **Presentation** (se Chrome chiede il permesso per i dispositivi della rete locale, devo consentirlo);
- spiegami come la uso: la pagina si aggiorna da sola mentre scrivo, con "Edit" clicco un testo e si apre il suo campo, una striscia scura in basso segnala i campi obbligatori vuoti; Ctrl+C nel terminale ferma l'anteprima;
- lasciami un promemoria di poche righe: quale comando lanciare, quale pagina aprire, come aggiornare il programma.

## Passo 4: il tone of voice
Il tone of voice è in `.agents/product-marketing.md`, sezioni **Brand Voice** e **Customer Language** (parole da usare e da evitare). È il contesto che Claude legge prima di scrivere i testi del sito.
- Leggimi le due sezioni in italiano, così capisco cosa c'è.
- Chiedimi se voglio cambiare qualcosa adesso. Se sì, fammi domande una alla volta (tono, parole da usare o evitare, esempi di frasi giuste e sbagliate), proponimi il nuovo testo e aspetta il mio ok.
- Segui le regole di CLAUDE.md, sezione "Editing the product marketing context" (branch `contesto/<argomento>`, versione e Changelog, PR in italiano semplice), e dammi il link della PR.
- Se non ho i permessi di scrittura sul repository, fermati e dimmi a chi chiederli.

## Regole generali
- Non pubblicare mai niente su Sanity per conto mio: puoi preparare bozze, la pubblicazione la faccio io dallo Studio.
- Se un comando fallisce, spiegami l'errore in parole semplici prima di riprovare.
````

## Day to day

- **Writing copy.** Write in the Studio with the preview running and the
  Presentation tab open; publish from the Studio. A publish rebuilds and
  deploys the site by itself within a few minutes
  ([ADR-0004 *Publishing*](../adr/0004-content-architecture.md)).
- **Copy drafted by Claude.** Ask Claude in the Code tab, in
  `~/butik/wearebutik.github.io`, to draft a text: there it reads the voice
  from `.agents/product-marketing.md`, writes drafts only (the publish tools
  are denied by `.claude/settings.json`) and says which documents and fields
  it changed. Review them in the Presentation tab and publish from the Studio.
  A plain chat with the Sanity connector has none of these rules: ask it
  explicitly for drafts, never to publish.
- **Updating the preview.** Ask Claude in the Code tab to download
  `butik-anteprima` again, or run the same `curl` from the README.
- **Changing the brand voice.** Open the Code tab in
  `~/butik/wearebutik.github.io` and ask for the change. Claude brings the
  folder up to date with `main`, prepares the change on a new branch and
  opens a pull request; a developer reviews and merges it.
