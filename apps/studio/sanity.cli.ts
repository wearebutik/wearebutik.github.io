import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? 'uvzsc0vv',
    dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  },
  // Deploy gratuito su https://<studioHost>.sanity.studio
  studioHost: 'butik',
});
