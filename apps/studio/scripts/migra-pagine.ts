// Migrazione una tantum: apps/web/src/content/pagine/*.md → documenti fissi
// `pagina*` su Sanity (_id `pagina-<id>`), più la nuova pagina indice dei
// progetti con i testi oggi scritti in progetti/index.astro. Idempotente
// (createOrReplace). DRY=1 stampa i documenti senza scrivere né caricare.
//
//   pnpm --filter @butik/studio migrate:pagine
import { createReadStream, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { getCliClient } from 'sanity/cli';
import { Schema } from '@sanity/schema';
import { htmlToBlocks } from '@portabletext/block-tools';
import { JSDOM } from 'jsdom';
import matter from 'gray-matter';
import { marked } from 'marked';
import { smartypantsu } from 'smartypants';

const WEB = resolve(import.meta.dirname, '../../web');
const CONTENT = resolve(WEB, 'src/content/pagine');
const client = getCliClient({ apiVersion: '2026-09-01' });
const DRY = process.env.DRY === '1';

let keySeq = 0;
const key = () => `k${(keySeq++).toString(36)}`;
const keyed = <T extends object>(items: T[] = []) => items.map((i) => ({ _key: key(), ...i }));

// ── Immagini ──────────────────────────────────────────────────────────────
const uploaded = new Map<string, string>();
async function imageRef(srcPath: string) {
  if (!srcPath) return undefined;
  let id = uploaded.get(srcPath) ?? (DRY ? `dry:${srcPath}` : undefined);
  if (!id) {
    // Sitepins scrive `/assets/…`, i contenuti a mano `/src/assets/…` (ADR-0009)
    const file = resolve(WEB, srcPath.replace(/^\/(src\/)?/, 'src/'));
    id = (await client.assets.upload('image', createReadStream(file), { filename: basename(file) }))._id;
    uploaded.set(srcPath, id);
  }
  return { _type: 'image', asset: { _type: 'reference', _ref: id } };
}

// ── HTML/Markdown → Portable Text ─────────────────────────────────────────
const blockType = (block: object) =>
  Schema.compile({
    name: 'migrazione',
    types: [{ name: 'doc', type: 'document', fields: [{ name: 'testo', type: 'array', of: [block] }] }],
  })
    .get('doc')
    .fields.find((f: { name: string }) => f.name === 'testo').type;

const formattato = blockType({ type: 'block', styles: [{ title: 'P', value: 'normal' }], lists: [] });
const legale = blockType({
  type: 'block',
  styles: [
    { title: 'P', value: 'normal' },
    { title: 'H2', value: 'h2' },
    { title: 'H3', value: 'h3' },
  ],
  lists: [{ title: 'Bullet', value: 'bullet' }],
  marks: {
    decorators: [
      { title: 'Strong', value: 'strong' },
      { title: 'Em', value: 'em' },
      { title: 'Code', value: 'code' },
    ],
  },
});

type Span = { _type: string; text?: string; marks?: string[] };
// Apostrofi e virgolette tipografiche, come faceva Astro sul Markdown (non sul
// codice inline).
const typografia = (span: Span): Span =>
  span._type === 'span' && span.text && !span.marks?.includes('code')
    ? { ...span, text: smartypantsu(span.text, 'qe') }
    : span;

function toBlocks(html: string, type: unknown, tipografiche = false) {
  return htmlToBlocks(html, type as never, { parseHtml: (h) => new JSDOM(h).window.document }).map((b) => ({
    ...b,
    _key: key(),
    ...(Array.isArray(b.children) && tipografiche ? { children: (b.children as Span[]).map(typografia) } : {}),
  }));
}

/** Stringa con HTML inline (<strong>, <a>, <br />) → testo formattato. */
const rich = (html?: string) => (html ? toBlocks(`<p>${html}</p>`, formattato) : undefined);
/** Corpo Markdown → testo legale. */
const legal = (md: string) => toBlocks(marked.parse(md.trim(), { async: false }), legale, true);

// ── Pagine ────────────────────────────────────────────────────────────────
const read = (id: string) => matter(readFileSync(resolve(CONTENT, `${id}.md`), 'utf8'));
const pick = (data: Record<string, unknown>, fields: string[]) =>
  Object.fromEntries(fields.map((f) => [f, data[f]]));

const docs: Record<string, unknown>[] = [];
const add = (type: string, id: string, fields: Record<string, unknown>) =>
  docs.push({ _id: `pagina-${id}`, _type: type, ...fields });

{
  const { data: d } = read('home');
  const { newsletterPrivacy, butikMetrics, mmwMetrics, type, title, heroServizi, ...rest } = d;
  add('paginaHome', 'home', {
    ...rest,
    butikMetrics: keyed(butikMetrics),
    mmwMetrics: keyed(mmwMetrics),
    newsletterPrivacy: rich(newsletterPrivacy),
  });
}
{
  const { data: d } = read('chi-siamo');
  const { type, title, sdg, founders, ...rest } = d;
  const richFields = ['introP1', 'introP2', 'introP3', 'introP4', 'teamP1', 'teamP2', 'teamP3'];
  add('paginaChiSiamo', 'chi-siamo', {
    ...rest,
    ...Object.fromEntries(richFields.map((f) => [f, rich(d[f])])),
    sdg: keyed(sdg),
    founders: await Promise.all(
      (founders ?? []).map(async (f: Record<string, string>) => ({
        _key: key(),
        ...f,
        photo: await imageRef(f.photo),
      })),
    ),
  });
}
{
  const { data: d } = read('contatti');
  const { type, title, sedeAddress, ...rest } = d;
  add('paginaContatti', 'contatti', { ...rest, sedeAddress: rich(sedeAddress) });
}
{
  const { data: d } = read('partners');
  add('paginaPartners', 'partners', {
    ...pick(d, ['metaTitle', 'metaDescription', 'eyebrow', 'title']),
    partners: await Promise.all(
      (d.partners ?? []).map(async (p: Record<string, string>) => ({
        _key: key(),
        name: p.name,
        logo: await imageRef(p.logo),
      })),
    ),
  });
}
{
  const { data: d } = read('servizi');
  const { type, title, headerIntro2, metodo, filtri, ...rest } = d;
  add('paginaServizi', 'servizi', {
    ...rest,
    headerIntro2: rich(headerIntro2),
    metodo: keyed(metodo),
    filtri: keyed(filtri),
  });
}
{
  const { data: d } = read('testimonials');
  add('paginaTestimonials', 'testimonials', {
    ...pick(d, ['eyebrow', 'sectionTitle']),
    testimonials: keyed(d.testimonials),
  });
}
{
  // La Cookie Policy ha un titolo fisso con ancora #cookie (il banner dei
  // cookie ci rimanda): diventa un campo a sé, il testo si divide lì.
  const { data: d, content } = read('privacy');
  const [privacy, cookie] = content.split(/<h2 id="cookie">(.*?)<\/h2>/);
  const cookieTitle = content.match(/<h2 id="cookie">(.*?)<\/h2>/)?.[1];
  if (!cookie || !cookieTitle) throw new Error('privacy: sezione #cookie non trovata');
  add('paginaPrivacy', 'privacy', {
    ...pick(d, ['metaTitle', 'metaDescription', 'pageTitle', 'updatedDate']),
    body: legal(privacy),
    cookieTitle,
    cookieBody: legal(content.split(/<h2 id="cookie">.*?<\/h2>/)[1]),
  });
}
{
  const { data: d, content } = read('termini');
  add('paginaTermini', 'termini', {
    ...pick(d, ['metaTitle', 'metaDescription', 'pageTitle', 'updatedDate']),
    body: legal(content),
  });
}
// Nuova: testi della pagina /progetti, oggi scritti in progetti/index.astro.
add('paginaProgetti', 'progetti', {
  metaTitle: 'Progetti — Butik',
  metaDescription: 'Esplora i progetti di Butik: dalla Milano Music Week al Festival del Turismo Musicale.',
  eyebrow: 'Portfolio',
  title: 'Progetti',
  clienteLabel: 'Cliente:',
});

// ── Scrittura ─────────────────────────────────────────────────────────────
const clean = docs.map((d) => JSON.parse(JSON.stringify(d))); // toglie gli undefined
if (DRY) {
  console.log(JSON.stringify(clean, null, 1));
  process.exit(0);
}
const tx = client.transaction();
for (const d of clean) tx.createOrReplace(d);
await tx.commit();
console.log(`Migrate ${clean.length} pagine, ${uploaded.size} immagini: ${clean.map((d) => d._id).join(', ')}`);
