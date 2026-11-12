// Una tantum: porta Chi siamo, Servizi e Progetti dai campi fissi alla lista
// `sezioni` (ADR-0004, *Pages as sections*), nello stesso ordine e con gli
// stessi testi di prima. Vale per la versione pubblicata e per la bozza, se
// c'è: ognuna dai suoi campi. Il metodo di Servizi resta nei suoi campi fissi.
//
//   pnpm --filter @butik/studio pagine-a-sezioni
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
// Più campi di testo formattato in uno: un paragrafo per blocco, come prima.
const unisci = (...campi: unknown[]) =>
  campi.flatMap((c) => (Array.isArray(c) ? c : [])).map((b: Doc) => ({ ...b, _key: key() }));
// Testo semplice → un paragrafo di testo formattato.
const paragrafo = (text?: string) =>
  text
    ? [{ _type: 'block', _key: key(), style: 'normal', markDefs: [], children: [{ _type: 'span', _key: key(), text, marks: [] }] }]
    : [];

const SEZIONI: Record<string, (d: Doc) => Doc[]> = {
  'pagina-chi-siamo': (d) => [
    { _type: 'sezioneTestataFoto', title: d.heroTitle, subtitle: d.heroSubtitle, image: d.heroImage, imageAlt: d.heroImageAlt },
    { _type: 'sezioneTesto', eyebrow: d.introEyebrow, testo: unisci(d.introP1, d.introP2, d.introP3, d.introP4) },
    {
      _type: 'sezioneMissione',
      missionEyebrow: d.missionEyebrow,
      missionStatement: d.missionStatement,
      sdgEyebrow: d.sdgEyebrow,
      sdgIntro: d.sdgIntro,
      sdgObiettivoLabel: d.sdgObiettivoLabel,
      sdg: d.sdg,
    },
    {
      _type: 'sezioneTeam',
      eyebrow: d.teamEyebrow,
      testo: unisci(d.teamP1, d.teamP2, d.teamP3),
      founders: d.founders,
      linkedinLabel: d.linkedinLabel,
    },
    { _type: 'sezioneCitazione', quote: d.testimonialQuote, author: d.testimonialAuthor },
    { _type: 'sezioneTestimonianze' },
    { _type: 'ctaBanner', title: d.ctaTitle, body: d.ctaBody, primaryCta: link(d.ctaLabel, d.ctaHref) },
  ],
  'pagina-servizi': (d) => [
    {
      _type: 'sezioneIntestazione',
      eyebrow: d.headerEyebrow,
      title: d.headerTitle,
      testo: unisci(paragrafo(d.headerIntro1), d.headerIntro2),
    },
    { _type: 'sezioneElencoServizi' },
    { _type: 'sezioneMetodo' },
    {
      _type: 'ctaBanner',
      title: d.ctaTitle,
      primaryCta: link(d.ctaPrimaryLabel, d.ctaPrimaryHref),
      secondaryCta: link(d.ctaSecondaryLabel, d.ctaSecondaryHref),
    },
  ],
  'pagina-progetti': (d) => [
    { _type: 'sezioneTitolo', eyebrow: d.eyebrow, title: d.title },
    { _type: 'sezioneElencoProgetti', clienteLabel: d.clienteLabel },
  ],
};

const ids = Object.keys(SEZIONI).flatMap((id) => [id, `drafts.${id}`]);
const docs = await client.fetch<Doc[]>(`*[_id in $ids]`, { ids });
const tx = client.transaction();
for (const d of docs) {
  const lista = SEZIONI[d._id.replace(/^drafts\./, '')](d)
    // Via i campi vuoti (es. un'immagine o un pulsante che non c'è).
    .map((x): Doc => ({ _key: key(), ...Object.fromEntries(Object.entries(x).filter(([, v]) => v !== undefined)) }));
  tx.patch(d._id, (p) => p.setIfMissing({ sezioni: lista }));
  console.log(`${d._id}${d.sezioni ? ' (ha già le sezioni, non toccato)' : ''}: ${lista.map((x) => x._type).join(', ')}`);
}
await tx.commit();
