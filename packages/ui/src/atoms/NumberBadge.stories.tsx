import type { Meta, StoryObj } from '@storybook/react-vite';
import NumberBadge from './NumberBadge';

const meta = {
  title: 'Atoms/NumberBadge',
  component: NumberBadge,
  tags: ['autodocs'],
  argTypes: {
    number: {
      control: 'number',
      description: 'Numero dello step (1-based); reso zero-padded a 2 cifre.',
    },
    size: {
      control: 'inline-radio',
      options: ['md', 'sm'],
      description: 'Misura: md accanto al testo, sm sovrapposto a un elemento grafico.',
    },
  },
  args: {
    number: 1,
  },
} satisfies Meta<typeof NumberBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const First: Story = {
  args: { number: 1 },
};

export const DoubleDigit: Story = {
  args: { number: 12 },
};

export const Small: Story = {
  args: { number: 3, size: 'sm' },
};

// L'uso della home (sezione "Il nostro metodo"): misura sm, anello bianco
// impostato dal contesto con --number-badge-ring, sovrapposto al bordo di un
// disco scuro. Il disco qui è un cerchio pieno; i solchi del vinile sono
// materiale della sezione, non dell'atomo.
export const WithRingOnDisc: Story = {
  args: { number: 2, size: 'sm' },
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--color-white)', padding: 'var(--space-8)' }}>
        <div
          style={{
            position: 'relative',
            width: '6.5rem',
            height: '6.5rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-bg-invert)',
            ['--number-badge-ring' as string]: 'var(--color-white)',
          }}
        >
          <span style={{ position: 'absolute', top: '-0.6rem', left: '-0.6rem', display: 'flex' }}>
            <Story />
          </span>
        </div>
      </div>
    ),
  ],
};
