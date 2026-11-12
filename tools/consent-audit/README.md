# consent-audit — il consenso controllato dal vivo

Apre il sito con un browser pulito e verifica, per ogni scelta sul banner dei cookie, che quello che il sito scrive coincida con quello che dichiara (issue #22, ADR-0006):

| Scenario | Cosa deve risultare |
|---|---|
| Prima di qualunque scelta | banner visibile, nessun cookie, niente PostHog nello storage |
| "Accetta tutti" | ogni cookie scritto compare nella tabella delle preferenze, e ogni cookie della tabella viene scritto |
| "Rifiuta" | solo `cc_cookie`, niente PostHog nello storage |
| Accetta, poi revoca dal footer | solo `cc_cookie`, niente PostHog nello storage |

I cookie dichiarati si leggono dalla **tabella che il banner mostra alle persone**, non da un elenco a parte: se la tabella e il sito divergono, il controllo fallisce.

## Uso

Playwright non è una dipendenza del repo (come per `tools/visual-diff`): lo si punta da fuori.

```sh
export PLAYWRIGHT_PATH=/percorso/a/node_modules/playwright/index.js
node tools/consent-audit/audit.mjs https://beta.wearebutik.com/
```

Esce con codice 1 se un controllo non passa. Gli eventi verso PostHog sono bloccati, quindi le prove non finiscono nei dati.

Da lanciare quando cambia qualcosa nel banner, in PostHog o nei tag di GTM: un tag nuovo che scrive cookie deve comparire anche nella tabella (`COOKIE_*` in `apps/web/src/lib/consent/config.client.ts`).

La libreria del banner non si mostra ai browser che si dichiarano automatici (`hideFromBots`): il controllo si presenta come un browser normale (`--disable-blink-features=AutomationControlled`).
