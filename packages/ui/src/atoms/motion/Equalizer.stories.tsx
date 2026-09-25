// Storie dell'Equalizer: toni, dimensioni, numero di barre e modalità di play.
import type { Meta, StoryObj } from '@storybook/react-vite';
import Equalizer from './Equalizer';

const onDark = (Story: () => React.ReactElement) => (
  <div style={{ background: 'var(--color-bg-invert)', padding: 'var(--space-8)' }}>
    <Story />
  </div>
);

const meta = {
  title: 'Atoms/Motion/Equalizer',
  component: Equalizer,
  tags: ['autodocs'],
  argTypes: {
    bars: { control: { type: 'range', min: 3, max: 8, step: 1 } },
    tone: { control: 'inline-radio', options: ['onLight', 'onDark', 'accent', 'highlight'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    play: { control: 'inline-radio', options: ['always', 'hover'] },
  },
  args: { bars: 6, tone: 'onLight', size: 'md', play: 'always' },
} satisfies Meta<typeof Equalizer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Su sfondo scuro il tono passa al verde highlight.
export const OnDark: Story = {
  args: { tone: 'onDark' },
  decorators: [onDark],
};

export const Small: Story = { args: { size: 'sm' } };
export const Large: Story = { args: { size: 'lg' } };

// Con play="hover" le barre partono solo al passaggio del puntatore.
export const OnHover: Story = { args: { play: 'hover', size: 'lg' } };

// Lo stato attivo di play="hover": le barre si animano solo sotto il
// puntatore, qui forzato con storybook-addon-pseudo-states.
export const OnHoverActive: Story = {
  args: { play: 'hover', size: 'lg' },
  parameters: { pseudo: { hover: true } },
};

// Tre barre: la versione più compatta, per accostarla a un'etichetta.
export const FewBars: Story = { args: { bars: 3, size: 'sm' } };

// Otto barre: il massimo con durate differenziate.
export const ManyBars: Story = { args: { bars: 8 } };
