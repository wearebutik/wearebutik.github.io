// Confronto degli stili calcolati, elemento per elemento, fra due build.
//
//   node tools/visual-diff/styles.mjs <dist-prima> <dist-dopo> [pagina]
//
// Gli screenshot dicono CHE una pagina è cambiata; questo dice QUALE proprietà
// di QUALE elemento. Percorre il DOM in ordine, accoppia gli elementi per
// posizione e riporta ogni proprietà divergente con il percorso dell'elemento.
//
// Utile soprattutto quando la differenza non si spiega leggendo il diff del
// codice — tipicamente per un cambio di specificità: uno stile che prima
// perdeva contro una regola globale e ora vince, o viceversa.
const PW = process.env.PLAYWRIGHT_PATH;
if (!PW) {
  console.error('Manca PLAYWRIGHT_PATH — vedi tools/visual-diff/README.md');
  process.exit(1);
}
const { chromium } = (await import(PW)).default ?? (await import(PW));

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const [BEFORE, AFTER, ONLY] = process.argv.slice(2);

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json',
  '.avif': 'image/avif', '.ico': 'image/x-icon',
};

function serve(root, port) {
  return new Promise((r) => {
    const s = createServer(async (req, res) => {
      let f = join(root, decodeURIComponent(req.url.split('?')[0]));
      if (!extname(f)) f = join(f, 'index.html');
      try {
        const b = await readFile(f);
        res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' });
        res.end(b);
      } catch {
        res.writeHead(404);
        res.end();
      }
    });
    s.listen(port, () => r(s));
  });
}

const PAGES = ONLY
  ? [ONLY]
  : [
      '/', '/servizi/', '/servizi/progettazione-culturale/', '/servizi/consulenza-strategica/',
      '/servizi/formazione-capacity-building/', '/chi-siamo/', '/contatti/', '/partners/',
      '/progetti/', '/privacy/', '/termini/', '/lab/', '/lab/og-card/',
    ];

// Le proprietà che un refactor di stile può cambiare senza che la build protesti.
const PROPS = [
  'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing',
  'textTransform', 'textDecorationLine', 'color', 'backgroundColor',
  'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'display', 'flexDirection', 'justifyContent', 'alignItems', 'gap',
  'gridTemplateColumns', 'width', 'height', 'maxWidth', 'borderTopWidth',
  'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderTopColor', 'borderRadius',
];

const s1 = await serve(BEFORE, 4601);
const s2 = await serve(AFTER, 4602);
const browser = await chromium.launch();

const collect = async (port, path) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`http://localhost:${port}${path}`, { waitUntil: 'networkidle' });
  const data = await page.evaluate((props) => {
    // I colori vanno normalizzati prima di confrontarli: Tailwind miscela le
    // opacita' in oklab, color-mix() nel repo le miscela in srgb, e le due
    // notazioni descrivono lo stesso pixel con numeri diversi. Dipingerli su
    // una canvas 1x1 da' l'unica cosa che conta davvero, cioe' cosa si vede.
    const cv = document.createElement('canvas');
    cv.width = cv.height = 1;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    const cache = new Map();
    const paint = (v) => {
      if (!v || !/[(#]|^[a-z]+$/.test(v)) return v;
      if (cache.has(v)) return cache.get(v);
      cx.clearRect(0, 0, 1, 1);
      cx.fillStyle = '#000';
      try { cx.fillStyle = v; } catch { cache.set(v, v); return v; }
      cx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = cx.getImageData(0, 0, 1, 1).data;
      const out = `rgba(${r},${g},${b},${(a / 255).toFixed(2)})`;
      cache.set(v, out);
      return out;
    };
    const isColor = (p) => /color/i.test(p);

    const out = [];
    const walk = (el, pathStr) => {
      const c = getComputedStyle(el);
      const o = {};
      for (const p of props) {
        // Il colore di un bordo largo 0 non si vede: confrontarlo genera solo rumore.
        if (/^border(Top|Right|Bottom|Left)Color$/.test(p)) {
          const w = parseFloat(c[p.replace('Color', 'Width')]) || 0;
          if (w === 0 || c.borderStyle === 'none') { o[p] = '—'; continue; }
        }
        o[p] = isColor(p) ? paint(c[p]) : c[p];
      }
      out.push({ path: pathStr, tag: el.tagName.toLowerCase(), styles: o });
      [...el.children].forEach((ch, i) => walk(ch, `${pathStr}>${ch.tagName.toLowerCase()}[${i}]`));
    };
    walk(document.body, 'body');
    return out;
  }, PROPS);
  await page.close();
  return data;
};

let totalMismatch = 0;
for (const path of PAGES) {
  const [a, b] = await Promise.all([collect(4601, path), collect(4602, path)]);
  if (a.length !== b.length) {
    console.log(`\n${path} — numero di elementi diverso: ${a.length} → ${b.length} (struttura cambiata)`);
    totalMismatch++;
    continue;
  }
  // Aggrego per (percorso, proprietà) così una regola sbagliata su 20 elementi
  // non produce 20 righe uguali.
  const byProp = new Map();
  for (let i = 0; i < a.length; i++) {
    if (a[i].path !== b[i].path) continue;
    for (const p of PROPS) {
      if (String(a[i].styles[p]) !== String(b[i].styles[p])) {
        const k = `${a[i].tag}|${p}|${a[i].styles[p]}|${b[i].styles[p]}`;
        if (!byProp.has(k)) byProp.set(k, { tag: a[i].tag, prop: p, before: a[i].styles[p], after: b[i].styles[p], n: 0, first: a[i].path });
        byProp.get(k).n++;
      }
    }
  }
  if (!byProp.size) continue;
  totalMismatch += byProp.size;
  console.log(`\n${path}`);
  for (const v of [...byProp.values()].sort((x, y) => y.n - x.n)) {
    console.log(`  <${v.tag}> ×${v.n}  ${v.prop}`);
    console.log(`      prima: ${v.before}`);
    console.log(`      dopo:  ${v.after}`);
    console.log(`      es.:   ${v.first}`);
  }
}

await browser.close();
s1.close();
s2.close();
console.log(totalMismatch ? `\n${totalMismatch} divergenze` : '\nnessuna divergenza');
