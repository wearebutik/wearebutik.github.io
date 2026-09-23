// Migrazione una tantum: apps/web/src/content/progetti/*.mdx → documenti
// `progetto` su Sanity. Idempotente: ogni documento ha _id `progetto-<slug>` e
// viene sovrascritto (createOrReplace); gli asset sono deduplicati da Sanity
// per hash del contenuto.
//
//   pnpm --filter @butik/studio migrate:progetti
//
// Gira con `sanity exec --with-user-token`: usa il login della CLI, nessun
// token da gestire a mano.
//
// Eseguita una volta (settembre 2026, #51): gli MDX e le immagini sorgente sono
// stati poi rimossi dal repo e si recuperano dalla storia git. Resta come
// modello per le migrazioni delle altre collection.
import { createReadStream, readdirSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { getCliClient } from 'sanity/cli';
import { Schema } from '@sanity/schema';
import { htmlToBlocks } from '@portabletext/block-tools';
import { JSDOM } from 'jsdom';
import matter from 'gray-matter';
import { marked } from 'marked';
import { smartypantsu } from 'smartypants';

const WEB = resolve(import.meta.dirname, '../../web');
const CONTENT = resolve(WEB, 'src/content/progetti');

const client = getCliClient({ apiVersion: '2026-09-01' });

// Al parser HTML serve solo il tipo "testo" del corpo: i blocchi immagine
// li costruiamo a mano qui sotto.
const blockContentType = Schema.compile({
  name: 'migrazione',
  types: [{ name: 'testo', type: 'document', fields: [{ name: 'body', type: 'array', of: [{ type: 'block' }] }] }],
})
  .get('testo')
  .fields.find((f: { name: string }) => f.name === 'body').type;

let keySeq = 0;
const key = () => `k${(keySeq++).toString(36)}`;

// ── Immagini ──────────────────────────────────────────────────────────────
const uploaded = new Map<string, string>(); // path "/src/assets/…" → asset _id

async function uploadImage(srcPath: string): Promise<string> {
  const hit = uploaded.get(srcPath);
  if (hit) return hit;
  // Sitepins scrive `/assets/…`, i contenuti a mano `/src/assets/…` (ADR-0009)
  const file = resolve(WEB, srcPath.replace(/^\/(src\/)?/, 'src/'));
  const asset = await client.assets.upload('image', createReadStream(file), {
    filename: basename(file),
  });
  uploaded.set(srcPath, asset._id);
  return asset._id;
}

const imageRef = async (srcPath: string) => ({
  _type: 'image',
  asset: { _type: 'reference', _ref: await uploadImage(srcPath) },
});

const figura = async (a: Record<string, string>) => ({
  _type: 'figura',
  _key: key(),
  asset: { _type: 'reference', _ref: await uploadImage(a.src) },
  ...(a.alt ? { alt: a.alt } : {}),
  ...(a.caption ? { caption: a.caption } : {}),
});

// ── Markdown → Portable Text ──────────────────────────────────────────────
function markdownToBlocks(md: string) {
  const html = marked.parse(dedent(md), { async: false });
  return htmlToBlocks(html, blockContentType, {
    parseHtml: (h) => new JSDOM(h).window.document,
  }).map((b) => ({ ...b, _key: key(), ...(Array.isArray(b.children) ? { children: b.children.map(typografia) } : {}) }));
}

// Apostrofi e virgolette tipografiche (’ “ ”), come fa MDX con smartypants.
const typografia = <T extends { _type: string; text?: string }>(span: T): T =>
  span._type === 'span' && span.text ? { ...span, text: smartypantsu(span.text, 'qe') } : span;

function dedent(s: string): string {
  const lines = s.split('\n');
  const indent = Math.min(
    ...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length),
  );
  return lines.map((l) => l.slice(indent)).join('\n');
}

/** Attributi `nome="valore"` di un tag JSX. */
function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(/(\w+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}

// I quattro componenti MDX usati nei contenuti, nell'ordine in cui compaiono.
const COMPONENT = new RegExp(
  [
    '<ImageBlock\\b[^>]*/>',
    '<Image(Left|Right)\\b([^>]*)>([\\s\\S]*?)</Image(?:Left|Right)>',
    '<ImageCarousel images=\\{\\[([\\s\\S]*?)\\]\\}\\s*/>',
  ].join('|'),
  'g',
);

async function bodyToBlocks(body: string) {
  const blocks: unknown[] = [];
  let last = 0;
  for (const m of body.matchAll(COMPONENT)) {
    blocks.push(...markdownToBlocks(body.slice(last, m.index)));
    last = m.index! + m[0].length;

    if (m[0].startsWith('<ImageBlock')) {
      blocks.push({ _type: 'imageBlock', _key: key(), image: await figura(attrs(m[0])) });
    } else if (m[1]) {
      blocks.push({
        _type: 'imageSide',
        _key: key(),
        side: m[1].toLowerCase(),
        image: await figura(attrs(m[2])),
        text: markdownToBlocks(m[3]),
      });
    } else {
      const items = [...m[4].matchAll(/\{([^}]*)\}/g)].map((i) => attrs(i[1].replace(/(\w+): "/g, '$1="')));
      blocks.push({
        _type: 'imageCarousel',
        _key: key(),
        images: await Promise.all(items.map(figura)),
      });
    }
  }
  blocks.push(...markdownToBlocks(body.slice(last)));
  return blocks;
}

// ── Main ──────────────────────────────────────────────────────────────────
const files = readdirSync(CONTENT).filter((f) => /\.mdx?$/.test(f));
const tx = client.transaction();

for (const file of files) {
  const slug = file.replace(/\.mdx?$/, '');
  const { data, content } = matter(readFileSync(resolve(CONTENT, file), 'utf8'));
  const doc = {
    _id: `progetto-${slug}`,
    _type: 'progetto',
    slug: { _type: 'slug', current: slug },
    title: data.title,
    subtitle: data.subtitle,
    heroImage: data.heroImage ? await imageRef(data.heroImage) : undefined, // vuoto nelle bozze di test
    heroAlt: data.heroAlt,
    client: data.client,
    year: data.year,
    category: data.category,
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    ogImage: data.ogImage ? await imageRef(data.ogImage) : undefined,
    ogCta: data.ogCta,
    order: data.order ?? 0,
    featured: data.featured ?? false,
    featuredOrder: data.featuredOrder ?? 0,
    draft: data.draft ?? false,
    body: await bodyToBlocks(content),
  };
  tx.createOrReplace(JSON.parse(JSON.stringify(doc))); // toglie gli undefined
  console.log(`✓ ${slug} (${doc.body.length} blocchi)`);
}

await tx.commit();
console.log(`Migrati ${files.length} progetti, ${uploaded.size} immagini.`);
