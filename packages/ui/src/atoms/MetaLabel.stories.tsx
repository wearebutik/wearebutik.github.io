// Storie del MetaLabel per il workshop @butik/ui. Il metadato non vive da
// solo: le storie lo mostrano nei due contesti reali in cui compare (riga di
// metadati di una card, etichetta sopra un valore) e con l'accento ritonato
// dal contesto, come fanno le card dei servizi.
import type { Meta, StoryObj } from '@storybook/react-vite';
import MetaLabel from './MetaLabel';

const meta = {
  title: 'Atoms/MetaLabel',
  component: MetaLabel,
  tags: ['autodocs'],
  argTypes: {
    as: {
      control: 'inline-radio',
      options: ['span', 'p'],
      description: 'Elemento: "span" (default) in linea, "p" come blocco a sé.',
    },
    children: {
      control: 'text',
      description: 'Testo del metadato.',
    },
  },
  args: {
    children: 'Progettazione culturale',
  },
} satisfies Meta<typeof MetaLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Come nella scheda di un membro del team: il metadato segue il titolo.
export const AfterTitle: Story = {
  args: { as: 'p', children: 'Co-founder, direzione artistica' },
  decorators: [
    (Story) => (
      <div style={{ fontFamily: 'var(--font-heading)' }}>
        <h3 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--font-size-lg)', color: 'var(--color-fg)' }}>
          Nome Cognome
        </h3>
        <Story />
      </div>
    ),
  ],
};

// Come nella barra di un progetto: etichetta sopra un valore.
export const OverValue: Story = {
  args: { as: 'p', children: 'Cliente' },
  decorators: [
    (Story) => (
      <div>
        <Story />
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--font-size-sm)', color: 'var(--color-fg)' }}>
          Comune di Cremona
        </span>
      </div>
    ),
  ],
};

// Il contesto imposta --meta-label-color: il valore deve reggere 4.5:1 sul
// fondo (qui --color-accent-2 su --color-bg).
export const Retoned: Story = {
  args: { children: 'Formazione' },
  decorators: [
    (Story) => (
      <div style={{ ['--meta-label-color' as string]: 'var(--color-accent-2)' }}>
        <Story />
      </div>
    ),
  ],
};

// Su fondo scuro il contesto ritona il metadato sul verde highlight
// (alias --color-butik-green → --color-highlight).
export const OnDarkHighlight: Story = {
  args: { children: 'Turismo musicale' },
  decorators: [
    (Story) => (
      <div
        style={{
          background: 'var(--color-bg-invert)',
          padding: 'var(--space-8)',
          ['--meta-label-color' as string]: 'var(--color-highlight)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

// Ritonato sul colore del testo: il metadato perde l'accento e resta
// distinto solo per il maiuscoletto.
export const RetonedFg: Story = {
  args: { children: 'Eventi' },
  decorators: [
    (Story) => (
      <div style={{ ['--meta-label-color' as string]: 'var(--color-fg)' }}>
        <Story />
      </div>
    ),
  ],
};
