// Controllo dei tipi di un'app Astro con TypeScript 7: quello che fa
// `astro check`, che però richiede TypeScript ≤ 6. Ogni `.astro` diventa TSX
// con @astrojs/astro2tsx (lo stesso convertitore del language server di
// Astro) in una cartella ombra, i suoi <script> elaborati da Astro diventano
// file .ts, `tsc` controlla tutto insieme ai .ts dell'app, e gli errori
// tornano alla riga del .astro.
//
//   node ../../tools/type-check/index.mjs      (dalla cartella dell'app)
//
// Vedi README.md.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';

const app = process.cwd();
const require = createRequire(join(app, 'package.json'));
const { convertToTsx } = require('@astrojs/astro2tsx');

const OMBRA = join(app, '.tipi');
rmSync(OMBRA, { recursive: true, force: true });

/** Riga e colonna (da 1) di un offset in un testo. */
function posizione(testo, offset) {
  const prima = testo.slice(0, offset).split('\n');
  return { riga: prima.length, colonna: prima.at(-1).length + 1 };
}

/** Offset di riga e colonna (da 1) in un testo. */
function offset(testo, riga, colonna) {
  let o = 0;
  for (let r = 1; r < riga; r++) o = testo.indexOf('\n', o) + 1;
  return o + colonna - 1;
}

// Per ogni file generato: come riportare un offset al .astro di origine.
const origini = new Map();
let errori = 0;

for (const voce of readdirSync(join(app, 'src'), { recursive: true, withFileTypes: true })) {
  if (!voce.isFile() || !voce.name.endsWith('.astro')) continue;
  const percorso = join(voce.parentPath, voce.name);
  const rel = relative(app, percorso);
  const sorgente = readFileSync(percorso, 'utf8');
  const tsx = convertToTsx(sorgente, { filename: percorso });

  for (const d of tsx.diagnostics) {
    if (d.severity !== 1) continue; // 1 = errore
    errori++;
    const { riga, colonna } = posizione(sorgente, d.position?.start ?? 0);
    console.log(`${rel}:${riga}:${colonna} - errore: ${d.message}`);
  }

  const uscita = join(OMBRA, `${rel}.tsx`);
  mkdirSync(dirname(uscita), { recursive: true });
  writeFileSync(uscita, tsx.code);
  origini.set(relative(app, uscita), {
    rel,
    sorgente,
    generato: tsx.code,
    // [offset generato, lunghezza generata, offset sorgente, lunghezza sorgente, …]
    verso: (o) => {
      let vicina;
      for (const [g, gl, s, sl] of tsx.mappings) {
        if (sl > 0 && o >= g && o < g + gl) return s + Math.min(o - g, sl - 1);
        if (sl > 0 && g <= o) vicina = s;
      }
      return vicina ?? 0;
    },
  });

  // Gli <script> che Astro elabora sono moduli TypeScript; quelli is:inline
  // arrivano al browser così come sono e restano fuori, come in `astro check`.
  tsx.scripts
    .filter((s) => s.type === 'processed-module')
    .forEach((s, i) => {
      const file = join(OMBRA, `${rel}.script-${i}.ts`);
      writeFileSync(file, s.content);
      origini.set(relative(app, file), {
        rel,
        sorgente,
        generato: s.content,
        verso: (o) => s.position.start + o,
      });
    });
}

// tsconfig dell'ombra: estende quello dell'app e aggiunge i tipi globali che
// il language server inietta nei .astro (Astro, Fragment, JSX). `rootDirs` fa
// vedere ai percorsi relativi src/ e l'ombra come una cartella sola; `paths`
// fa lo stesso per gli import interni del package.json (#components/*…).
const pkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'));
const astro = dirname(require.resolve('astro/package.json'));
const paths = Object.fromEntries(
  Object.entries(pkg.imports ?? {}).map(([alias, target]) => [alias, [`../${target}`, `./${target}`]]),
);
// I .astro fuori da src/ (dentro i pacchetti, es. astro-portabletext) non si
// convertono: un import che non trova il suo TSX diventa un componente
// generico. I .astro di src/ si risolvono sempre al loro TSX, prima di questo.
writeFileSync(
  join(OMBRA, 'astro-esterni.d.ts'),
  "declare module '*.astro' {\n  const Component: (props: Record<string, any>) => any;\n  export default Component;\n}\n",
);
writeFileSync(
  join(OMBRA, 'tsconfig.json'),
  JSON.stringify(
    {
      extends: '../tsconfig.json',
      compilerOptions: { rootDirs: ['../src', './src'], paths, noEmit: true },
      // Prima i tipi di `astro sync`: dichiarano `astro:content` con le nostre
      // collection, e devono precedere la dichiarazione generica di Astro.
      files: ['../.astro/types.d.ts', join(astro, 'env.d.ts'), join(astro, 'astro-jsx.d.ts'), './astro-esterni.d.ts'],
      include: ['../src/**/*', './src/**/*'],
      exclude: [],
    },
    null,
    2,
  ),
);

// TypeScript 7 non esporta bin/tsc: si risale dal suo package.json.
const tsc = spawnSync(
  join(dirname(require.resolve('typescript/package.json')), 'bin', 'tsc'),
  ['-p', join(OMBRA, 'tsconfig.json'), '--pretty', 'false'],
  { cwd: app, encoding: 'utf8' },
);

for (const riga of `${tsc.stdout}${tsc.stderr}`.split('\n')) {
  const m = riga.match(/^(.+?)\((\d+),(\d+)\): (error|warning) (TS\d+): (.*)$/);
  if (!m) {
    if (riga.trim()) console.log(riga); // seguito del messaggio precedente
    continue;
  }
  const [, file, l, c, livello, codice, testo] = m;
  if (livello === 'error') errori++;
  const relFile = relative(app, join(app, file));
  const origine = origini.get(relFile);
  let dove = `${relFile}:${l}:${c}`;
  if (origine) {
    const { riga: r, colonna: k } = posizione(origine.sorgente, origine.verso(offset(origine.generato, +l, +c)));
    dove = `${origine.rel}:${r}:${k}`;
  }
  console.log(`${dove} - ${livello === 'error' ? 'errore' : 'avviso'} ${codice}: ${testo}`);
}

console.log(errori ? `\n${errori} errori di tipo.` : 'Nessun errore di tipo.');
process.exit(errori || tsc.status ? 1 : 0);
