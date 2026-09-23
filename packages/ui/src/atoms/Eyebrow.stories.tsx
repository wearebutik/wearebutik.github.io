// Storie dell'Eyebrow per il workshop @butik/ui. Copre allineamento e
// spaziatura — le due varianti reali trovate nell'audit dei consumer.
import type { Meta, StoryObj } from '@storybook/react-vite';
import Eyebrow from './Eyebrow';

const meta = {
  title: 'Atoms/Eyebrow',
  component: Eyebrow,
  tags: ['autodocs'],
  argTypes: {
    align: {
      control: 'inline-radio',
      options: ['left', 'center'],
      description: 'Allineamento del testo.',
    },
    spacing: {
      control: 'inline-radio',
      options: ['md', 'sm'],
      description: 'Spaziatura sotto al testo.',
    },
    tone: {
      control: 'inline-radio',
      options: ['accent', 'invert'],
      description: 'Tonalità: "accent" (default) o "invert" per sfondi scuri.',
    },
    children: {
      control: 'text',
      description: 'Testo del titoletto.',
    },
  },
  args: {
    children: 'Il nostro metodo',
  },
} satisfies Meta<typeof Eyebrow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Left: Story = {
  args: { align: 'left', children: 'Il nostro metodo' },
};

export const Center: Story = {
  args: { align: 'center', children: 'Cosa dicono di noi' },
};

export const SmallSpacing: Story = {
  args: { spacing: 'sm', children: 'Adatto a' },
};

// tone="invert": usa var(--color-highlight) per rispettare il contrasto AA
// su fondo scuro. Il decorator simula lo sfondo scuro reale.
export const InvertTone: Story = {
  args: { tone: 'invert', children: 'Il nostro metodo' },
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--color-bg-invert)', padding: 'var(--space-8)' }}>
        <Story />
      </div>
    ),
  ],
};
