// Storie dell'Underline: toni, lunghezza del testo e uso dentro un titolo.
import type { Meta, StoryObj } from '@storybook/react-vite';
import Underline from './Underline';

const meta = {
  title: 'Atoms/Motion/Underline',
  component: Underline,
  tags: ['autodocs'],
  argTypes: {
    tone: { control: 'inline-radio', options: ['accent', 'highlight', 'fg'] },
    children: { control: 'text' },
  },
  args: { tone: 'accent', children: 'la musica' },
  decorators: [
    (Story) => (
      <div style={{ padding: 'var(--space-8)', fontSize: 'var(--font-size-2xl)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Underline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OnDark: Story = {
  args: { tone: 'highlight' },
  decorators: [
    (Story) => (
      <div
        style={{
          background: 'var(--color-bg-invert)',
          color: 'var(--color-fg-invert)',
          padding: 'var(--space-8)',
          fontSize: 'var(--font-size-2xl)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

// Dentro un titolo: sottolinea solo la parola che porta il senso.
export const InHeading: Story = {
  render: (args) => (
    <h2
      style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'var(--font-size-section-title)',
        fontWeight: 700,
        color: 'var(--color-fg)',
        margin: 0,
      }}
    >
      Attiviamo territori attraverso <Underline {...args} />
    </h2>
  ),
};

// Una parola sola: il tratto si comprime.
// Al caricamento, solo CSS: come nel titolo dell'hero della home, dove il
// componente è reso a HTML statico senza direttiva client.
export const OnLoad: Story = { args: { trigger: 'load' } };

export const ShortText: Story = { args: { children: 'oggi' } };

// Frase lunga: il tratto si allunga mantenendo la stessa irregolarità.
export const LongText: Story = {
  args: { children: 'progettazione culturale su base musicale' },
};

// Come nel titolo dell'hero della home: trigger="load", tono accent, dentro
// l'h1 bianco sopra la foto con lo scrim.
export const OnLoadOnPhoto: Story = {
  args: { trigger: 'load', tone: 'accent', children: 'la musica' },
  render: (args) => (
    <div
      style={{
        padding: 'var(--space-8)',
        backgroundColor: 'var(--color-bg-invert)',
        backgroundImage:
          'linear-gradient(0deg, rgba(7,17,8,0.55), rgba(7,17,8,0.55)), repeating-linear-gradient(45deg, #8a8a8a 0 24px, #d8d8d8 24px 48px)',
      }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--font-size-section-title)',
          fontWeight: 700,
          color: 'var(--color-fg-invert)',
          margin: 0,
        }}
      >
        Attiviamo territori attraverso <Underline {...args} />
      </h1>
    </div>
  ),
};
