// Storia dell'ImageCarousel. Componente interattivo (client:visible quando
// consumato in Astro): in Storybook è già hydratato di default, la
// navigazione prev/next/dots è provabile dal vivo.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import ImageCarousel from './ImageCarousel';

const colors = ['#8a6d3b', '#2f5233', '#3b5a8a'];
const sampleImages = colors.map((fill, i) => ({
  src:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="1600" height="900" fill="${fill}"/></svg>`
    ),
  alt: '',
  caption: i === 1 ? 'Una didascalia per la seconda immagine.' : undefined,
}));

const meta = {
  title: 'Molecules/ImageCarousel',
  component: ImageCarousel,
  tags: ['autodocs'],
  args: {
    images: sampleImages,
  },
} satisfies Meta<typeof ImageCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeSlides: Story = {};

export const TwoSlides: Story = {
  args: { images: sampleImages.slice(0, 2) },
};

// Foto verticali e orizzontali insieme: le verticali restano intere, con la
// stessa foto sfocata ai lati.
const verticale = {
  src:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1600"><rect width="900" height="1600" fill="#8a3b5a"/><circle cx="450" cy="800" r="300" fill="#f2c14e"/></svg>'
    ),
  alt: 'Foto verticale di prova',
};
export const MixedOrientation: Story = {
  args: { images: [verticale, sampleImages[0], verticale] },
};

// Galleria lunga (i progetti ne hanno fino a 13) su mobile: i pallini vanno
// a capo e il pulsante "Avanti" resta nello schermo.
export const ManySlidesMobile: Story = {
  args: { images: Array.from({ length: 13 }, (_, i) => sampleImages[i % sampleImages.length]) },
  globals: { viewport: { value: 'mobile1' } },
  play: async ({ canvasElement }) => {
    const next = within(canvasElement).getByRole('button', { name: 'Immagine successiva' });
    const { right } = next.getBoundingClientRect();
    await expect(right).toBeLessThanOrEqual(canvasElement.ownerDocument.documentElement.clientWidth);
  },
};

// Una sola immagine: la barra di controllo non viene resa affatto — non ci
// sarebbe nulla fra cui girare.
export const SingleSlide: Story = {
  args: { images: sampleImages.slice(0, 1) },
};

// Stato intermedio: dopo un click su Next il dot attivo non è il primo e Prev
// è disponibile. Senza questa `play` ogni snapshot Chromatic fotograferebbe
// solo lo slide 0. `storybook/test` è nel core dalla 9 — nessuna dipendenza
// in più rispetto a `storybook` che il pacchetto già installa.
export const MidSequence: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText('Immagine successiva'));
    await expect(canvas.getByLabelText('Vai all\'immagine 2')).toHaveAttribute(
      'aria-current',
      'true'
    );
  },
};

// La galleria è circolare: dall'ultima immagine Next torna alla prima, e
// Prev dalla prima porta all'ultima. Nessuno dei due bottoni è mai in uno
// stato speciale, quindi non c'è nulla da disabilitare né da annunciare come
// non disponibile.
export const WrapsAround: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const next = canvas.getByLabelText('Immagine successiva');
    // dalla prima all'ultima, poi ancora avanti
    await userEvent.click(next);
    await userEvent.click(next);
    await expect(canvas.getByLabelText('Vai all\'immagine 3')).toHaveAttribute(
      'aria-current',
      'true'
    );
    await userEvent.click(next);
    await expect(canvas.getByLabelText('Vai all\'immagine 1')).toHaveAttribute(
      'aria-current',
      'true'
    );
    // e all'indietro dalla prima si torna in fondo
    await userEvent.click(canvas.getByLabelText('Immagine precedente'));
    await expect(canvas.getByLabelText('Vai all\'immagine 3')).toHaveAttribute(
      'aria-current',
      'true'
    );
  },
};

// Stati d'interazione dei controlli (frecce e puntini), forzati con
// storybook-addon-pseudo-states.
export const ControlsHover: Story = {
  parameters: { pseudo: { hover: true } },
};

export const ControlsFocusVisible: Story = {
  parameters: { pseudo: { focusVisible: true } },
};

// Didascalia su foto bianca: il caso peggiore per la fascia al 65% su cui sta
// il testo (le foto arrivano da Sanity, può essere qualunque foto).
export const BrightImageCaption: Story = {
  args: {
    images: [
      {
        src:
          'data:image/svg+xml;utf8,' +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="1600" height="900" fill="#ffffff"/></svg>'
          ),
        alt: '',
        caption: 'Una didascalia sopra una foto bianca.',
      },
    ],
  },
};
