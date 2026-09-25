import type { Meta, StoryObj } from '@storybook/react-vite';
import ImageRight from './ImageRight';

const placeholderSrc =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#3b5a8a"/></svg>'
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
  title: 'Molecules/ImageRight',
  component: ImageRight,
  tags: ['autodocs'],
  args: {
    src: placeholderSrc,
    alt: '',
  },
} satisfies Meta<typeof ImageRight>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoCaption: Story = {};

export const WithCaption: Story = {
  args: {
    caption: 'Vista dall’alto dello spazio espositivo.',
  },
};

// Sorgente verticale alta: verifica il ritaglio nella colonna immagine.
export const Portrait: Story = {
  args: {
    src: portraitSrc,
    width: 900,
    height: 1600,
    caption: 'Ritratto: sorgente 9:16 nella colonna immagine.',
  },
};
