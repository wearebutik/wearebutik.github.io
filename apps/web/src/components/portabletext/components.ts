// Mappa dei blocchi custom del corpo Portable Text sui componenti del sito.
import PtImageBlock from './PtImageBlock.astro';
import PtImageSide from './PtImageSide.astro';
import PtImageCarousel from './PtImageCarousel.astro';

export const portableTextComponents = {
  type: {
    imageBlock: PtImageBlock,
    imageSide: PtImageSide,
    imageCarousel: PtImageCarousel,
  },
};

// Sezioni del corpo di un servizio.
import PtServizioSezione from './PtServizioSezione.astro';

export const servizioComponents = {
  type: {
    ...Object.fromEntries(
      ['cosaFacciamo', 'adattoA', 'diCosaCiOccupiamo', 'metodo', 'bandiVinti', 'ctaProgetti', 'ctaBanner'].map((t) => [
        t,
        PtServizioSezione,
      ]),
    ),
    // Le foto usano gli stessi blocchi del corpo dei progetti.
    imageBlock: PtImageBlock,
    imageCarousel: PtImageCarousel,
  },
};
