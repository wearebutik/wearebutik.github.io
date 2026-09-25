// Storie dell'Underline: toni, lunghezza del testo, uso dentro un titolo e su
// foto. Il tratto si disegna al caricamento (solo CSS), tranne quando la
// pagina è già stata vista nella sessione (entrata saltata).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import Underline from './Underline';

const meta = {
  title: 'Atoms/Motion/Underline',
  component: Underline,
  tags: ['autodocs'],
  // Il tratto si disegna con un'animazione CSS: Chromatic la ferma alla fine,
  // cioè a sottolineatura disegnata, non all'inizio (tratto invisibile).
  parameters: { chromatic: { pauseAnimationAtEnd: true } },
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
export const ShortText: Story = { args: { children: 'oggi' } };

// Frase lunga: il tratto si allunga mantenendo la stessa irregolarità.
export const LongText: Story = {
  args: { children: 'progettazione culturale su base musicale' },
};

// Come nel titolo dell'hero della home: tono accent, dentro l'h1 bianco sopra
// la foto con lo scrim.
export const OnPhoto: Story = {
  args: { tone: 'accent', children: 'la musica' },
  render: (args) => (
    <div
      style={{
        padding: 'var(--space-8)',
        backgroundColor: 'var(--color-bg-invert)',
        backgroundImage:
          'linear-gradient(0deg, color-mix(in srgb, var(--color-fg) 55%, transparent), color-mix(in srgb, var(--color-fg) 55%, transparent)), repeating-linear-gradient(45deg, #8a8a8a 0 24px, #d8d8d8 24px 48px)',
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

// Lo stesso titolo su una foto chiara, con il velo al 60% del colore del
// testo che l'hero della home stende sulle foto (.hero-scrim): è il caso
// peggiore per il contrasto del tratto rosso, perché il velo scurisce la foto
// ma non la uniforma.
export const OnBrightPhoto: Story = {
  args: { tone: 'accent', children: 'la musica' },
  render: (args) => (
    <div
      style={{
        padding: 'var(--space-8)',
        backgroundColor: 'var(--color-bg)',
        backgroundImage:
          'linear-gradient(0deg, color-mix(in srgb, var(--color-fg) 60%, transparent), color-mix(in srgb, var(--color-fg) 60%, transparent)), repeating-linear-gradient(45deg, #d8d8d8 0 24px, #f4f4f4 24px 48px)',
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

// Entrata saltata: il sito mette data-entrata-saltata su <html> quando la home
// è già stata vista nella sessione, e il tratto arriva già disegnato. A riposo
// è identico a Default (Chromatic lo ferma alla fine), quindi è un test.
export const EntrataSaltata: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  decorators: [
    (Story) => (
      <div data-entrata-saltata="">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const path = canvasElement.querySelector('svg path');
    await expect(path).not.toBeNull();
    const stile = getComputedStyle(path!);
    await expect(stile.animationName).toBe('none');
    await expect(stile.strokeDashoffset).toBe('0px');
  },
};
