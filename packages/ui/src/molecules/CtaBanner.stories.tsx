// Storie del CtaBanner per il workshop @butik/ui. Copre le due varianti reali
// osservate nei 6 punti di consumo (con/senza CTA secondaria) e la lunghezza
// del body.
import type { Meta, StoryObj } from '@storybook/react-vite';
import CtaBanner from './CtaBanner';

const meta = {
  title: 'Molecules/CtaBanner',
  component: CtaBanner,
  tags: ['autodocs'],
  args: {
    title: 'Hai un progetto in mente?',
    body: 'Raccontaci la tua idea: troviamo insieme il format giusto.',
    primaryCta: { label: 'Contattaci', href: '/contatti' },
    secondaryCta: { label: 'Scopri i servizi', href: '/servizi' },
  },
} satisfies Meta<typeof CtaBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

// Doppia CTA (es. home, servizi/index).
export const WithSecondaryCta: Story = {};

// Doppia CTA su mobile: le due azioni vanno a capo e si impilano.
export const WithSecondaryCtaMobile: Story = {
  ...WithSecondaryCta,
  globals: { viewport: { value: 'mobile1' } },
};

// Solo CTA primaria, senza body (es. chi-siamo).
export const PrimaryOnly: Story = {
  args: {
    body: undefined,
    secondaryCta: undefined,
  },
};

// Titolo lungo: verifica il wrapping.
export const LongTitle: Story = {
  args: {
    title: 'Vuoi costruire un progetto culturale che duri nel tempo e coinvolga la community?',
  },
};

// body e secondaryCta sono indipendenti: qui c'è il body ma non la CTA
// secondaria, il caso in cui il layout content/actions si sbilancia.
export const BodyWithoutSecondary: Story = {
  args: {
    body:
      'Raccontaci la tua idea, il territorio in cui vuoi lavorare e le persone che vuoi coinvolgere: troviamo insieme il format giusto, dai tempi al budget.',
    secondaryCta: undefined,
  },
};

// Il caso speculare: due CTA senza body.
export const SecondaryWithoutBody: Story = {
  args: { body: undefined },
};

// Stati d'interazione, forzati con storybook-addon-pseudo-states: la
// primaria passa al rosso pieno, la secondaria si riempie.
export const CtaHover: Story = {
  parameters: { pseudo: { hover: true } },
};

export const CtaFocusVisible: Story = {
  parameters: { pseudo: { focusVisible: true } },
};
