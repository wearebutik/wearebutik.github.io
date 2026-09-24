import type { Meta, StoryObj } from '@storybook/react-vite';
import ImageBlock from './ImageBlock';

const placeholderSrc =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="1600" height="900" fill="#8a6d3b"/></svg>'
  );

// Ritratto 9:16 con tre fasce etichettate: rende visibile quanto il
// `cover` del frame ad altezza fissa taglia in alto e in basso.
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
  title: 'Molecules/ImageBlock',
  component: ImageBlock,
  tags: ['autodocs'],
  args: {
    src: placeholderSrc,
    alt: '',
  },
} satisfies Meta<typeof ImageBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoCaption: Story = {};

export const WithCaption: Story = {
  args: {
    caption: 'Il team al lavoro durante il workshop di co-progettazione.',
  },
};

// Sorgente verticale: il frame ha altezza fissa (20rem, 500px da 768px) con
// object-fit: cover, quindi è il rapporto d'aspetto a decidere il ritaglio.
// Su un ritratto il cover tiene solo la fascia centrale.
export const Portrait: Story = {
  args: {
    src: portraitSrc,
    width: 900,
    height: 1600,
    caption: 'Ritratto: il frame tiene la fascia centrale e taglia alto e basso.',
  },
};
