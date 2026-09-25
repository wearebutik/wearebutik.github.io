// Storia dell'atomo Logo. In Storybook non c'è la pipeline immagini di Astro:
// lo specimen usa un data URI SVG statico al posto del bollo-rosso reale
// (risolto a build-time solo lato apps/web via getImage()).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import Logo from './Logo';

const placeholderSrc =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><circle cx="22.5" cy="22.5" r="22.5" fill="#e21929"/></svg>'
  );

const meta = {
  title: 'Atoms/Logo',
  component: Logo,
  tags: ['autodocs'],
  args: {
    src: placeholderSrc,
    width: 45,
    height: 45,
    alt: 'Butik',
  },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

// Dimensione header.
export const Header: Story = {
  args: { width: 45, height: 45 },
};

// Dimensione footer.
export const Footer: Story = {
  args: { width: 72, height: 72 },
};

// className si UNISCE alle classi interne: è il gancio con cui l'header
// applica i suoi effetti locali. Qui la stessa ombra dello stato overlay
// dell'header, su una foto chiara dove l'ombra scura si vede, con la classe
// definita nello specimen come l'header la definisce con :global() — una
// regola scoped di Astro non raggiungerebbe l'<img> dell'isola (ADR-0008
// #astro-island-boundary). La `play` controlla che l'<img> porti sia la
// classe interna sia quella passata.
export const WithClassName: Story = {
  args: { width: 45, height: 45, className: 'story-logo-overlay' },
  decorators: [
    (Story) => (
      <div
        style={{
          padding: 'var(--space-8)',
          backgroundImage: 'repeating-linear-gradient(45deg, #d8d8d8 0 24px, #f4f4f4 24px 48px)',
        }}
      >
        <style>{`.story-logo-overlay { filter: drop-shadow(0 1px 4px color-mix(in srgb, var(--color-fg) 45%, transparent)); }`}</style>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const img = within(canvasElement).getByRole('img', { name: 'Butik' });
    await expect(img.classList).toContain('story-logo-overlay');
    await expect(img.classList.length).toBe(2);
  },
};
