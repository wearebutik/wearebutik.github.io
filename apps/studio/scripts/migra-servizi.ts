// Migrazione una tantum: apps/web/src/content/servizi/*.mdx, più i dati di
// hero e card oggi nel codice (apps/web/src/data/serviziHero.ts,
// serviziCards.ts) → documenti `servizio` su Sanity. Idempotente: _id
// `servizio-<slug>`, createOrReplace; gli asset sono deduplicati da Sanity.
//
//   pnpm --filter @butik/studio migrate:servizi
//
// Il corpo MDX è una sequenza di componenti (CosaFacciamo, AdattoA, …) con i
// dati in `export const`: ogni componente diventa il blocco omonimo, nello
// stesso ordine.
import { createReadStream, readdirSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { getCliClient } from 'sanity/cli';
import { Schema } from '@sanity/schema';
import { htmlToBlocks } from '@portabletext/block-tools';
import { JSDOM } from 'jsdom';
import matter from 'gray-matter';
import { marked } from 'marked';
import { smartypantsu } from 'smartypants';
import { serviziHero } from '../../web/src/data/serviziHero';
import { serviziCards } from '../../web/src/data/serviziCards';

const WEB = resolve(import.meta.dirname, '../../web');
const CONTENT = resolve(WEB, 'src/content/servizi');

const client = getCliClient({ apiVersion: '2026-09-01' });
// DRY=1: stampa i documenti senza caricare immagini né scrivere su Sanity.
const DRY = process.env.DRY === '1';

let keySeq = 0;
const key = () => `k${(keySeq++).toString(36)}`;
const keyed = <T extends object>(items: T[]) => items.map((i) => ({ _key: key(), ...i }));

// ── Immagini ──────────────────────────────────────────────────────────────
const uploaded = new Map<string, string>();

async function imageRef(srcPath: string) {
  let id = uploaded.get(srcPath);
  if (!id && DRY) id = `dry:${srcPath}`;
  if (!id) {
    // Sitepins scrive `/assets/…`, i contenuti a mano `/src/assets/…` (ADR-0009)
    const file = resolve(WEB, srcPath.replace(/^\/(src\/)?/, 'src/'));
    id = (await client.assets.upload('image', createReadStream(file), { filename: basename(file) }))._id;
    uploaded.set(srcPath, id);
  }
  return { _type: 'image', asset: { _type: 'reference', _ref: id } };
}

// ── Markdown → testo formattato ───────────────────────────────────────────
const testoType = Schema.compile({
  name: 'migrazione',
  types: [{ name: 'doc', type: 'document', fields: [{ name: 'testo', type: 'array', of: [{ type: 'block' }] }] }],
})
  .get('doc')
  .fields.find((f: { name: string }) => f.name === 'testo').type;

// Apostrofi e virgolette tipografiche, come faceva MDX sul testo Markdown.
const typografia = <T extends { _type: string; text?: string }>(span: T): T =>
  span._type === 'span' && span.text ? { ...span, text: smartypantsu(span.text, 'qe') } : span;

function markdownToTesto(md: string) {
  const html = marked.parse(md.trim(), { async: false });
  return htmlToBlocks(html, testoType, { parseHtml: (h) => new JSDOM(h).window.document }).map((b) => ({
    ...b,
    _key: key(),
    ...(Array.isArray(b.children) ? { children: b.children.map(typografia) } : {}),
  }));
}

// ── Corpo MDX ─────────────────────────────────────────────────────────────
/** `export const nome = <espressione>;` → { nome: valore }. I file sono nostri. */
function exportsOf(mdx: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const m of mdx.matchAll(/^export const (\w+) = ([\s\S]*?);\n(?=\n|export|<|$)/gm)) {
    out[m[1]] = new Function(`return (${m[2]});`)();
  }
  return out;
}

/** Attributi JSX: `a="…"`, `a='…'` o `a={espressione}` valutata con gli export in scope. */
function attrsOf(src: string, scope: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  let i = 0;
  while (i < src.length) {
    const m = /(\w+)=/.exec(src.slice(i));
    if (!m) break;
    const name = m[1];
    i += m.index + m[0].length;
    const open = src[i];
    if (open === '"' || open === "'") {
      const end = src.indexOf(open, i + 1);
      out[name] = src.slice(i + 1, end);
      i = end + 1;
    } else if (open === '{') {
      let depth = 0;
      let j = i;
      for (; j < src.length; j++) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}' && --depth === 0) break;
      }
      const expr = src.slice(i + 1, j);
      out[name] = new Function(...Object.keys(scope), `return (${expr});`)(...Object.values(scope));
      i = j + 1;
    }
  }
  return out;
}

const TAG = /<CosaFacciamo>([\s\S]*?)<\/CosaFacciamo>|<(\w+)\b([\s\S]*?)\/>/g;

function bodyToBlocks(content: string, scope: Record<string, unknown>) {
  const blocks: Record<string, unknown>[] = [];
  for (const m of content.matchAll(TAG)) {
    if (m[1] !== undefined) {
      blocks.push({ _type: 'cosaFacciamo', testo: markdownToTesto(m[1]) });
      continue;
    }
    const a = attrsOf(m[3], scope) as Record<string, any>;
    switch (m[2]) {
      case 'AdattoA':
        blocks.push({ _type: 'adattoA', testo: a.text, eyebrow: a.eyebrow });
        break;
      case 'DiCosaCiOccupiamo':
        blocks.push({ _type: 'diCosaCiOccupiamo', voci: a.items, eyebrow: a.eyebrow });
        break;
      case 'MetodoSteps':
        blocks.push({ _type: 'metodo', passi: keyed(a.steps), intro: a.intro, eyebrow: a.eyebrow });
        break;
      case 'BandiVinti':
        blocks.push({ _type: 'bandiVinti', bandi: keyed(a.bandi), eyebrow: a.eyebrow });
        break;
      case 'CtaProgetti':
        blocks.push({ _type: 'ctaProgetti', title: a.title, schede: a.schede, href: a.href, label: a.label });
        break;
      case 'CtaBanner':
        blocks.push({
          _type: 'ctaBanner',
          title: a.title,
          body: a.body,
          primaryCta: a.primaryCta && { _type: 'link', ...a.primaryCta },
          secondaryCta: a.secondaryCta && { _type: 'link', ...a.secondaryCta },
        });
        break;
      default:
        throw new Error(`Componente sconosciuto nel corpo: <${m[2]}>`);
    }
  }
  return blocks.map((b) => ({ _key: key(), ...b })) as Array<{ _key: string; _type: string }>;
}

// ── Main ──────────────────────────────────────────────────────────────────
const files = readdirSync(CONTENT).filter((f) => /\.mdx?$/.test(f));
const tx = client.transaction();

for (const file of files) {
  const slug = file.replace(/\.mdx?$/, '');
  const { data, content } = matter(readFileSync(resolve(CONTENT, file), 'utf8'));
  const hero = serviziHero[slug];
  const card = serviziCards.find((c) => c.slug === slug);
  if (!hero || !card) throw new Error(`${slug}: dati hero o card mancanti`);

  const doc = {
    _id: `servizio-${slug}`,
    _type: 'servizio',
    slug: { _type: 'slug', current: slug },
    title: data.title,
    subtitle: data.subtitle,
    heroImage: await imageRef(data.heroImage),
    heroAlt: data.heroAlt,
    heroVariant: data.heroVariant ?? 'banner',
    audience: (data.audience ?? []).map((a: { id: string }) => a.id),
    order: data.order ?? 0,
    draft: data.draft ?? false,
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    ogImage: data.ogImage ? await imageRef(data.ogImage) : undefined,
    ogCta: data.ogCta,
    hero: {
      eyebrow: hero.eyebrow,
      headline: hero.headline,
      sub: hero.sub,
      proof: keyed(hero.proof),
      proofBar: hero.proofBar,
      outcomes: hero.outcomes,
      ctaPrimary: { _type: 'link', ...hero.ctaPrimary },
      ctaSecondary: hero.ctaSecondary && { _type: 'link', ...hero.ctaSecondary },
      ledgerLabel: hero.ledgerLabel,
      ledger: keyed(hero.ledger),
    },
    card: { title: card.title, desc: card.desc, statValue: card.statValue, statLabel: card.statLabel },
    body: bodyToBlocks(content, exportsOf(content)),
  };
  tx.createOrReplace(JSON.parse(JSON.stringify(doc))); // toglie gli undefined
  console.log(`✓ ${slug} (${doc.body.map((b) => b._type).join(', ')})`);
}

if (DRY) {
  console.log(JSON.stringify(tx.serialize().map((m: any) => m.createOrReplace), null, 1));
  process.exit(0);
}
await tx.commit();
console.log(`Migrati ${files.length} servizi, ${uploaded.size} immagini.`);
