// Testi del sito come file, per preparare versioni alternative e riapplicarle.
//
//   SANITY_STUDIO_DATASET=anteprima pnpm --filter @butik/studio testi esporta <cartella>
//   SANITY_STUDIO_DATASET=anteprima pnpm --filter @butik/studio testi genera <cartella> <file.ndjson>
//
// `esporta` scrive un file per documento (progetti, servizi, pagine):
// `<_id>.md`, con i campi di testo nel frontmatter YAML e, per i progetti, il
// corpo in Markdown. I campi Portable Text diventano Markdown; le immagini
// restano fuori (le gestisce scripts/foto.ts).
//
// `genera` fa il contrario: legge i file della cartella, prende dal dataset la
// versione attuale di ogni documento (o ne crea uno nuovo, se l'_id non
// esiste), sostituisce i campi presenti nel file e scrive un NDJSON dei soli
// documenti cambiati, da importare con
//   sanity dataset import <file.ndjson> <dataset> --replace
// Le immagini del documento attuale si conservano: nei progetti il marcatore
// `<!-- galleria -->` nel corpo indica dove vanno i blocchi immagine, nei
// servizi una voce `- _type: galleria` fra le sezioni. Senza marcatore, i
// blocchi immagine finiscono in fondo. Ripetibile: stesso input, stesso NDJSON.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getCliClient } from 'sanity/cli';
import { createSchema } from 'sanity';
import { htmlToBlocks } from '@portabletext/block-tools';
import { JSDOM } from 'jsdom';
import matter from 'gray-matter';
import { marked } from 'marked';
import { schemaTypes } from '../schemaTypes';

const client = getCliClient({ apiVersion: '2026-09-01' });
// createSchema aggiunge i tipi di base (slug, image, block…) ai nostri.
const schema = createSchema({ name: 'butik', types: schemaTypes });

const TIPI = ['progetto', 'servizio', ...schemaTypes.map((t) => t.name).filter((n) => n.startsWith('pagina'))];
const SISTEMA = new Set(['_id', '_rev', '_createdAt', '_updatedAt', '_type', '_key']);
const MARCATORE = '<!-- galleria -->';
// Testi alternativi delle immagini: li scrive scripts/foto.ts, non questi file.
const ALT = new Set(['heroAlt', 'heroImageAlt', 'aboutImageAlt']);

type Tipo = Record<string, any>;
type Valore = any;

// ── Tipi dello schema ─────────────────────────────────────────────────────
const isBlock = (t: Tipo) => t?.name === 'block' || t?.type?.name === 'block';
const isBlockArray = (t: Tipo) => t?.jsonType === 'array' && t.of?.some(isBlock);
const isImage = (t: Tipo): boolean => !!t && (t.name === 'image' || isImage(t.type));
const isSlug = (t: Tipo): boolean => !!t && (t.name === 'slug' || isSlug(t.type));
const isImageValue = (v: Valore) => v && typeof v === 'object' && (v.asset || ['image', 'figura'].includes(v._type));
const isImageBlock = (v: Valore) => v && ['imageBlock', 'imageSide', 'imageCarousel'].includes(v._type);
const campo = (t: Tipo, nome: string) => t?.fields?.find((f: Tipo) => f.name === nome)?.type;
const membro = (t: Tipo, v: Valore) =>
  t.of.find((m: Tipo) => m.name === v?._type) ?? (t.of.length === 1 ? t.of[0] : undefined);

// ── Portable Text ↔ Markdown ──────────────────────────────────────────────
function toMarkdown(blocks: Valore[]): string {
  const righe: string[] = [];
  let lista = '';
  for (const b of blocks ?? []) {
    if (b._type !== 'block') continue;
    const defs = Object.fromEntries((b.markDefs ?? []).map((d: Valore) => [d._key, d]));
    const testo = (b.children ?? [])
      .map((s: Valore) => {
        const marks: string[] = s.marks ?? [];
        const raw: string = s.text ?? '';
        // Gli spazi ai bordi restano fuori dai segni: `** x**` non è grassetto.
        const [, prima, corpo, dopo] = raw.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
        if (!corpo) return raw;
        let t = marks.includes('code') ? `\`${corpo}\`` : corpo.replace(/([\\*_`[\]])/g, '\\$1');
        for (const m of marks) {
          if (m === 'strong') t = `**${t}**`;
          else if (m === 'em') t = `*${t}*`;
          else if (defs[m]?.href) t = `[${t}](${defs[m].href})`;
        }
        return `${prima}${t}${dopo}`.replace(/\n/g, '  \n');
      })
      .join('');
    const inLista = b.listItem ? (b.listItem === 'number' ? '1. ' : '- ') : '';
    if (lista && !inLista) righe.push('');
    lista = inLista;
    const pre = b.style === 'h2' ? '## ' : b.style === 'h3' ? '### ' : b.style === 'h4' ? '#### ' : b.style === 'blockquote' ? '> ' : '';
    righe.push(inLista ? `${inLista}${testo}` : `${pre}${testo}`);
    if (!inLista) righe.push('');
  }
  return righe.join('\n').trim();
}

let seq = 0;
const key = () => `t${(seq++).toString(36)}`;

function fromMarkdown(md: string, tipo: Tipo): Valore[] {
  const html = marked.parse(String(md ?? ''), { async: false });
  return htmlToBlocks(html, tipo, { parseHtml: (h) => new JSDOM(h).window.document }).map((b: Valore) => ({
    ...b,
    _key: key(),
    ...(Array.isArray(b.children) && { children: b.children.map((c: Valore) => ({ ...c, _key: key() })) }),
    ...(Array.isArray(b.markDefs) && b.markDefs.length && { markDefs: b.markDefs }),
  }));
}

// ── Esporta: documento → dati del file ────────────────────────────────────
function esportaValore(v: Valore, t: Tipo): Valore {
  if (v === undefined || v === null || isImageValue(v) || isImage(t)) return undefined;
  if (isSlug(t)) return v.current;
  if (isBlockArray(t)) return toMarkdown(v);
  if (Array.isArray(v)) {
    return v
      .map((item) => {
        if (isImageBlock(item)) return { _type: 'galleria' };
        const m = t?.of ? membro(t, item) : undefined;
        return esportaValore(item, m);
      })
      .filter((x) => x !== undefined)
      .filter((x, i, a) => !(x?._type === 'galleria' && a[i - 1]?._type === 'galleria'));
  }
  if (typeof v === 'object') {
    const out: Record<string, Valore> = {};
    if (v._type && t?.jsonType === 'object' && t.name !== v._type) out._type = v._type;
    if (v._type && t?.name === v._type && t.name !== 'object' && !['link'].includes(v._type)) out._type = v._type;
    for (const [k, x] of Object.entries(v)) {
      if (SISTEMA.has(k) || k.startsWith('_system')) continue;
      const e = esportaValore(x, campo(t, k));
      if (e !== undefined && e !== '') out[k] = e;
    }
    return out;
  }
  return v;
}

function esporta(dir: string, docs: Valore[]) {
  mkdirSync(dir, { recursive: true });
  for (const doc of docs) {
    const tipo = schema.get(doc._type);
    const { body, ...resto } = doc;
    const dati = esportaValore(resto, tipo);
    let corpo = '';
    if (doc._type === 'progetto') {
      corpo = (body ?? [])
        .reduce((acc: Valore[][], b: Valore) => {
          const img = b._type !== 'block';
          if (img && acc.at(-1)?.[0] === MARCATORE) return acc;
          acc.push(img ? [MARCATORE] : [b]);
          return acc;
        }, [])
        .map((g: Valore[]) => (g[0] === MARCATORE ? MARCATORE : toMarkdown(g)))
        .join('\n\n');
    } else if (body !== undefined) {
      dati.body = esportaValore(body, campo(tipo, 'body'));
    }
    writeFileSync(resolve(dir, `${doc._id}.md`), matter.stringify(corpo ? `\n${corpo}\n` : '', { _type: doc._type, ...dati }));
  }
  console.log(`Esportati ${docs.length} documenti in ${dir}`);
}

// ── Genera: dati del file → documento ─────────────────────────────────────
/** Nuovo valore del campo `t`: testo dal file, immagini dal documento attuale. */
function costruisci(v: Valore, t: Tipo, attuale: Valore): Valore {
  if (v === undefined || v === null) return undefined;
  if (isSlug(t)) return { _type: 'slug', current: v };
  if (isBlockArray(t) && typeof v === 'string') {
    const blocchi = fromMarkdown(v, t);
    return blocchi;
  }
  if (Array.isArray(v)) {
    const immagini = (Array.isArray(attuale) ? attuale : []).filter(isImageBlock);
    let usate = false;
    const out: Valore[] = [];
    v.forEach((item, i) => {
      if (item?._type === 'galleria') {
        if (!usate) out.push(...immagini);
        usate = true;
        return;
      }
      const m = t?.of ? membro(t, item) : undefined;
      const prec = Array.isArray(attuale) ? attuale.filter((x) => !isImageBlock(x))[i] : undefined;
      const x = costruisci(item, m, prec);
      if (x && typeof x === 'object' && !Array.isArray(x)) {
        x._key = key();
        if (!x._type && m && m.name !== 'object' && (!prec || prec._type)) x._type = m.name;
      }
      out.push(x);
    });
    if (!usate && immagini.length) out.push(...immagini);
    return out;
  }
  if (typeof v === 'object') {
    const out: Record<string, Valore> = {};
    // Immagini del valore attuale: restano.
    for (const [k, x] of Object.entries(attuale ?? {})) if (isImageValue(x)) out[k] = x;
    if (t?.name && t.name !== 'object' && t.jsonType === 'object' && (!attuale || attuale._type)) out._type = t.name;
    for (const [k, x] of Object.entries(v)) {
      if (k === '_type') {
        out._type = x;
        continue;
      }
      const c = costruisci(x, campo(t, k), attuale?.[k]);
      if (c !== undefined) out[k] = c;
    }
    return out;
  }
  return v;
}

function corpoProgetto(md: string, tipo: Tipo, attuale: Valore[] = []): Valore[] {
  // Gruppi di blocchi immagine consecutivi: il gruppo i va all'i-esimo
  // marcatore, quelli in più in fondo.
  const gruppi = attuale.reduce((acc: Valore[][], b: Valore, i: number) => {
    if (isImageBlock(b)) (isImageBlock(attuale[i - 1]) ? acc.at(-1)! : acc[acc.push([]) - 1]).push(b);
    return acc;
  }, []);
  const parti = md.split(MARCATORE);
  const out: Valore[] = [];
  parti.forEach((p, i) => {
    if (p.trim()) out.push(...fromMarkdown(p, tipo));
    if (i < parti.length - 1 && gruppi[i]) out.push(...gruppi[i]);
  });
  for (const g of gruppi.slice(parti.length - 1)) out.push(...g);
  return out;
}

// Confronto senza campi di sistema né _key (rigenerati a ogni esecuzione).
function impronta(v: Valore): Valore {
  if (Array.isArray(v)) return v.map(impronta);
  if (!v || typeof v !== 'object') return v;
  const o = Array.isArray(v.markDefs) && v.markDefs.length ? chiaviLink(v) : v;
  return Object.fromEntries(
    Object.entries(o)
      .filter(([k]) => !['_key', '_rev', '_createdAt', '_updatedAt'].includes(k))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, x]) => [k, impronta(x)]),
  );
}

/** Chiavi dei link di un blocco riscritte per posizione (m0, m1…). */
function chiaviLink(b: Valore): Valore {
  const map = Object.fromEntries(b.markDefs.map((d: Valore, i: number) => [d._key, `m${i}`]));
  return {
    ...b,
    markDefs: b.markDefs.map((d: Valore) => ({ ...d, _key: map[d._key] })),
    children: b.children.map((c: Valore) => ({ ...c, marks: (c.marks ?? []).map((m: string) => map[m] ?? m) })),
  };
}

/** Percorsi dei campi che cambiano (DIFF=1), per controllare cosa scrive. */
function differenze(a: Valore, b: Valore, p: string) {
  if (JSON.stringify(a) === JSON.stringify(b)) return;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) differenze(a[k], b[k], `${p}.${k}`);
  } else console.log(`   ${p}: ${JSON.stringify(a)?.slice(0, 90)} → ${JSON.stringify(b)?.slice(0, 90)}`);
}

async function genera(dir: string, out: string) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
  const ids = files.map((f) => f.replace(/\.md$/, ''));
  const attuali: Record<string, Valore> = Object.fromEntries(
    (await client.fetch<Valore[]>('*[_id in $ids]', { ids })).map((d) => [d._id, d]),
  );
  const righe: string[] = [];
  for (const f of files) {
    seq = 0;
    const _id = f.replace(/\.md$/, '');
    const { data, content } = matter(readFileSync(resolve(dir, f), 'utf8'));
    const attuale = attuali[_id];
    const _type = attuale?._type ?? data._type;
    const tipo = schema.get(_type);
    if (!tipo) throw new Error(`${f}: tipo "${_type}" sconosciuto`);
    const doc: Record<string, Valore> = { ...(attuale ?? {}), _id, _type };
    for (const k of ['_rev', '_createdAt', '_updatedAt']) delete doc[k];
    for (const [k, v] of Object.entries(data)) {
      if (k === '_type') continue;
      if (!campo(tipo, k)) throw new Error(`${f}: campo "${k}" assente nello schema di ${_type}`);
      doc[k] = costruisci(v, campo(tipo, k), attuale?.[k]);
    }
    // Un campo di testo che il documento ha ma il file no è stato tolto: via
    // anche dal documento. Le immagini non sono nei file e restano.
    for (const k of Object.keys(attuale ?? {})) {
      if (SISTEMA.has(k) || ALT.has(k) || k.startsWith('_') || k in data || (k === 'body' && _type === 'progetto')) continue;
      if (esportaValore(attuale[k], campo(tipo, k)) !== undefined) delete doc[k];
    }
    if (_type === 'progetto' && content.trim()) doc.body = corpoProgetto(content, campo(tipo, 'body'), attuale?.body);
    const pulito = JSON.parse(JSON.stringify(doc));
    if (attuale && JSON.stringify(impronta(pulito)) === JSON.stringify(impronta(attuale))) continue;
    if (attuale && process.env.DIFF) differenze(impronta(attuale), impronta(pulito), _id);
    righe.push(JSON.stringify(pulito));
    console.log(`${attuale ? '~' : '+'} ${_id}`);
  }
  writeFileSync(out, righe.join('\n') + '\n');
  console.log(`${righe.length} documenti cambiati → ${out}`);
}

// ── Main ──────────────────────────────────────────────────────────────────
const [cmd, dir, out] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (cmd === 'esporta' && dir) {
  esporta(resolve(process.cwd(), dir), await client.fetch(`*[_type in $tipi && !(_id in path("drafts.**"))] | order(_id)`, { tipi: TIPI }));
} else if (cmd === 'genera' && dir && out) {
  await genera(resolve(process.cwd(), dir), resolve(process.cwd(), out));
} else {
  console.error('Uso: testi esporta <cartella> | testi genera <cartella> <file.ndjson>');
  process.exit(1);
}
