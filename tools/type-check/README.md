# type-check — controllo dei tipi di Astro con TypeScript 7

Fa quello che fa `astro check`, che però accetta solo TypeScript fino alla 6.
Lo lancia `pnpm --filter @butik/web check`, insieme a `astro sync` e al
controllo del CLI dell'anteprima; `pnpm check` dalla radice controlla anche
lo Studio.

## Come funziona

1. Ogni `.astro` di `src/` diventa TSX con `@astrojs/astro2tsx`, lo stesso
   convertitore del language server di Astro, in `apps/web/.tipi/` (ignorata
   da git). Gli `<script>` che Astro elabora diventano file `.ts` a parte; gli
   `is:inline` restano fuori, come in `astro check`.
2. `.tipi/tsconfig.json` estende quello dell'app e aggiunge:
   - i tipi di `astro sync` prima dei globali di Astro (`env.d.ts`,
     `astro-jsx.d.ts`): entrambi dichiarano `astro:content`, e conta l'ordine;
   - `rootDirs` e `paths`, perché un import di `./Foo.astro` o
     `#components/Foo.astro` trovi `Foo.astro.tsx` nell'ombra;
   - un tipo generico per i `.astro` dei pacchetti (es. `astro-portabletext`),
     che non si convertono.
3. `tsc` controlla l'ombra insieme ai `.ts` di `src/`, e ogni errore torna
   alla riga del `.astro` d'origine.

## Limiti

- I componenti `.astro` dentro i pacchetti hanno props libere.
- Gli script `is:inline` non si controllano.
