// Configurazione Storybook per @butik/ui (ADR-0008): workshop del catalogo
// componenti, builder react-vite. Vive solo qui, come dev tool: non tocca la
// build statica del sito (@butik/web).
import type { StorybookConfig } from '@storybook/react-vite';
import react from '@vitejs/plugin-react';

const config: StorybookConfig = {
  // Le storie sono co-locate accanto ai componenti in src/.
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  // a11y (issue #29): pannello di audit accessibilità per storia, basato su
  // axe-core. Verifica ARIA/contrasto/focus direttamente nel workshop, oltre
  // a design-check.
  // pseudo-states (issue #44): forza :hover / :focus-visible / :active su una
  // storia via `parameters.pseudo`, cosi' gli stati d'interazione hanno uno
  // specimen fisso (e Chromatic li sorveglia). Gli eventi simulati delle play
  // function non attivano le pseudo-classi CSS.
  addons: ['@storybook/addon-a11y', 'storybook-addon-pseudo-states'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // @storybook/react-vite non installa @vitejs/plugin-react da sé — senza,
  // la build di produzione (storybook build) compila il JSX con
  // `React.createElement` ma non importa `React`: "ReferenceError: React is
  // not defined" appena si seleziona una storia. `pnpm storybook` (dev) non
  // lo mostra perché il transform esbuild di Vite in dev gestisce il runtime
  // automatico da sé — il bug esiste solo nella build statica, quella che
  // Chromatic pubblica.
  viteFinal: async (viteConfig) => {
    viteConfig.plugins ??= [];
    viteConfig.plugins.push(react());
    return viteConfig;
  },
};

export default config;
