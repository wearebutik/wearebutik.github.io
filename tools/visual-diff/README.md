# visual-diff — verifica di parità visiva fra due build

Confronta due build statiche del sito pagina per pagina, a tre viewport, e dice
se e **quanto** differiscono. Serve ai refactor che non devono cambiare niente a
video: la migrazione Tailwind → CSS scoped (issue #46), la sostituzione di un
componente con la sua isola, il porting di uno stile ai token.

## Perché esiste

Il primo tentativo di sweep Tailwind è passato dalla build senza un errore e ha
comunque rotto il footer su tutte le pagine, oltre a spostare di decine di pixel
la spaziatura in metà del sito. `astro build` verifica che il codice sia valido,
non che il risultato sia lo stesso. Questo strumento verifica la seconda cosa.

## Uso

Playwright non è una dipendenza del repo — non serve al sito, e installarlo
peserebbe su ogni `pnpm install`. Lo si punta da fuori:

```sh
export PLAYWRIGHT_PATH=/percorso/a/node_modules/playwright/index.js
```

Poi si costruiscono le due versioni e le si confronta:

```sh
# 1. build di riferimento, da un worktree sul commit di partenza
git worktree add ../baseline <commit> --detach
pnpm --dir ../baseline install
pnpm --dir ../baseline/apps/web exec astro build

# 2. build con le modifiche
pnpm --filter @butik/web build

# 3. cattura e confronto
node tools/visual-diff/capture.mjs ../baseline/apps/web/dist apps/web/dist /tmp/vdiff
node tools/visual-diff/compare.mjs /tmp/vdiff
```

`capture.mjs` salva solo le coppie che non coincidono; `compare.mjs` le misura.

## Leggere l'esito

```
pagina                        altezza b/a    diff%   forte%   banda Y
mobile_progetti_                3539→3579   28.350   16.440   548–3578
tablet_partners_                     2752    0.597    0.473   330–2130
```

- **altezza b/a** — se cambia, è una regressione di spaziatura: qualcosa ha un
  margine, un padding o un `gap` diverso da prima. È il segnale più netto.
- **forte%** — percentuale di pixel con scarto > 90 su 765. Sotto lo 0.05% è
  tipicamente antialiasing del testo; sopra è una differenza che si vede.
- **banda Y** — prima e ultima riga in cui cade una differenza, per capire subito
  se è l'header, il corpo o il footer senza aprire le immagini.

Le coppie `<pagina>.before.png` / `<pagina>.after.png` restano nella cartella
degli esiti: quando i numeri dicono che qualcosa non va, si guardano quelle.

## Limiti

- Le animazioni vengono congelate con un `<style>` iniettato e il browser gira in
  `reducedMotion: 'reduce'`, ma un carosello che parte su timer può comunque
  cogliere fotogrammi diversi: se una pagina risulta diversa solo in una fascia
  che contiene un carosello, ricontrolla prima di crederci.
- Confronta solo lo stato a riposo. Hover, focus e stati aperti non sono coperti.
- L'elenco delle pagine è cablato in cima a `capture.mjs`: se ne aggiungi una al
  sito, aggiungila lì.
