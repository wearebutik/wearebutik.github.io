// Storie dell'HeroBanner. Storybook non ha la pipeline immagini di Astro:
// gli specimen usano un'immagine placeholder statica al posto degli asset
// reali (risolti a build-time solo lato apps/web via getImage()).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import HeroBanner from './HeroBanner';

const placeholderSrc =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="1600" height="900" fill="#463a52"/></svg>'
  );

// Foto bianca: il caso peggiore per il contrasto del testo. Lo scrim deve
// tenere leggibili titolo e sottotitolo anche qui.
const brightSrc =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="1600" height="900" fill="#ffffff"/></svg>'
  );

const meta = {
  title: 'Organisms/HeroBanner',
  component: HeroBanner,
  tags: ['autodocs'],
  args: {
    title: 'Un titolo che racconta il progetto',
    src: placeholderSrc,
    imageAlt: '',
  },
} satisfies Meta<typeof HeroBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

// Solo titolo (es. progetti/servizi senza sottotitolo).
export const TitleOnly: Story = {};

// Con sottotitolo (es. chi-siamo).
export const WithSubtitle: Story = {
  args: {
    subtitle: 'Un sottotitolo che espande il contesto in una riga o due.',
  },
};

// Titolo lungo: verifica il wrapping su max-width.
export const LongTitle: Story = {
  args: {
    title: 'Un titolo molto lungo che deve andare a capo su più righe restando leggibile',
    subtitle: 'E un sottotitolo altrettanto descrittivo per verificare la gerarchia visiva.',
  },
};

// Titolo lungo su mobile: il caso in cui il testo occupa più spazio della foto.
export const LongTitleMobile: Story = {
  ...LongTitle,
  globals: { viewport: { value: 'mobile1' } },
};

// Titolo lungo su tablet: fra 768 e 1024px il titolo cambia taglia.
export const LongTitleTablet: Story = {
  ...LongTitle,
  globals: { viewport: { value: 'tablet' } },
};

// Sottotitolo su foto bianca: il caso peggiore per lo scrim, da guardare a
// occhio. Il pannello a11y non basta: sul testo sopra un gradiente axe dà
// color-contrast "incomplete", non un esito.
export const BrightImage: Story = {
  args: {
    src: brightSrc,
    subtitle: 'Un sottotitolo che espande il contesto in una riga o due.',
  },
};

// Arrivo con il morph della view transition: il sito marca la sezione con
// data-morph (BaseLayout) e l'entrata al caricamento si salta. Lo stato finale
// non ha differenze visive da WithSubtitle (cambia solo il movimento
// d'ingresso): questa storia è un test, non uno specimen. La `play` verifica
// che l'attributo arrivi al componente; lo snapshot Chromatic è spento perché
// duplicherebbe quello di WithSubtitle.
export const MorphArrival: Story = {
  ...WithSubtitle,
  parameters: { chromatic: { disableSnapshot: true } },
  decorators: [
    (Story) => {
      const ref = (el: HTMLDivElement | null) => {
        const banner = el?.querySelector<HTMLElement>('[data-hero-banner]');
        if (banner) banner.dataset.morph = '';
      };
      return (
        <div ref={ref}>
          <Story />
        </div>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const banner = canvasElement.querySelector<HTMLElement>('[data-hero-banner]');
    await expect(banner?.dataset.morph).toBe('');
  },
};

// Con transitionName (le pagine progetto e servizio): il nome della view
// transition arriva come stile inline su foto, titolo e sottotitolo, perché
// `transition:name` di Astro non entra nell'isola (ADR-0008
// #astro-island-boundary). A riposo non cambia nulla: è un test.
export const WithTransitionName: Story = {
  ...WithSubtitle,
  args: { ...WithSubtitle.args, transitionName: 'progetto-esempio' },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const banner = canvasElement.querySelector<HTMLElement>('[data-hero-banner]');
    const img = banner?.querySelector<HTMLElement>('img');
    const title = banner?.querySelector<HTMLElement>('h1');
    const subtitle = banner?.querySelector<HTMLElement>('p');
    await expect(img?.style.viewTransitionName).toBe('progetto-esempio');
    await expect(title?.style.viewTransitionName).toBe('progetto-esempio-title');
    await expect(subtitle?.style.viewTransitionName).toBe('progetto-esempio-subtitle');
  },
};
