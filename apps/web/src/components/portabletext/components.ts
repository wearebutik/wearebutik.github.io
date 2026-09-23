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
