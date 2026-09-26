import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
// Storie di ImageSide: la figura è la stessa a sinistra e a destra (il lato è
// l'ordine nel wrapper .astro), quindi le storie non hanno una variante di lato.
import ImageSide from './ImageSide';

const placeholderSrc =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#2f5233"/></svg>'
  );

// Ritratto 9:16 con tre fasce etichettate: rende visibile come la colonna
// immagine gestisce una sorgente verticale accanto al testo.
const portraitSrc =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1600">' +
      '<rect width="900" height="533" fill="#6b5a8a"/>' +
      '<rect y="533" width="900" height="534" fill="#8a6d3b"/>' +
      '<rect y="1067" width="900" height="533" fill="#3b6d5a"/>' +
      '<g fill="#ffffff" font-family="sans-serif" font-size="96" font-weight="700" text-anchor="middle">' +
      '<text x="450" y="300">ALTO</text><text x="450" y="833">CENTRO</text><text x="450" y="1366">BASSO</text>' +
      '</g></svg>'
  );

const meta = {
  title: 'Molecules/ImageSide',
  component: ImageSide,
  tags: ['autodocs'],
  args: {
    src: placeholderSrc,
    alt: '',
  },
} satisfies Meta<typeof ImageSide>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoCaption: Story = {};

export const WithCaption: Story = {
  args: {
    caption: 'Dettaglio dell’allestimento.',
  },
};

// Sorgente verticale alta, nella larghezza che ha sul sito da 768px in su
// (mezza riga, accanto al testo): l'immagine non si ritaglia, cresce in
// altezza.
export const Portrait: Story = {
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '24rem' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    src: portraitSrc,
    width: 900,
    height: 1600,
    caption: 'Ritratto: sorgente 9:16 nella colonna immagine.',
  },
};

// Con `sources` (AVIF, poi WebP, risolti dal sito con #lib/foto) l'immagine è
// un <picture>: il browser prende la prima sorgente che sa leggere. A video non
// cambia nulla rispetto a WithCaption: è un test, non uno specimen.
export const WithSources: Story = {
  ...WithCaption,
  args: { ...WithCaption.args, sources: [{ type: 'image/avif', srcSet: `${placeholderSrc} 1600w` }, { type: 'image/webp', srcSet: `${placeholderSrc} 1600w` }] },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const tipi = [...canvasElement.querySelectorAll('picture source')].map((s) => s.getAttribute('type'));
    await expect(tipi.slice(0, 2)).toEqual(['image/avif', 'image/webp']);
    await expect(canvasElement.querySelector('picture img')).not.toBeNull();
  },
};
