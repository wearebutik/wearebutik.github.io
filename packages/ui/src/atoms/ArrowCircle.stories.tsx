// Storie di ArrowCircle per il workshop @butik/ui. L'atomo non è un link:
// ogni storia lo mette dentro un antenato con `data-arrow-circle-host`, come
// fanno ArrowLink e le card dei servizi, perché è l'hover o il focus di
// quell'antenato ad accendere il cerchio.
import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import ArrowCircle from './ArrowCircle';

// Host minimo: un link che porta l'attributo-hook, con il nome accessibile
// che in produzione viene dal testo del link o della card.
const Host = ({ children }: { children: ReactNode }) => (
  <a href="#" data-arrow-circle-host aria-label="Vai al servizio" style={{ display: 'inline-flex' }}>
    {children}
  </a>
);

const meta = {
  title: 'Atoms/ArrowCircle',
  component: ArrowCircle,
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: ['default', 'invert'],
      description: 'Tonalità: default su fondo chiaro, invert su fondo scuro o fotografico.',
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md'],
      description: 'Misura: sm (28px, accanto al testo), md (32px, da sola in una card).',
    },
  },
  args: { tone: 'default', size: 'sm' },
  decorators: [
    (Story) => (
      <Host>
        <Story />
      </Host>
    ),
  ],
} satisfies Meta<typeof ArrowCircle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DefaultHover: Story = {
  parameters: { pseudo: { hover: true } },
};

export const DefaultFocusVisible: Story = {
  parameters: { pseudo: { focusVisible: true } },
};

// L'accento del tono default si eredita dal contesto (--accent), come nelle
// card dei servizi con un colore per categoria.
export const AccentFromContext: Story = {
  decorators: [
    (Story) => (
      <div style={{ ['--accent' as string]: 'var(--color-accent-2)' }}>
        <Story />
      </div>
    ),
  ],
};

export const AccentFromContextHover: Story = {
  ...AccentFromContext,
  parameters: { pseudo: { hover: true } },
};

const onDark = (Story: () => ReactNode) => (
  <div style={{ background: 'var(--color-bg-invert)', padding: 'var(--space-8)' }}>
    <Story />
  </div>
);

export const Invert: Story = {
  args: { tone: 'invert' },
  decorators: [onDark],
};

export const InvertHover: Story = {
  ...Invert,
  parameters: { pseudo: { hover: true } },
};

// L'uso reale: la card-servizio in vetro sulle foto dell'hero della home,
// misura md. Il velo al 60% e il vetro della card sono approssimati con un
// fondo fotografico a righe e un velo scuro.
const onPhoto = (Story: () => ReactNode) => (
  <div
    style={{
      padding: 'var(--space-8)',
      backgroundColor: 'var(--color-bg)',
      backgroundImage:
        'linear-gradient(0deg, color-mix(in srgb, var(--color-fg) 60%, transparent), color-mix(in srgb, var(--color-fg) 60%, transparent)), repeating-linear-gradient(45deg, #d8d8d8 0 24px, #f4f4f4 24px 48px)',
    }}
  >
    <Story />
  </div>
);

export const OnPhoto: Story = {
  args: { tone: 'invert', size: 'md' },
  decorators: [onPhoto],
};

export const OnPhotoHover: Story = {
  ...OnPhoto,
  parameters: { pseudo: { hover: true } },
};

export const OnPhotoFocusVisible: Story = {
  ...OnPhoto,
  parameters: { pseudo: { focusVisible: true } },
};

// La freccia è decorativa: fuori dall'albero di accessibilità, il nome del
// link resta quello dell'host.
export const Decorative: Story = {
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'Vai al servizio' });
    const circle = link.firstElementChild as HTMLElement;
    await expect(circle.getAttribute('aria-hidden')).toBe('true');
  },
};
