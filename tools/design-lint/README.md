# design-lint — le regole di design che uno script può verificare

Fa fallire la CI sulla parte meccanica delle regole di design
([ADR-0005 `#design-tokens`](../../docs/adr/0005-design-system.md#design-tokens),
[design-approach](../../docs/guidances/design-approach.md)). Il resto, cioè il ruolo
di un'etichetta o il contrasto del testo su una foto, lo giudica in review la skill
`design-check`.

```sh
pnpm lint:design
```

Non ha dipendenze: gira con il solo Node. Legge `apps/web/src` e `packages/ui/src`:
i `*.css`, i `<style>` dei `.astro`, e per i rossi anche `.ts`/`.tsx`. Salta le
storie e `pages/lab/`, che è sperimentale.

## Le regole

| Regola | Fallisce su | Correzione |
|---|---|---|
| `red-hex` | `#e21929` o `#cc1523` scritti a mano | il token del ruolo: `--color-accent`, `--color-accent-text`, `--color-accent-fill` |
| `red-as-text` | `color: var(--color-accent)` o `var(--color-butik-red)` | testo rosso → `--color-accent-text` |
| `small-caps` | una regola CSS con la ricetta del maiuscoletto (font display, `--font-size-xs`, uppercase, 0.1em) fuori da `Eyebrow` e `MetaLabel` | apre una sezione → `Eyebrow`; metadato → `MetaLabel` |

I rossi scritti a mano sono ammessi in `packages/ui-tokens/tokens.css`, dove sono
definiti, e in `apps/web/src/lib/og/render.ts`, dove Satori non legge le custom
property.

## Eccezioni dichiarate

Un caso legittimo si dichiara nella regola CSS stessa, con la ragione:

```css
.card__icon {
  /* design-lint-disable red-as-text: filigrana SVG, non testo */
  color: var(--color-accent);
}
```

- **`red-as-text`:** i glifi (icone SVG in `currentColor`, stelle, spunte, pallini)
  sono il ruolo del rosso di brand. La dichiarazione dice che non è testo.
- **`small-caps`:** CTA, bottoni, voci di navigazione, link, chip ed etichette di
  form usano la stessa tipografia dei due atomi, con un altro ruolo. La guidance
  li elenca in `#two-small-caps-roles`. La dichiarazione nomina il ruolo.

Per `red-hex` basta il commento sulla stessa riga.

## Limiti

- Il fondo rosso che porta testo (`background: var(--color-accent)` sotto un testo
  bianco) non si riconosce senza sapere cosa c'è sopra: resta a `design-check`.
- Il parser prende le regole CSS senza graffe annidate. Basta per CSS Modules e
  `<style>` di Astro, non per CSS annidato nativo.
- Stylelint, quando si chiude il linter di ADR-0003, può ospitare le stesse regole
  come plugin.
