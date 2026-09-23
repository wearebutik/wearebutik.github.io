// Renderer delle card OG: costruisce l'albero con Satori (solo flexbox + CSS
// basilare) e lo rasterizza in PNG con resvg. Gira a build-time dentro
// l'endpoint /og/[...path].png.ts. Tre layout:
//   - plain : "Editoriale chiaro" (servizi, chi-siamo, contatti)
//   - split : testo + pannello logo (home)
//   - bleed : hero a tutta card + scrim (progetti)
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { OgCard } from '../../data/ogCards';

// Path risolti dalla root del progetto: durante `astro build` cwd è la root e
// src/ esiste (l'import.meta.url verrebbe riscritto dal bundler verso dist/).
const fromRoot = (p: string) => join(process.cwd(), p);

// Font TTF dedicati alle card (Satori non legge i woff2 del sito).
const spartan700 = readFileSync(fromRoot('src/assets/fonts-og/league-spartan-700.ttf'));
const clear400 = readFileSync(fromRoot('src/assets/fonts-og/clear-sans-latin-400.ttf'));
const clear700 = readFileSync(fromRoot('src/assets/fonts-og/clear-sans-latin-700.ttf'));

// Logo come data URI (Satori lo incorpora nell'<img>).
const logoSvg = readFileSync(fromRoot('src/assets/logos/bollo-rosso.svg'));
const logoDataUri = `data:image/svg+xml;base64,${logoSvg.toString('base64')}`;

const RED = '#e21929';
const DARK = '#071108';
const LIGHT = '#fff2f1';
const GREEN = '#d2ff28';
const SPARTAN = 'League Spartan';
const CLEAR = 'Clear Sans';

// Mini-helper per costruire l'albero senza JSX (file .ts).
type Node = { type: string; props: Record<string, unknown> };
function h(type: string, style: Record<string, unknown>, children?: unknown): Node {
  return { type, props: { style, ...(children !== undefined ? { children } : {}) } };
}
function img(src: string, style: Record<string, unknown>): Node {
  return { type: 'img', props: { src, style } };
}

/** Tronca un testo a maxChars parole intere, aggiungendo l'ellissi. */
function clamp(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxChars).trimEnd()}…`;
}

// Freccia come SVG inline: il glifo "→" non è nel subset di League Spartan,
// così resta nitida e indipendente dal font.
function arrowDataUri(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="20" y2="12"/><polyline points="13 5 20 12 13 19"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/** Hero del progetto come data URI (JPEG 1200×630 dalla CDN Sanity). null se non scaricabile. */
async function heroDataUri(url: string): Promise<string | null> {
  const res = await fetch(`${url}?w=1200&h=630&fit=crop&fm=jpg&q=80`);
  if (!res.ok) return null;
  return `data:image/jpeg;base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
}

/** Riga finale comune: handle (bollo + @) a sinistra, CTA pill rossa a destra. */
function footerRow(card: OgCard, handle: string, urlColor: string): Node {
  return h('div', {
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  }, [
    h('div', { display: 'flex', alignItems: 'center' }, [
      img(logoDataUri, { width: 64, height: 64 }),
      h('div', {
        fontFamily: SPARTAN,
        fontSize: 30,
        letterSpacing: '0.04em',
        color: urlColor,
        marginLeft: 20,
      }, handle),
    ]),
    h('div', {
      display: 'flex',
      alignItems: 'center',
      fontFamily: SPARTAN,
      fontSize: 32,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: LIGHT,
      backgroundColor: RED,
      padding: '22px 40px',
      borderRadius: 999,
    }, [
      h('div', {}, card.cta),
      img(arrowDataUri(LIGHT), { width: 30, height: 30, marginLeft: 16 }),
    ]),
  ]);
}

function eyebrow(text: string, color: string): Node {
  return h('div', {
    fontFamily: SPARTAN,
    fontSize: 28,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color,
  }, text);
}

function metaLine(meta: string[], color: string, opacity: number, marginTop: number): Node {
  return h('div', {
    fontFamily: SPARTAN,
    fontSize: 24,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color,
    opacity,
    marginTop,
  }, meta.join('  ·  '));
}

// ── plain ───────────────────────────────────────────────────────────────
function buildPlain(card: OgCard, handle: string): Node {
  const head: Node[] = [
    eyebrow(card.kind, RED),
    h('div', { fontFamily: SPARTAN, fontSize: 72, lineHeight: 1, color: DARK, marginTop: 16 }, clamp(card.title, 70)),
    h('div', {
      fontFamily: CLEAR, fontSize: 32, lineHeight: 1.35, color: DARK,
      opacity: 0.88, marginTop: 20, maxWidth: 920,
    }, clamp(card.subtitle, 130)),
  ];
  if (card.meta?.length) head.push(metaLine(card.meta, DARK, 0.7, 18));

  return h('div', {
    width: 1200, height: 630, display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between', backgroundColor: LIGHT, padding: '72px 80px',
  }, [h('div', { display: 'flex', flexDirection: 'column' }, head), footerRow(card, handle, DARK)]);
}

// ── home: composizione centrata su tre fasce ──────────────────────────────
//   alto:   titolo piccolo · centro: bollo grande + @handle · basso: eyebrow
function buildHome(card: OgCard): Node {
  return h('div', {
    width: 1200, height: 630, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: LIGHT, padding: '72px 80px', textAlign: 'center',
  }, [
    // alto: titolo, più piccolo
    h('div', {
      fontFamily: SPARTAN, fontSize: 44, lineHeight: 1.1, color: DARK,
      textAlign: 'center', maxWidth: 900,
    }, clamp(card.title, 64)),
    // centro: bollo grande + handle
    h('div', { display: 'flex', alignItems: 'center' }, [
      img(logoDataUri, { width: 200, height: 200 }),
      h('div', {
        fontFamily: SPARTAN, fontSize: 44, letterSpacing: '0.04em', color: DARK, marginLeft: 28,
      }, '@wearebutik'),
    ]),
    // basso: eyebrow
    eyebrow(card.kind, RED),
  ]);
}

// ── bleed (progetti): hero a tutta card + scrim ──────────────────────────
function buildBleed(card: OgCard, handle: string, hero: string): Node {
  const content: Node[] = [
    eyebrow(card.kind, GREEN),
    h('div', { fontFamily: SPARTAN, fontSize: 76, lineHeight: 1, color: LIGHT, marginTop: 16 }, clamp(card.title, 64)),
  ];
  if (card.meta?.length) content.push(metaLine(card.meta, LIGHT, 0.85, 16));
  content.push(h('div', { display: 'flex', marginTop: 36 }, [footerRow(card, handle, LIGHT)]));

  return h('div', { width: 1200, height: 630, display: 'flex', position: 'relative' }, [
    img(hero, { position: 'absolute', top: 0, left: 0, width: 1200, height: 630, objectFit: 'cover' }),
    h('div', {
      position: 'absolute', top: 0, left: 0, width: 1200, height: 630,
      backgroundImage: `linear-gradient(to top, rgba(7,17,8,0.94) 0%, rgba(7,17,8,0.55) 42%, rgba(7,17,8,0.12) 100%)`,
    }),
    h('div', {
      position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      width: 1200, height: 630, padding: '64px 80px',
    }, content),
  ]);
}

async function buildCard(card: OgCard, handle: string): Promise<Node> {
  if (card.layout === 'home') return buildHome(card);
  if (card.layout === 'bleed' && card.hero) {
    const hero = await heroDataUri(card.hero);
    if (hero) return buildBleed(card, handle, hero);
    // hero mancante → fallback al layout chiaro, niente card rotta
  }
  return buildPlain(card, handle);
}

export async function renderCardPng(card: OgCard, handle: string): Promise<Buffer> {
  const svg = await satori((await buildCard(card, handle)) as unknown as never, {
    width: 1200,
    height: 630,
    fonts: [
      { name: SPARTAN, data: spartan700, weight: 700, style: 'normal' },
      { name: CLEAR, data: clear400, weight: 400, style: 'normal' },
      { name: CLEAR, data: clear700, weight: 700, style: 'normal' },
    ],
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
    .render()
    .asPng();
  return Buffer.from(png);
}
