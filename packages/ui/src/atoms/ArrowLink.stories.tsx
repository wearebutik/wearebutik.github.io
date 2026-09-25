// Storie di ArrowLink per il workshop @butik/ui. Coprono i due toni reali —
// fondo chiaro (ServiceExpanded) e fondo scuro (Hero della home) — e il
// ritono per contesto via --accent, che le card dei servizi già impostano.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import ArrowLink from './ArrowLink';

const meta = {
  title: 'Atoms/ArrowLink',
  component: ArrowLink,
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: ['default', 'invert'],
      description: 'Tonalità: default su fondo chiaro, invert su fondo scuro.',
    },
    href: { control: 'text', description: 'Destinazione del link.' },
    children: { control: 'text', description: 'Testo del link (la freccia la aggiunge il componente).' },
  },
  args: {
    href: '#',
    children: 'Scopri la progettazione culturale',
  },
} satisfies Meta<typeof ArrowLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnLight: Story = {
  args: { tone: 'default' },
};

export const OnDark: Story = {
  args: { tone: 'invert', children: 'Esplora tutti i servizi' },
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--color-bg-invert)', padding: 'var(--space-8)' }}>
        <Story />
      </div>
    ),
  ],
};

// L'uso reale del tono invert (Hero della home) non è sopra un fondo pieno ma
// sopra un mosaico fotografico: su fondo pieno l'audit a11y darebbe verde su
// un caso che in produzione non esiste.
export const OnPhoto: Story = {
  args: { tone: 'invert', children: 'Esplora tutti i servizi' },
  decorators: [
    (Story) => (
      <div
        style={{
          padding: 'var(--space-8)',
          backgroundColor: 'var(--color-bg-invert)',
          backgroundImage:
            'linear-gradient(0deg, rgba(7,17,8,0.55), rgba(7,17,8,0.55)), repeating-linear-gradient(45deg, #8a8a8a 0 24px, #d8d8d8 24px 48px)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

// Il tono default eredita --accent (cerchio) e --accent-ink (testo in hover)
// dal contesto: è così che le card dei servizi danno a ogni categoria il
// proprio colore senza toccare l'atomo. Qui una coppia reale di
// ServiceExpanded (viola, uguale per cerchio e testo), con i token a cui
// puntano gli alias --color-butik-* del sito.
export const AccentFromContext: Story = {
  args: { tone: 'default', children: 'Scopri il turismo musicale' },
  decorators: [
    (Story) => (
      <div
        style={{
          ['--accent' as string]: 'var(--color-accent-2)',
          ['--accent-ink' as string]: 'var(--color-accent-2)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

// La coppia rossa: cerchio sul rosso di brand, testo sul rosso "ink".
export const AccentFromContextRed: Story = {
  args: { tone: 'default', children: 'Scopri la progettazione culturale' },
  decorators: [
    (Story) => (
      <div
        style={{
          ['--accent' as string]: 'var(--color-accent)',
          ['--accent-ink' as string]: 'var(--color-accent-text)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

// --arrow-link-accent è il primo hook della catena di fallback e l'unico
// pensato per il componente: --accent lo si eredita per caso, questo no.
export const AccentViaComponentHook: Story = {
  args: { tone: 'default', children: 'Scopri la formazione' },
  decorators: [
    (Story) => (
      <div style={{ ['--arrow-link-accent' as string]: 'var(--color-accent-2)' }}>
        <Story />
      </div>
    ),
  ],
};

// Stati d'interazione, forzati con storybook-addon-pseudo-states.
// Hover: il testo prende l'accento "ink", il cerchio della freccia si riempie
// e la freccia scorre di 2px.
export const OnLightHover: Story = {
  ...OnLight,
  parameters: { pseudo: { hover: true } },
};

export const OnLightFocusVisible: Story = {
  ...OnLight,
  parameters: { pseudo: { focusVisible: true } },
};

export const OnDarkHover: Story = {
  ...OnDark,
  parameters: { pseudo: { hover: true } },
};

export const OnDarkFocusVisible: Story = {
  ...OnDark,
  parameters: { pseudo: { focusVisible: true } },
};

export const OnPhotoHover: Story = {
  ...OnPhoto,
  parameters: { pseudo: { hover: true } },
};

export const OnPhotoFocusVisible: Story = {
  ...OnPhoto,
  parameters: { pseudo: { focusVisible: true } },
};

export const AccentFromContextHover: Story = {
  ...AccentFromContext,
  parameters: { pseudo: { hover: true } },
};

export const AccentFromContextFocusVisible: Story = {
  ...AccentFromContext,
  parameters: { pseudo: { focusVisible: true } },
};

export const AccentFromContextRedHover: Story = {
  ...AccentFromContextRed,
  parameters: { pseudo: { hover: true } },
};

// La coppia scura: cerchio e testo sul colore del testo, per le categorie
// che non hanno un accento proprio (alias --color-butik-dark → --color-fg).
export const AccentFromContextDark: Story = {
  args: { tone: 'default', children: 'Scopri gli eventi' },
  decorators: [
    (Story) => (
      <div
        style={{
          ['--accent' as string]: 'var(--color-fg)',
          ['--accent-ink' as string]: 'var(--color-fg)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

// In hover il cerchio si riempie di scuro: la freccia deve restare leggibile.
export const AccentFromContextDarkHover: Story = {
  ...AccentFromContextDark,
  parameters: { pseudo: { hover: true } },
};

// className si UNISCE alle classi interne (gancio per i chiamanti app-side).
// Nessuna regola dell'app copiata qui: la `play` controlla che il link porti
// sia la classe interna sia quella passata.
export const WithClassName: Story = {
  args: { tone: 'default', className: 'story-arrow-link-hook' },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'Scopri la progettazione culturale' });
    await expect(link.classList).toContain('story-arrow-link-hook');
    // link + classe passata (il tono default non aggiunge classi).
    await expect(link.classList.length).toBe(2);
  },
};
