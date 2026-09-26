// LQIP (low quality image placeholder): una miniatura sfocata della foto,
// scritta dentro l'HTML come data: URI, che occupa il posto dell'immagine
// finché questa non arriva. Si calcola a build time dall'URL Sanity (che porta
// già il crop dello Studio, così l'inquadratura non salta al passaggio a
// nitido): la richiesta a cdn.sanity.io avviene solo in build, nel sito
// pubblicato resta testo nell'HTML (vedi sanityCdnGuard).
import sharp from 'sharp';

const LATO = 20; // px del lato lungo: ~300 byte, basta per colori e masse

/**
 * Data URI SVG con la miniatura e un filtro di sfocatura: il browser la
 * ingrandisce morbida, senza i quadrettoni di un'immagine da 20px. Il
 * feFuncA tiene opachi i bordi, che la sfocatura renderebbe trasparenti.
 * `undefined` se la foto non si scarica: il segnaposto è un di più, non deve
 * rompere il build.
 */
export async function lqip(src: string, logger?: { warn: (msg: string) => void }): Promise<string | undefined> {
  try {
    const url = new URL(src);
    url.searchParams.set('w', String(LATO * 4));
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data, info } = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(LATO, LATO, { fit: 'inside' })
      .webp({ quality: 50 })
      .toBuffer({ resolveWithObject: true });
    const svg =
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${info.width} ${info.height}'>` +
      `<filter id='b' color-interpolation-filters='sRGB'><feGaussianBlur stdDeviation='1'/>` +
      `<feComponentTransfer><feFuncA type='discrete' tableValues='1 1'/></feComponentTransfer></filter>` +
      `<image width='100%' height='100%' preserveAspectRatio='none' filter='url(%23b)' ` +
      `href='data:image/webp;base64,${data.toString('base64')}'/></svg>`;
    return `data:image/svg+xml;charset=utf-8,${svg.replace(/</g, '%3C').replace(/>/g, '%3E')}`;
  } catch (err) {
    (logger ?? console).warn(`segnaposto LQIP non generato per ${src}: ${(err as Error).message}`);
    return undefined;
  }
}

/** Valore CSS per il segnaposto (custom property `--placeholder`), o nulla. */
export function placeholderStyle(dataUri: string | undefined): string | undefined {
  return dataUri ? `--placeholder: url("${dataUri}")` : undefined;
}
