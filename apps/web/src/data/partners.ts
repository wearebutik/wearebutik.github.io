import type { ImageMetadata } from 'astro';

export type Partner = {
  name: string;
  /** Asset locale, o URL Sanity (scaricato e ottimizzato da Astro in build). */
  logo: ImageMetadata | string;
};

// Loghi collaborazioni in src/assets/logos/ (PNG trasparenti), importati come
// asset cosi' che Astro <Image> possa ottimizzarli (responsive + formati moderni).
const logoFiles = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/logos/*.png',
  { eager: true },
);

function logo(file: string): ImageMetadata {
  const mod = logoFiles[`../assets/logos/${file}`];
  if (!mod) throw new Error(`Logo partner non trovato: ${file}`);
  return mod.default;
}

export const partners: Partner[] = [
  { name: 'Comune di Milano', logo: logo('comune-milano.png') },
  { name: 'Comune di Napoli', logo: logo('comune-napoli.png') },
  { name: 'Comune di Brescia', logo: logo('comune-brescia.png') },
  { name: 'Comune di Cremona', logo: logo('comune-cremona.png') },
  { name: 'Comune di Pesaro', logo: logo('comune-pesaro.png') },
  { name: 'Comune di Verona', logo: logo('comune-verona.png') },
  { name: 'Visit Cremona', logo: logo('visit-cremona.png') },
  { name: 'Camera di Commercio di Cremona', logo: logo('cciaa-cremona.png') },
  { name: 'Ministero degli Affari Esteri', logo: logo('ministero-affari-esteri.png') },
  { name: 'AssoConcerti', logo: logo('assoconcerti.png') },
  { name: 'Assomusica', logo: logo('assomusica.png') },
  { name: 'FIMI', logo: logo('fimi.png') },
  { name: 'SIAE', logo: logo('siae.png') },
  { name: 'Nuovo IMAIE', logo: logo('nuovo-imaie.png') },
  { name: 'Università IULM', logo: logo('iulm.png') },
  { name: 'NAM', logo: logo('nam.png') },
  { name: '24ORE Business School', logo: logo('24ore-business-school.png') },
  { name: 'SAE', logo: logo('sae.png') },
];
