// Controllo del consenso dal vivo (issue #22, ADR-0006): apre il sito con un
// browser pulito e confronta, per ogni scelta, quello che il sito scrive
// davvero con quello che il banner dichiara.
//
//   PLAYWRIGHT_PATH=/percorso/a/node_modules/playwright/index.js \
//     node tools/consent-audit/audit.mjs https://beta.wearebutik.com/
//
// Gli eventi verso PostHog sono bloccati: le prove non finiscono nei dati.
// Esce con codice 1 se qualcosa non torna.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pw = process.env.PLAYWRIGHT_PATH;
if (!pw) {
  console.error('Serve PLAYWRIGHT_PATH (vedi tools/consent-audit/README.md).');
  process.exit(2);
}
const { chromium } = require(pw);
const URL0 = process.argv[2] ?? 'https://beta.wearebutik.com/';

// La libreria del banner non si mostra ai browser che si dichiarano
// automatici (hideFromBots): il controllo si presenta come un browser normale.
const browser = await chromium.launch({ args: ['--disable-blink-features=AutomationControlled'] });
const problemi = [];

async function apri() {
  const ctx = await browser.newContext();
  await ctx.route(/i\.posthog\.com\/(e|i|s|batch|flags)\//, (r) => r.abort());
  const page = await ctx.newPage();
  await page.goto(URL0, { waitUntil: 'load' });
  // GTM e PostHog arrivano dopo il load (ADR-0006 #after-first-paint).
  await page.waitForTimeout(5000);
  return { ctx, page };
}

async function stato(ctx, page) {
  const cookies = (await ctx.cookies()).map((c) => c.name);
  const storage = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
  }));
  return { cookies, ...storage };
}

const ricarica = async (page) => {
  await page.waitForTimeout(1500);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(5000);
};

// I cookie che il banner dichiara: la tabella della finestra delle
// preferenze, come la vede chi visita il sito. «…» vale qualunque testo.
async function dichiarati(page) {
  await page.getByRole('button', { name: /preferenze cookie/i }).first().click();
  await page.waitForTimeout(800);
  const nomi = await page.$$eval('#cc-main .pm table tbody tr td:first-child', (td) => td.map((t) => t.textContent.trim()));
  await page.keyboard.press('Escape');
  return nomi.map((n) => ({ nome: n, re: new RegExp('^' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('…', '.+') + '$') }));
}

const ph = (k) => k.startsWith('ph_') || k.startsWith('__ph_') || k.startsWith('_ph_');
const attesa = (nome, cond, dettaglio) => {
  console.log(`${cond ? '✓' : '✗'} ${nome}${cond ? '' : ` — ${dettaglio}`}`);
  if (!cond) problemi.push(nome);
};

// 1. Prima di qualunque scelta: nessun cookie, nessuno storage di PostHog.
{
  const { ctx, page } = await apri();
  const s = await stato(ctx, page);
  const banner = await page.evaluate(() => !!document.querySelector('#cc-main .cm'));
  attesa('prima della scelta: il banner compare', banner, 'banner assente');
  attesa('prima della scelta: nessun cookie', s.cookies.length === 0, s.cookies.join(', '));
  attesa('prima della scelta: niente PostHog nello storage', ![...s.local, ...s.session].some(ph), [...s.local, ...s.session].join(', '));
  await ctx.close();
}

// 2. Accetta tutti: ogni cookie osservato è dichiarato, e viceversa.
{
  const { ctx, page } = await apri();
  await page.locator('#cc-main .cm [data-role="all"]').first().click();
  await ricarica(page);
  const s = await stato(ctx, page);
  const dich = await dichiarati(page);
  const nonDichiarati = s.cookies.filter((c) => !dich.some((d) => d.re.test(c)));
  const maiVisti = dich.filter((d) => !s.cookies.some((c) => d.re.test(c))).map((d) => d.nome);
  attesa('dopo "Accetta tutti": ogni cookie scritto è dichiarato', nonDichiarati.length === 0, `non dichiarati: ${nonDichiarati.join(', ')}`);
  attesa('dopo "Accetta tutti": ogni cookie dichiarato viene scritto', maiVisti.length === 0, `mai visti: ${maiVisti.join(', ')}`);
  await ctx.close();
}

// 3. Rifiuta: resta solo il cookie della scelta.
{
  const { ctx, page } = await apri();
  await page.locator('#cc-main .cm [data-role="necessary"]').first().click();
  await ricarica(page);
  const s = await stato(ctx, page);
  attesa('dopo "Rifiuta": solo cc_cookie', s.cookies.join() === 'cc_cookie', s.cookies.join(', '));
  attesa('dopo "Rifiuta": niente PostHog nello storage', ![...s.local, ...s.session].some(ph), [...s.local, ...s.session].join(', '));
  await ctx.close();
}

// 4. Accetta, poi revoca dalle preferenze del footer: tutto via.
{
  const { ctx, page } = await apri();
  await page.locator('#cc-main .cm [data-role="all"]').first().click();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /preferenze cookie/i }).first().click();
  await page.waitForTimeout(800);
  await page.locator('#cc-main .pm [data-role="necessary"]').first().click();
  await ricarica(page);
  const s = await stato(ctx, page);
  attesa('dopo la revoca: solo cc_cookie', s.cookies.join() === 'cc_cookie', s.cookies.join(', '));
  attesa('dopo la revoca: niente PostHog nello storage', ![...s.local, ...s.session].some(ph), [...s.local, ...s.session].join(', '));
  await ctx.close();
}

await browser.close();
console.log(problemi.length ? `\n${problemi.length} controlli non passati.` : '\nTutto coerente.');
process.exit(problemi.length ? 1 : 0);
