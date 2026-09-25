// Storie del Button per il workshop @butik/ui (ADR-0008). Coprono varianti
// (primary/ghost), modalità di resa (link vs button) e lunghezza del contenuto.
// I controlli (knobs) di Storybook permettono di provare le prop dal vivo.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
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
        'Tonalità: "dark" (solo primary, sfondo scuro invece di accent), "invert" (primary: stesso rosso con anello di focus bianco, per foto e fondi scuri; ghost: outline bianco per sfondi scuri) o "accent" (solo ghost, outline colorato su sfondo chiaro). Una combinazione che non esiste (es. primary + accent) non dà errore: il bottone ricade sulla variante senza tono — vedi la storia ToneFallback.',
    },
    href: {
      control: 'text',
      description: 'Se valorizzato rende un <a>, altrimenti un <button>.',
    },
    type: {
      control: 'inline-radio',
      options: ['button', 'submit', 'reset'],
      description: 'Tipo del <button>. Solo senza href: con href il tipo non lo accetta.',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabilitato (solo senza href): attenuato, niente hover.',
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

// Le combinazioni tono × variante che non esistono (primary + accent,
// ghost + dark) non rompono il bottone: il componente
// ricade sulla variante senza tono (`styles[toneKey] ?? styles[variant]`).
// Qui a sinistra la combinazione invalida, a destra il riferimento: la play
// function verifica che rendano la stessa classe.
export const ToneFallback: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
      <Button variant="primary" tone="accent">
        primary + accent
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
// pseudo-classi CSS non si attivano con eventi simulati. Hover (PDR-0005): il
// primary rosso sale soltanto; il tono dark passa al rosso pieno; le ghost si
// riempiono del colore del loro bordo. Il focus cambia con il fondo.
export const PrimaryHover: Story = {
  args: { variant: 'primary', children: 'Chiamaci' },
  parameters: { pseudo: { hover: true } },
};

export const PrimaryFocusVisible: Story = {
  args: { variant: 'primary', children: 'Chiamaci' },
  parameters: { pseudo: { focusVisible: true } },
};

export const DarkToneFocusVisible: Story = {
  args: { variant: 'primary', tone: 'dark', children: 'Lavoriamo insieme' },
  parameters: { pseudo: { focusVisible: true } },
};

// Su fondo scuro l'outline di focus passa al bianco (vedi Button.module.css).
export const InvertToneFocusVisible: Story = {
  ...InvertTone,
  parameters: { pseudo: { focusVisible: true } },
};

export const GhostFocusVisible: Story = {
  ...Ghost,
  parameters: { pseudo: { focusVisible: true } },
};

export const AccentGhostToneFocusVisible: Story = {
  ...AccentGhostTone,
  parameters: { pseudo: { focusVisible: true } },
};

// Primary sopra il mosaico fotografico velato, come la CTA dell'hero della
// home. Il tono invert tiene lo stesso rosso ma porta l'anello di focus al
// bianco: è il motivo del tono, perché l'anello di default si perderebbe sul
// velo scuro. Stesso fondo di ArrowLink/OnPhoto (velo scuro su righe grigie).
export const PrimaryOnPhoto: Story = {
  args: { variant: 'primary', tone: 'invert', children: 'Chiamaci' },
  decorators: [
    (Story) => (
      <div
        style={{
          padding: 'var(--space-8)',
          backgroundColor: 'var(--color-bg-invert)',
          backgroundImage:
            'linear-gradient(0deg, color-mix(in srgb, var(--color-fg) 55%, transparent), color-mix(in srgb, var(--color-fg) 55%, transparent)), repeating-linear-gradient(45deg, #8a8a8a 0 24px, #d8d8d8 24px 48px)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

// L'anello di focus bianco del tono invert, sul velo scuro.
export const PrimaryOnPhotoFocusVisible: Story = {
  ...PrimaryOnPhoto,
  parameters: { pseudo: { focusVisible: true } },
};

// Lo stesso su foto chiara, con il velo al 60% che l'hero della home stende
// sulle foto: il caso peggiore per l'anello di focus bianco.
export const PrimaryOnBrightPhoto: Story = {
  ...PrimaryOnPhoto,
  decorators: [
    (Story) => (
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
    ),
  ],
};

export const PrimaryOnBrightPhotoFocusVisible: Story = {
  ...PrimaryOnBrightPhoto,
  parameters: { pseudo: { focusVisible: true } },
};

// Primary su fondo pieno scuro (es. menu mobile): anche qui tone="invert",
// per l'anello di focus bianco.
export const PrimaryOnDark: Story = {
  args: { variant: 'primary', tone: 'invert', children: 'Chiamaci' },
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--color-bg-invert)', padding: 'var(--space-8)' }}>
        <Story />
      </div>
    ),
  ],
};

export const PrimaryOnDarkFocusVisible: Story = {
  ...PrimaryOnDark,
  parameters: { pseudo: { focusVisible: true } },
};

// className si UNISCE alle classi interne: è il gancio con cui l'header
// aggancia il proprio stato overlay-su-scroll senza reimplementare il
// bottone. Nessuna regola dell'app copiata qui: la `play` controlla solo che
// il <button> porti sia le classi interne sia quella passata.
export const WithClassName: Story = {
  args: { variant: 'primary', children: 'Chiamaci', className: 'story-button-hook' },
  // Test, non un'immagine: a riposo è identica a Default.
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Chiamaci' });
    await expect(button.classList).toContain('story-button-hook');
    // button + variante + classe passata.
    await expect(button.classList.length).toBe(3);
  },
};

export const DarkToneHover: Story = {
  ...DarkTone,
  parameters: { pseudo: { hover: true } },
};

export const GhostHover: Story = {
  ...Ghost,
  parameters: { pseudo: { hover: true } },
};

export const InvertToneHover: Story = {
  ...InvertTone,
  parameters: { pseudo: { hover: true } },
};

export const AccentGhostToneHover: Story = {
  ...AccentGhostTone,
  parameters: { pseudo: { hover: true } },
};

// Disabilitato: il form dei contatti lo imposta durante l'invio. Attenuato,
// e l'hover non cambia colore.
export const Disabled: Story = {
  args: { tone: 'dark', type: 'submit', disabled: true, children: 'Invio in corso…' },
};

// In hover un bottone disabilitato non cambia: a vista è Disabled, quindi è un
// test. La play verifica che il fondo resti quello scuro.
export const DisabledHover: Story = {
  ...Disabled,
  parameters: { pseudo: { hover: true }, chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    // --color-fg (#071108): il fondo del tono dark a riposo, non il rosso
    // dell'hover.
    const button = within(canvasElement).getByRole('button');
    await expect(getComputedStyle(button).backgroundColor).toBe('rgb(7, 17, 8)');
  },
};
