// Una tantum: porta la Home dai campi fissi alla lista `sezioni` (ADR-0004,
// *Pages as sections*), nello stesso ordine e con gli stessi testi di prima.
// Vale per la versione pubblicata e per la bozza, se c'è: ognuna dai suoi
// campi, e un banner o la newsletter nascosti con gli interruttori di prima
// restano fuori dalla lista.
//
//   pnpm --filter @butik/studio home-a-sezioni
//
// Non tocca un documento che ha già le sezioni (setIfMissing), e non toglie i
// campi vecchi: il sito online li legge finché non va online quello nuovo. Li
// toglie `pulizia-campi` dopo il deploy.
import { randomUUID } from 'node:crypto';
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2026-09-01', perspective: 'raw' });

type Doc = Record<string, any>;
const key = () => randomUUID().slice(0, 12);
const link = (label?: string, href?: string) => (label && href ? { _type: 'link', label, href } : undefined);
// Foto di sfondo: decorative, senza testo alternativo né didascalia.
const sfondo = (f: Doc) => ({ _key: f._key ?? key(), _type: 'figura', asset: f.asset, ...(f.hotspot && { hotspot: f.hotspot, crop: f.crop }) });

function sezioni(d: Doc): Doc[] {
  const s: Doc[] = [
    {
      _type: 'sezioneHero',
      title: d.heroTitle,
      subtitle: d.heroSubtitle,
      ctaLabel: d.heroCtaLabel,
      ctaHref: d.heroCtaHref,
      exploreLabel: d.heroExploreLabel,
      exploreHref: d.heroExploreHref,
      fotoSfondo: (d.heroImages ?? []).filter((f: Doc) => f.asset).map(sfondo),
    },
    { _type: 'sezioneLoghi' },
    { _type: 'sezioneNumeri', butikMetrics: d.butikMetrics, mmwLabel: d.mmwLabel, mmwMetrics: d.mmwMetrics },
    { _type: 'sezioneMetodo' },
    { _type: 'sezioneTestimonianze' },
    // Testi che prima erano scritti nel componente PortfolioGrid.
    {
      _type: 'sezioneProgetti',
      eyebrow: 'Progetti',
      title: 'Storie di trasformazione territoriale',
      intro: 'Quello che abbiamo costruito insieme ai nostri partner',
      ctaLabel: 'Vedi tutti i progetti',
    },
    {
      _type: 'ctaBanner',
      title: d.ctaBanner1Title,
      body: d.ctaBanner1Body,
      primaryCta: link(d.ctaBanner1PrimaryLabel, d.ctaBanner1PrimaryHref),
      secondaryCta: link(d.ctaBanner1SecondaryLabel, d.ctaBanner1SecondaryHref),
    },
    {
      _type: 'sezioneChiSiamo',
      title: d.aboutTitle,
      p1: d.aboutP1,
      p2: d.aboutP2,
      p3: d.aboutP3,
      ctaLabel: d.aboutCtaLabel,
      ctaHref: d.aboutCtaHref,
      image: d.aboutImage,
      imageAlt: d.aboutImageAlt,
    },
  ];
  if (!d.ctaBanner2Hidden) {
    s.push({
      _type: 'ctaBanner',
      title: d.ctaBanner2Title,
      primaryCta: link(d.ctaBanner2PrimaryLabel, d.ctaBanner2PrimaryHref),
      secondaryCta: link(d.ctaBanner2SecondaryLabel, d.ctaBanner2SecondaryHref),
    });
  }
  if (!d.newsletterHidden) {
    s.push({
      _type: 'sezioneNewsletter',
      title: d.newsletterTitle,
      body: d.newsletterBody,
      placeholder: d.newsletterPlaceholder,
      button: d.newsletterButton,
      privacy: d.newsletterPrivacy,
      success: d.newsletterSuccess,
    });
  }
  // Via i campi vuoti (es. il testo di un banner che non ce l'ha).
  return s.map((x) => ({ _key: key(), ...Object.fromEntries(Object.entries(x).filter(([, v]) => v !== undefined)) }));
}

const docs = await client.fetch<Doc[]>(`*[_id in ["pagina-home", "drafts.pagina-home"]]`);
const tx = client.transaction();
for (const d of docs) {
  const lista = sezioni(d);
  tx.patch(d._id, (p) => p.setIfMissing({ sezioni: lista }));
  console.log(`${d._id}${d.sezioni ? ' (ha già le sezioni, non toccato)' : ''}: ${lista.map((x) => x._type).join(', ')}`);
}
await tx.commit();
