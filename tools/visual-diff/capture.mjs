// Cattura: serve due build statiche su due porte, apre ogni pagina in entrambe
// a tre viewport e salva le coppie di screenshot che non coincidono byte a byte.
// Il giudizio su QUANTO differiscono lo da' compare.mjs — qui si scremano solo
// le pagine da guardare.
//
//   node tools/visual-diff/capture.mjs <dist-prima> <dist-dopo> <cartella-esiti>
// Playwright non e' una dipendenza del repo: lo si passa da fuori con
// PLAYWRIGHT_PATH=/percorso/a/node_modules/playwright/index.js, oppure lo si
// installa al volo con `pnpm dlx playwright@1 install chromium` e si punta li'.
const PW = process.env.PLAYWRIGHT_PATH;
if (!PW) {
  console.error('Manca PLAYWRIGHT_PATH — vedi tools/visual-diff/README.md');
  process.exit(1);
}
const { chromium } = (await import(PW)).default ?? (await import(PW));
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const BEFORE = process.argv[2];
const AFTER = process.argv[3];
const OUT = process.argv[4];

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json',
  '.avif': 'image/avif', '.ico': 'image/x-icon',
};

function serve(root, port) {
  return new Promise((resolve) => {
    const srv = createServer(async (req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      let f = join(root, p);
      if (!extname(f)) f = join(f, 'index.html');
      try {
        const buf = await readFile(f);
        res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' });
        res.end(buf);
      } catch {
        res.writeHead(404); res.end('nope');
      }
    });
    srv.listen(port, () => resolve(srv));
  });
}

const PAGES = [
  '/', '/servizi/', '/servizi/progettazione-culturale/', '/servizi/consulenza-strategica/',
  '/servizi/formazione-capacity-building/', '/chi-siamo/', '/contatti/', '/partners/',
  '/progetti/', '/privacy/', '/termini/', '/lab/', '/lab/og-card/',
];
const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

const s1 = await serve(BEFORE, 4501);
const s2 = await serve(AFTER, 4502);
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const results = [];

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();

  for (const path of PAGES) {
    const shots = {};
    for (const [tag, port] of [['before', 4501], ['after', 4502]]) {
      await page.goto(`http://localhost:${port}${path}`, { waitUntil: 'networkidle' });
      // Congela le animazioni e neutralizza i caroselli a tempo.
      await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
      // Le immagini sotto la piega sono lazy: lo screenshot fullPage scorre la
      // pagina e le innesca A META' CATTURA, quindi due esecuzioni della stessa
      // build danno risultati diversi. Le si forza tutte e si aspetta che siano
      // decodificate, altrimenti il confronto segnala differenze inventate.
      await page.evaluate(async () => {
        for (const img of document.querySelectorAll('img')) {
          img.loading = 'eager';
          if (img.dataset.src && !img.src) img.src = img.dataset.src;
        }
        await Promise.all(
          [...document.images]
            .filter((i) => !i.complete)
            .map((i) => new Promise((r) => { i.onload = i.onerror = r; })),
        );
        if (document.fonts) await document.fonts.ready;
      });
      await page.waitForTimeout(300);
      shots[tag] = await page.screenshot({ fullPage: true, animations: 'disabled' });
    }
    const same = Buffer.compare(shots.before, shots.after) === 0;
    let diffPct = 0;
    if (!same) {
      // Il delta di peso del PNG e' solo un indizio grossolano per ordinare le
      // pagine: la misura vera la fa compare.mjs, che decodifica i pixel.
      const name = `${vp.name}${path.replace(/\//g, '_')}`;
      await writeFile(join(OUT, `${name}.before.png`), shots.before);
      await writeFile(join(OUT, `${name}.after.png`), shots.after);
      diffPct = Math.abs(shots.before.length - shots.after.length) / shots.before.length;
    }
    results.push({ viewport: vp.name, path, same, sizeDelta: diffPct });
  }
  await ctx.close();
}

await browser.close();
s1.close(); s2.close();

const diffs = results.filter((r) => !r.same);
console.log(`\nconfronti: ${results.length} · identici: ${results.length - diffs.length} · diversi: ${diffs.length}\n`);
for (const d of diffs) {
  console.log(`  DIVERSO  ${d.viewport.padEnd(8)} ${d.path}   (delta peso PNG ${(d.sizeDelta * 100).toFixed(1)}%)`);
}
await writeFile(join(OUT, 'results.json'), JSON.stringify(results, null, 2));
