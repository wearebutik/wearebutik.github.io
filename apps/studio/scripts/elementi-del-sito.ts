// Una tantum: porta footer, banner dei cookie e testimonianze dalle «pagine»
// agli «elementi del sito», con un tipo proprio, e crea l'header con le voci
// del menu che oggi stanno nel codice. Su Sanity un documento non cambia tipo:
// lo script crea i documenti nuovi con gli stessi campi e poi, in un secondo
// passo, cancella i vecchi.
//
//   pnpm --filter @butik/studio elementi-del-sito crea
//     Prima del merge: crea `header`, `footer`, `banner-cookie`,
//     `testimonials` (pubblicati, e le bozze se ci sono). I vecchi documenti
//     restano, così il sito di oggi continua a costruirsi.
//
//   pnpm --filter @butik/studio elementi-del-sito cancella-vecchi
//     Dopo il merge e il deploy (sito e Studio): cancella `pagina-footer`,
//     `pagina-banner-cookie`, `pagina-testimonials` e le loro bozze.
//
// Senza argomento mostra cosa farebbe e non scrive niente. `crea` non tocca un
// documento nuovo che esiste già (createIfNotExists): si può rilanciare.
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2026-09-01', perspective: 'raw' });

type Doc = Record<string, any>;

// vecchio _id → nuovo _id e nuovo tipo
const DA_SPOSTARE = [
  { da: 'pagina-footer', a: 'footer', tipo: 'footer' },
  { da: 'pagina-banner-cookie', a: 'banner-cookie', tipo: 'bannerCookie' },
  { da: 'pagina-testimonials', a: 'testimonials', tipo: 'testimonials' },
] as const;

// L'header di oggi (apps/web/src/components/Header.astro prima di questa
// migrazione).
const HEADER = {
  _id: 'header',
  _type: 'header',
  voci: [
    { _key: 'chi-siamo', _type: 'link', label: 'Chi siamo', href: '/chi-siamo' },
    { _key: 'servizi', _type: 'link', label: 'Servizi', href: '/servizi' },
    { _key: 'contatti', _type: 'link', label: 'Contatti', href: '/contatti' },
    { _key: 'progetti', _type: 'link', label: 'Portfolio', href: '/progetti' },
  ],
  ctaLabel: 'Lavoriamo insieme',
  ctaHref: '/contatti',
};

const comando = process.argv.slice(2).find((a) => !a.startsWith('--'));
const scrive = comando === 'crea' || comando === 'cancella-vecchi';
if (comando && !scrive) throw new Error(`Comando sconosciuto "${comando}": usa crea oppure cancella-vecchi.`);

// I campi di sistema li assegna Sanity al documento nuovo.
const senzaSistema = ({ _id, _type, _rev, _createdAt, _updatedAt, ...campi }: Doc) => campi;

const tx = client.transaction();

if (comando !== 'cancella-vecchi') {
  for (const { da, a, tipo } of DA_SPOSTARE) {
    for (const [vecchio, nuovo] of [[da, a], [`drafts.${da}`, `drafts.${a}`]]) {
      const doc = await client.getDocument<Doc>(vecchio);
      if (!doc) continue;
      tx.createIfNotExists({ ...senzaSistema(doc), _id: nuovo, _type: tipo });
      console.log(`${vecchio} → ${nuovo} (${tipo})`);
    }
  }
  tx.createIfNotExists(HEADER);
  console.log(`header: ${HEADER.voci.map((v) => v.label).join(', ')} · ${HEADER.ctaLabel}`);
} else {
  for (const { da } of DA_SPOSTARE) {
    for (const id of [da, `drafts.${da}`]) {
      if (!(await client.getDocument(id))) continue;
      tx.delete(id);
      console.log(`cancello ${id}`);
    }
  }
}

if (scrive) {
  await tx.commit();
  console.log('Fatto.');
} else {
  console.log('\nProva: niente è stato scritto. Lancia con `crea` (prima del merge) o `cancella-vecchi` (dopo il deploy).');
}
