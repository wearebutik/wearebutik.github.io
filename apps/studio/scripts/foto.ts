// Foto del sito: carica le immagini di un file di assegnazioni e le collega ai
// documenti (header, gallerie, foto delle pagine).
//
//   SANITY_STUDIO_DATASET=anteprima pnpm --filter @butik/studio foto <assegnazioni.json> [--prova]
//
// Le foto si leggono da FOTO_DIR (default: ~/Downloads/fotografie per il sito).
// Prima del caricamento ogni foto è ridimensionata (lato lungo 2400 px), ruotata
// secondo l'EXIF e salvata in JPEG senza metadati (niente GPS né dati della
// fotocamera). Sanity identifica un asset dall'hash del file: la stessa foto
// dà lo stesso asset in ogni dataset, e rieseguire lo script non duplica nulla.
// HEIC: convertito prima con `sips` (macOS).
//
// Il file di assegnazioni è una lista di voci:
//   { "_id": "progetto-x",
//     "crea": { "_type": "progetto", "title": "…", "slug": "…", "subtitle": "…" },  // solo se non esiste
//     "campi": { "heroImage": { "file": "progetti/X/a.jpg", "alt": "…", "altCampo": "heroAlt" },
//                "heroImages": [{ "file": "…", "alt": "…" }],
//                "founders": [{ "photo": { "file": "…" } }] },   // per posizione
//     "galleria": [{ "file": "…", "alt": "…" }] }                // carosello nel corpo
// Un `file` che inizia con `./` si legge accanto al file di assegnazioni.
//   { "elimina": "progetto-y" }
// `galleria` sostituisce tutti i blocchi immagine del corpo con un solo
// carosello, dove stava il primo blocco immagine (o in fondo); una `galleria`
// vuota toglie i blocchi immagine e basta.
// Con --prova stampa cosa farebbe, senza caricare né scrivere.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { getCliClient } from 'sanity/cli';
import sharp from 'sharp';

const client = getCliClient({ apiVersion: '2026-09-01' });
const FOTO_DIR = process.env.FOTO_DIR ?? join(homedir(), 'Downloads/fotografie per il sito');
const LATO = 2400;

type Foto = { file: string; alt?: string; altCampo?: string };
type Voce =
  | { _id: string; crea?: Record<string, any>; campi?: Record<string, any>; galleria?: Foto[] }
  | { elimina: string };

const args = process.argv.slice(2).filter((a) => a !== '--');
const prova = args.includes('--prova');
const file = args.find((a) => !a.startsWith('--'));
if (!file) {
  console.error('Uso: foto <assegnazioni.json> [--prova]');
  process.exit(1);
}
const voci: Voce[] = JSON.parse(readFileSync(resolve(process.cwd(), file), 'utf8'));

// ── Caricamento ───────────────────────────────────────────────────────────
const tmp = mkdtempSync(join(tmpdir(), 'butik-foto-'));
const caricate = new Map<string, string>();

async function carica(rel: string): Promise<string> {
  const hit = caricate.get(rel);
  if (hit) return hit;
  // `./…`: file accanto alle assegnazioni (es. il segnaposto grigio).
  let src = rel.startsWith('./') ? resolve(dirname(resolve(process.cwd(), file!)), rel) : join(FOTO_DIR, rel);
  if (/\.heic$/i.test(src)) {
    const jpg = join(tmp, `${basename(src, extname(src))}.jpg`);
    execFileSync('sips', ['-s', 'format', 'jpeg', src, '--out', jpg], { stdio: 'ignore' });
    src = jpg;
  }
  const buf = await sharp(src)
    .rotate()
    .resize({ width: LATO, height: LATO, fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  const nome = `${basename(rel, extname(rel)).replace(/[^\w.-]+/g, '-')}.jpg`;
  const id = prova ? `image-(${nome})` : (await client.assets.upload('image', buf, { filename: nome }))._id;
  caricate.set(rel, id);
  return id;
}

const ref = (id: string) => ({ _type: 'reference', _ref: id });
let seq = 0;
const key = () => `f${(seq++).toString(36)}`;

const IMMAGINI = new Set(['imageBlock', 'imageSide', 'imageCarousel']);
const isFoto = (v: any): v is Foto => v && typeof v === 'object' && typeof v.file === 'string';

/** Valore dal file di assegnazioni → valore Sanity, fuso con l'attuale. */
async function valore(v: any, attuale: any, dentroLista = false): Promise<any> {
  if (isFoto(v)) {
    return dentroLista
      ? { _type: 'figura', _key: key(), asset: ref(await carica(v.file)), ...(v.alt && { alt: v.alt }) }
      : { _type: 'image', asset: ref(await carica(v.file)) };
  }
  if (Array.isArray(v)) {
    // Lista di foto: sostituita. Lista di oggetti: fusa per posizione.
    if (v.every(isFoto)) return Promise.all(v.map((x) => valore(x, undefined, true)));
    return Promise.all(v.map((x, i) => valore(x, attuale?.[i])));
  }
  if (v && typeof v === 'object') {
    const out = { ...(attuale ?? {}) };
    for (const [k, x] of Object.entries(v)) {
      out[k] = await valore(x, attuale?.[k]);
      if (isFoto(x) && x.altCampo) out[x.altCampo] = x.alt;
    }
    return out;
  }
  return v;
}

// ── Main ──────────────────────────────────────────────────────────────────
const tx = client.transaction();
for (const voce of voci) {
  if ('elimina' in voce) {
    console.log(`- ${voce.elimina}`);
    tx.delete(voce.elimina);
    continue;
  }
  const attuale = await client.getDocument(voce._id);
  if (!attuale && !voce.crea) throw new Error(`${voce._id}: non esiste e manca "crea"`);
  let doc: Record<string, any> = attuale ?? {
    _id: voce._id,
    ...voce.crea,
    ...(voce.crea?.slug && { slug: { _type: 'slug', current: voce.crea.slug } }),
  };
  for (const [k, v] of Object.entries(voce.campi ?? {})) {
    doc[k] = await valore(v, doc[k]);
    if (isFoto(v) && v.altCampo) doc[v.altCampo] = v.alt;
  }
  if (voce.galleria) {
    const carosello = voce.galleria.length
      ? [{ _type: 'imageCarousel', _key: key(), images: await valore(voce.galleria, undefined) }]
      : [];
    // Il carosello prende il posto del primo blocco immagine; dei blocchi
    // "immagine + testo" resta il testo.
    const body: any[] = doc.body ?? [];
    const senzaImmagini = (bs: any[]) => bs.flatMap((b) => (b._type === 'imageSide' ? (b.text ?? []) : IMMAGINI.has(b._type) ? [] : [b]));
    const primo = body.findIndex((b) => IMMAGINI.has(b._type));
    const senza = senzaImmagini(body);
    const at = primo === -1 ? senza.length : senzaImmagini(body.slice(0, primo)).length;
    doc.body = [...senza.slice(0, at), ...carosello, ...senza.slice(at)];
  }
  console.log(`${attuale ? '~' : '+'} ${voce._id}`);
  tx.createOrReplace(doc as any);
}
console.log(`${caricate.size} foto ${prova ? 'da caricare' : 'caricate'}.`);
if (!prova) {
  await tx.commit();
  console.log('Scritto.');
}
