// Confronto: diff pixel-per-pixel delle coppie salvate da capture.mjs.
// Node non sa decodificare i PNG, quindi la decodifica la fa Chromium su canvas.
//
//   node tools/visual-diff/compare.mjs <cartella-esiti>
//
// Le colonne che contano:
//   altezza b/a  se cambia, e' una regressione di spaziatura — la piu' comune
//   forte%       pixel con scarto > 90: differenze visibili, non antialiasing
//   banda Y      dove cade la prima e l'ultima riga diversa, per andare a colpo sicuro
// Playwright non e' una dipendenza del repo: lo si passa da fuori con
// PLAYWRIGHT_PATH=/percorso/a/node_modules/playwright/index.js, oppure lo si
// installa al volo con `pnpm dlx playwright@1 install chromium` e si punta li'.
const PW = process.env.PLAYWRIGHT_PATH;
if (!PW) {
  console.error('Manca PLAYWRIGHT_PATH — vedi tools/visual-diff/README.md');
  process.exit(1);
}
const { chromium } = (await import(PW)).default ?? (await import(PW));
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIR = process.argv[2];
const files = (await readdir(DIR)).filter((f) => f.endsWith('.before.png'));

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('about:blank');

const rows = [];
for (const bf of files) {
  const name = bf.replace('.before.png', '');
  const af = `${name}.after.png`;
  const [b64a, b64b] = await Promise.all([
    readFile(join(DIR, bf)).then((b) => b.toString('base64')),
    readFile(join(DIR, af)).then((b) => b.toString('base64')),
  ]);

  const res = await page.evaluate(async ([a, b]) => {
    const load = (d) =>
      new Promise((r) => {
        const i = new Image();
        i.onload = () => r(i);
        i.src = 'data:image/png;base64,' + d;
      });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const w = Math.max(ia.width, ib.width);
    const h = Math.max(ia.height, ib.height);
    const grab = (img) => {
      const c = new OffscreenCanvas(w, h);
      const x = c.getContext('2d');
      x.fillStyle = '#000';
      x.fillRect(0, 0, w, h);
      x.drawImage(img, 0, 0);
      return x.getImageData(0, 0, w, h).data;
    };
    const da = grab(ia), db = grab(ib);
    let diff = 0, strong = 0;
    let minY = Infinity, maxY = -1;
    for (let i = 0; i < da.length; i += 4) {
      const d =
        Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
      if (d > 12) {
        diff++;
        const y = Math.floor(i / 4 / w);
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (d > 90) strong++;
      }
    }
    return {
      w, h,
      ha: ia.height, hb: ib.height,
      pct: (diff / (w * h)) * 100,
      strongPct: (strong / (w * h)) * 100,
      firstY: minY === Infinity ? null : minY,
      lastY: maxY < 0 ? null : maxY,
    };
  }, [b64a, b64b]);

  rows.push({ name, ...res });
}
await browser.close();

rows.sort((x, y) => y.strongPct - x.strongPct);
console.log('\npagina                                      altezza b/a    diff%   forte%   banda Y');
console.log('─'.repeat(96));
for (const r of rows) {
  const hh = r.ha === r.hb ? `${r.ha}` : `${r.ha}→${r.hb}`;
  console.log(
    `${r.name.padEnd(44)}${hh.padStart(11)}  ${r.pct.toFixed(3).padStart(7)}  ${r.strongPct
      .toFixed(3)
      .padStart(7)}   ${r.firstY ?? '-'}–${r.lastY ?? '-'}`,
  );
}
await writeFile(join(DIR, 'pixdiff.json'), JSON.stringify(rows, null, 2));
