// Storie del Button per il workshop @butik/ui (ADR-0008). Coprono varianti
// (primary/ghost), modalità di resa (link vs button) e lunghezza del contenuto.
// I controlli (knobs) di Storybook permettono di provare le prop dal vivo.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import Button from './Button';

const meta = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'ghost'],
      description: 'Variante visiva del bottone.',
    },
    tone: {
      control: 'inline-radio',
      options: [undefined, 'accent', 'dark', 'invert'],
      description:
        'Tonalità: "dark" (solo primary, sfondo scuro invece di accent), "invert" (solo ghost, outline bianco per sfondi scuri) o "accent" (solo ghost, outline colorato su sfondo chiaro). Una combinazione che non esiste (es. primary + invert) non dà errore: il bottone ricade sulla variante senza tono — vedi la storia ToneFallback.',
    },
    href: {
      control: 'text',
      description: 'Se valorizzato rende un <a>, altrimenti un <button>.',
    },
    type: {
      control: 'inline-radio',
      options: ['button', 'submit', 'reset'],
      description: 'Tipo del <button> (ignorato quando c’è href).',
    },
    children: {
      control: 'text',
      description: 'Contenuto del bottone.',
    },
  },
  args: {
    variant: 'primary',
    children: 'Chiamaci',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Variante piena, reso come <button> (default: nessun href).
export const Primary: Story = {
  args: { variant: 'primary', children: 'Chiamaci' },
};

// Variante a contorno.
export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Scopri di più' },
};

// Con href: il componente rende un <a>.
export const AsLink: Story = {
  args: { variant: 'primary', href: '/contatti', children: 'Vai ai contatti' },
};

// Senza href: il componente rende un <button type="submit">.
export const AsButton: Story = {
  args: { variant: 'primary', href: undefined, type: 'submit', children: 'Invia' },
};

// Contenuto misto (icona + testo) via children.
export const WithIcon: Story = {
  args: {
    variant: 'ghost',
    children: (
      <>
        <span aria-hidden="true">♪</span> Ascolta
      </>
    ),
  },
};

// Etichetta lunga: verifica il wrapping e il padding.
export const LongLabel: Story = {
  args: {
    variant: 'primary',
    children: 'Prenota una consulenza gratuita con il nostro team',
  },
};

// Etichetta corta: verifica il bottone compatto.
export const ShortLabel: Story = {
  args: { variant: 'ghost', children: 'Ok' },
};

// tone="dark": CTA primaria su sfondo chiaro con colore scuro invece di accent
// (Header, Hero home).
export const DarkTone: Story = {
  args: { variant: 'primary', tone: 'dark', children: 'Lavoriamo insieme' },
};

// tone="invert": outline bianco leggibile su sfondi scuri/fotografici
// (ServiceHero A). Il decorator simula lo sfondo scuro reale.
export const InvertTone: Story = {
  args: { variant: 'ghost', tone: 'invert', children: 'Scopri il progetto' },
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--color-bg-invert)', padding: 'var(--space-8)' }}>
        <Story />
      </div>
    ),
  ],
};

// tone="accent": outline colorato su sfondo chiaro (CtaProgetti).
export const AccentGhostTone: Story = {
  args: { variant: 'ghost', tone: 'accent', children: 'Vedi tutti i progetti' },
};

// Le combinazioni tono × variante che non esistono (primary + invert,
// primary + accent, ghost + dark) non rompono il bottone: il componente
// ricade sulla variante senza tono (`styles[toneKey] ?? styles[variant]`).
// Qui a sinistra la combinazione invalida, a destra il riferimento: la play
// function verifica che rendano la stessa classe.
export const ToneFallback: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
      <Button variant="primary" tone="invert">
        primary + invert
      </Button>
      <Button variant="primary">primary</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [invalid, reference] = canvasElement.querySelectorAll('button');
    await expect(invalid.className).toBe(reference.className);
  },
};

// Stati d'interazione, forzati con storybook-addon-pseudo-states: le
// pseudo-classi CSS non si attivano con eventi simulati.
export const PrimaryHover: Story = {
  args: { variant: 'primary', children: 'Chiamaci' },
  parameters: { pseudo: { hover: true } },
};

export const PrimaryFocusVisible: Story = {
  args: { variant: 'primary', children: 'Chiamaci' },
  parameters: { pseudo: { focusVisible: true } },
};

export const DarkToneHover: Story = {
  args: { variant: 'primary', tone: 'dark', children: 'Lavoriamo insieme' },
  parameters: { pseudo: { hover: true } },
};

// Su fondo scuro l'outline di focus passa al bianco (vedi Button.module.css).
export const InvertToneFocusVisible: Story = {
  ...InvertTone,
  parameters: { pseudo: { focusVisible: true } },
};
