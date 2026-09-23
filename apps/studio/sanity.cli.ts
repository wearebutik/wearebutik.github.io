import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? 'uvzsc0vv',
    dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  },
  // Deploy gratuito su https://<studioHost>.sanity.studio
  studioHost: 'butik',
  deployment: {
    appId: 'cvm2s3qwsyp4gyxy6rmd4zcq',
    // Lo Studio pubblicato usa la versione di `sanity` fissata nel lockfile,
    // non l'ultima caricata a runtime dalla CDN di Sanity.
    autoUpdates: false,
  },
});
