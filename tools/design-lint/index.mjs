#!/usr/bin/env node
// design-lint — la parte meccanica delle regole di design (ADR-0005
// #design-tokens, docs/guidances/design-approach.md). Legge il CSS dei
// componenti e delle pagine e fallisce su tre casi che uno script può
// riconoscere senza capire il contesto:
//
//   red-hex       un rosso scritto a mano (#e21929, #cc1523) fuori dai token;
//   red-as-text   `color:` sul rosso di brand (--color-accent / --color-butik-red),
//                 che è il rosso dei glifi: il testo rosso è --color-accent-text;
//   small-caps    la ricetta del maiuscoletto (font display, --font-size-xs,
//                 uppercase, 0.1em) fuori da Eyebrow e MetaLabel. CTA, bottoni e
//                 link di navigazione hanno scala propria e non la toccano.
//
// Il resto (il ruolo di un'etichetta, il contrasto del testo su una foto) lo
// giudica la skill design-check. Un caso legittimo si dichiara nella regola
// CSS stessa, con la ragione:
//
//   /* design-lint-disable red-as-text: icona, non testo */
//
// Nessuna dipendenza: gira con il solo Node, anche in CI prima di pnpm install.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = new URL('../../', import.meta.url).pathname;
const SCAN = ['apps/web/src', 'packages/ui/src'];
const SKIP_DIRS = new Set(['node_modules', 'dist', '.astro', 'storybook-static']);
// Prototipi sperimentali: la review li segnala come note, la CI non li blocca.
const SKIP_PATHS = ['apps/web/src/pages/lab/'];

// Dove i rossi sono definiti, o dove le custom property non si leggono.
const RED_HEX_ALLOWED = new Set([
  'packages/ui-tokens/tokens.css',
  'apps/web/src/lib/og/render.ts',
]);
// Gli unici due posti in cui vive la ricetta del maiuscoletto.
const SMALL_CAPS_HOME = new Set([
  'packages/ui/src/atoms/Eyebrow.module.css',
  'packages/ui/src/atoms/MetaLabel.module.css',
]);

const RED_HEX = /#(?:e21929|cc1523)\b/i;
const RED_AS_TEXT = /(?:^|[;{\s])color\s*:\s*var\(--color-(?:accent|butik-red)\)/;
const UPPERCASE = /text-transform\s*:\s*uppercase/;
const TRACKING = /letter-spacing\s*:\s*0?\.1em\b/;
const DISPLAY_FONT = /font-family\s*:\s*var\(--font-display\)/;
const XS_SIZE = /font-size\s*:\s*(?:var\(--font-size-xs\)|0?\.75rem)/;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (/\.(css|astro|tsx|ts)$/.test(name) && !/\.stories\.tsx$/.test(name)) yield path;
  }
}

const lineAt = (text, index) => text.slice(0, index).split('\n').length;

/** Tratti di CSS del file, con l'offset nel file: il CSS intero, o i <style> di un .astro. */
function cssChunks(file, text) {
  if (file.endsWith('.css')) return [{ css: text, offset: 0 }];
  if (file.endsWith('.astro')) {
    return [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => ({
      css: m[1],
      offset: m.index + m[0].indexOf(m[1]),
    }));
  }
  return [];
}

/** Regole CSS foglia ({ … } senza graffe dentro), con la loro posizione. */
function* blocks(css) {
  for (const m of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    yield { selector: m[1].replace(/\/\*[\s\S]*?\*\//g, '').trim().replace(/\s+/g, ' '), body: m[2], index: m.index + m[1].length };
  }
}

const disabled = (body, rule) => new RegExp(`design-lint-disable\\s+${rule}\\b`).test(body);

const problems = [];
const report = (file, line, rule, message) => problems.push({ file, line, rule, message });

for (const base of SCAN) {
  for (const path of walk(join(ROOT, base))) {
    const file = relative(ROOT, path).split(sep).join('/');
    if (SKIP_PATHS.some((p) => file.startsWith(p))) continue;
    const text = readFileSync(path, 'utf8');

    if (!RED_HEX_ALLOWED.has(file)) {
      text.split('\n').forEach((row, i) => {
        if (RED_HEX.test(row) && !/design-lint-disable\s+red-hex\b/.test(row)) {
          report(file, i + 1, 'red-hex', 'rosso scritto a mano: usa il token del ruolo (--color-accent, -text o -fill)');
        }
      });
    }

    for (const { css, offset } of cssChunks(file, text)) {
      for (const { selector, body, index } of blocks(css)) {
        const line = lineAt(text, offset + index);
        if (RED_AS_TEXT.test(body) && !disabled(body, 'red-as-text')) {
          report(file, line, 'red-as-text', `${selector}: il testo rosso è --color-accent-text; il rosso di brand è per ciò che non porta testo`);
        }
        if (!SMALL_CAPS_HOME.has(file) && UPPERCASE.test(body) && TRACKING.test(body) && DISPLAY_FONT.test(body) && XS_SIZE.test(body) && !disabled(body, 'small-caps')) {
          report(file, line, 'small-caps', `${selector}: maiuscoletto scritto a mano: Eyebrow (apre una sezione) o MetaLabel (metadato)`);
        }
      }
    }
  }
}

if (problems.length === 0) {
  console.log('design-lint: nessun problema.');
  process.exit(0);
}
for (const p of problems) console.log(`${p.file}:${p.line}  [${p.rule}]  ${p.message}`);
console.log(`\ndesign-lint: ${problems.length} problemi. Vedi tools/design-lint/README.md.`);
process.exit(1);
