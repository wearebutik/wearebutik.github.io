# Marketing onboarding: Sanity, draft preview and brand voice with Claude

> Recommendation, not an enforced rule. Context: whoever writes the site copy
> works in Sanity and changes the brand voice through Claude, without knowing
> git. The rules Claude follows live in [`CLAUDE.md`](../../CLAUDE.md)
> (*Editing the product marketing context*, *Writing site copy in Sanity*).

A new person on the marketing team ends the onboarding able to:

1. **write and publish copy** in the Sanity Studio
   (https://butik.sanity.studio);
2. **see their drafts on the real site** before publishing, on
   https://butik.consiglio.fyi or in the Studio's **Anteprima web** tab;
3. **have Claude draft copy** straight into Sanity, from Claude Desktop
   through the Sanity connector;
4. **change the brand voice** — the sections *Brand Voice* and *Customer
   Language* of [`.agents/product-marketing.md`](../../.agents/product-marketing.md),
   which Claude reads before writing any copy — through a pull request that a
   developer reviews.

Points 1–3 need only a browser and Claude Desktop. Point 4 also needs the
repository on the Mac, which Claude sets up in the **Code** tab (part 4).

## 1. The admin prepares the accounts

| Account | Where | What to give |
|---|---|---|
| Sanity | sanity.io/manage → project *butik* (`uvzsc0vv`) → *Members* → *Add members* | An invitation to the person's `@wearebutik.com` e-mail. *Editor* is enough to write and publish; *Administrator* also manages members, tokens and settings. Membership is also what opens the draft preview. |
| Claude | The person's Claude account | Access to Claude Desktop and to the Sanity connector; the **Code** tab for point 4. |
| GitHub | github.com/orgs/wearebutik → *People* → *Invite member* | Only for point 4: membership with write access to `wearebutik/wearebutik.github.io`, needed to open pull requests. The person creates a GitHub account first if they have none. |

## 2. Sanity and the draft preview, in the browser

1. **Sanity.** Open the invitation e-mail and accept it, signing in with
   **Google** and the `@wearebutik.com` account. Every Sanity login method
   (Google, GitHub, e-mail) is a separate Sanity user: the Studio and the
   connector must use the same one. Then open https://butik.sanity.studio and
   check that the documents are there.
2. **Draft preview.** Open https://butik.consiglio.fyi and sign in to
   Sanity with the same method as the Studio: the browser keeps the session.
   It is the site with every draft of the project, at the same paths as the
   public site (`/`, `/servizi/<slug>`, `/progetti/<slug>`, `/chi-siamo`…).
   Bottom left, "Bozze di <name> · esci" says whose session it uses. A new
   draft shows after a reload of the page; a dark strip at the bottom lists
   drafts with required fields left empty. This is the preview to use when
   Claude writes the copy.
3. **Draft preview in the Studio.** For copy written by hand, the Studio's
   **Anteprima web** tab shows the same preview next to the form: it follows
   the drafts while they change, and with **Edit** on a click on a text opens
   its field. The Studio's perspective menu (*Drafts*, *Published*, a
   release) changes what the tab shows. If the tab stays on "Unable to
   connect", or shows the site as
   it was before a change to its code, the reload button in the tab's address
   bar loads the preview again.

## 3. Claude Desktop with the Sanity connector

1. **Claude Desktop.** Install it from https://claude.ai/download and sign in.
2. **Sanity connector.** *Settings → Connectors* → add **Sanity** and
   authorize it with the same Google account as the Studio. Claude can then
   read and write drafts in the butik project.
3. **Block publishing.** In the connector's tool permissions, block
   `publish_documents`, `unpublish_documents`, `discard_drafts` and
   `version_discard`, or set them to ask every time if blocking is not
   offered. Publishing a document publishes all of its draft, including copy
   still under review: it stays in the Studio, done by the person.
4. **A project for the copy.** Create a Claude project *butik — testi del
   sito*. Add [`.agents/product-marketing.md`](../../.agents/product-marketing.md)
   to its files (the voice and the audience) and paste the instructions
   below. After a brand-voice change (part 4), replace the file in the
   project with the new version.

````text
Scrivi i testi del sito di butik nel progetto Sanity "butik" (uvzsc0vv, dataset production) con il connettore Sanity. Parlami in italiano.

- Prima di scrivere leggi voce e pubblico da product-marketing.md, nei file del progetto.
- Scrivi solo bozze (create_documents, patch_documents). Non pubblicare, non ritirare e non scartare mai niente: la pubblicazione la faccio io dallo Studio, e pubblicare un documento pubblica tutta la sua bozza.
- Cambia solo i campi di testo. Lascia come sono slug, link (i campi …Href), valori a scelta fissa (heroVariant), categorie, id dei filtri, immagini e indirizzi e-mail.
- Alla fine dimmi quali documenti e quali campi hai cambiato, con il testo prima e dopo.
- Poi aprimi nel browser la pagina dell'anteprima dove si vede il testo cambiato, su https://butik.consiglio.fyi, con lo stesso percorso del sito pubblico: / per la home, /servizi/<slug> per un servizio, /progetti/<slug> per un progetto, /chi-siamo, /contatti, /partners per le altre pagine. Se compare la pagina "Anteprima delle bozze", dimmi di fare il login a Sanity con lo stesso metodo dello Studio e aspettami; poi ricarica la pagina e mostrami il testo nuovo.
- Ricordami che per pubblicare devo aprire il documento nello Studio (https://butik.sanity.studio) e premere Publish.
````

## 4. The brand voice: the repository on the Mac

Changing the brand voice is a pull request on the repository: Claude works
on it in the **Code** tab of Claude Desktop, in a clone on the Mac. Open the
**Code** tab, choose the home folder, and paste the prompt below, replacing
`<nome>` and `<email>`. It is in Italian, the language the person works in.

What gets installed and why:

- **Xcode Command Line Tools** — provide `git`, which Claude uses to work on
  the repository;
- **Homebrew** and **GitHub CLI** (`gh`) — the GitHub login and the pull
  requests;
- **the repository**, cloned into `~/butik/wearebutik.github.io` — the folder
  where Claude works on the brand voice.

````text
Ciao Claude, sono <nome> di butik (<email>). Non sono una sviluppatrice o uno sviluppatore: guidami un passo alla volta, spiegami in parole semplici cosa stai per fare e chiedimi conferma prima di ogni comando che installa qualcosa o modifica file. Quando un passo lo devo fare io (una password, un clic nel browser), dimmelo chiaramente e aspettami. Parlami in italiano.

Sto facendo l'onboarding del marketing di butik. Alla fine voglio saper aggiornare il tone of voice di butik con il tuo aiuto.

## Passo 1: gli strumenti
Controlla cosa c'è già e installa solo quello che manca, uno alla volta:
- Xcode Command Line Tools (`xcode-select --install`): mi danno git. Si apre una finestra di macOS in cui devo cliccare io.
- Homebrew (https://brew.sh): mi chiederà la password del Mac, la scrivo io nel terminale. Alla fine segui le istruzioni che stampa per aggiungerlo al PATH.
- GitHub CLI: `brew install gh`, poi `gh auth login` (GitHub.com, HTTPS, login via browser) e `gh auth setup-git`. Controlla con `gh auth status`.

## Passo 2: la cartella di lavoro
- Crea la cartella ~/butik e clona dentro il repository del sito con `gh repo clone wearebutik/wearebutik.github.io`.
- Lavora dentro ~/butik/wearebutik.github.io e leggi prima CLAUDE.md e docs/guidances/marketing-setup.md.

## Passo 3: il tone of voice
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

- **Writing copy.** Write in the Studio with the **Anteprima web** tab open;
  publish from the Studio. A publish rebuilds and deploys the site by itself
  within a few minutes
  ([ADR-0004 *Publishing*](../adr/0004-content-architecture.md)).
- **Copy drafted by Claude.** Ask in the *butik — testi del sito* project in
  Claude Desktop: Claude writes drafts, says which documents and fields it
  changed and opens the page on https://butik.consiglio.fyi. Publish from
  the Studio. A chat outside the project has none of its instructions: ask it
  explicitly for drafts, never to publish.
- **Changing the brand voice.** Open the Code tab in
  `~/butik/wearebutik.github.io` and ask for the change. Claude brings the
  folder up to date with `main`, prepares the change on a new branch and
  opens a pull request; a developer reviews and merges it. Once merged,
  replace `product-marketing.md` in the Claude project.

## Discarded directions

- **`butik-anteprima`, the preview binary on the Mac.** It needs a download,
  a terminal and Chrome's local network permission, and it runs only on
  Apple Silicon. The preview in the browser replaces it
  ([ADR-0004 *Draft preview*](../adr/0004-content-architecture.md)).
