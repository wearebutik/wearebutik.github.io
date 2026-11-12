// Una tantum: crea il documento "Banner dei cookie" (`pagina-banner-cookie`)
// con i testi che il banner aveva nel codice (lib/consent/config.client.ts),
// corretti dove non erano più veri: niente cookie di marketing (categoria
// tolta), e la categoria Analisi descritta per quello che fa con il consenso.
//
//   pnpm --filter @butik/studio banner-cookie
//
// Va lanciato prima del merge del codice che legge il documento: il sito lo
// richiede in build. Non tocca un documento che esiste già
// (createIfNotExists).
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2026-09-01' });

let k = 0;
const key = () => `b${(k++).toString(36)}`;
type Pezzo = string | { testo: string; href: string };
// Un paragrafo di testo formattato; i pezzi con href diventano link.
const paragrafo = (...pezzi: Pezzo[]) => {
  const markDefs: { _key: string; _type: 'link'; href: string }[] = [];
  const children = pezzi.map((p) => {
    if (typeof p === 'string') return { _type: 'span', _key: key(), text: p, marks: [] as string[] };
    const def = { _key: key(), _type: 'link' as const, href: p.href };
    markDefs.push(def);
    return { _type: 'span', _key: key(), text: p.testo, marks: [def._key] };
  });
  return { _type: 'block', _key: key(), style: 'normal', markDefs, children };
};

const doc = {
  _id: 'pagina-banner-cookie',
  _type: 'paginaBannerCookie',
  titolo: 'Utilizziamo i cookie',
  testo: [
    paragrafo(
      'Misuriamo in forma aggregata e senza cookie le pagine visitate e le prestazioni del sito. Con il tuo consenso attiviamo anche cookie di analisi, per capire meglio come viene usato il sito. Nessun cookie di analisi parte senza il tuo consenso. Dettagli nella ',
      { testo: 'Cookie Policy', href: '/privacy#cookie' },
      '.',
    ),
  ],
  accetta: 'Accetta tutti',
  rifiuta: 'Rifiuta',
  preferenze: 'Gestisci preferenze',
  preferenzeTitolo: 'Preferenze cookie',
  accettaTutti: 'Accetta tutti',
  rifiutaTutti: 'Rifiuta tutti',
  salva: 'Salva preferenze',
  chiudi: 'Chiudi',
  necessariTitolo: 'Cookie necessari',
  necessariTesto:
    'Essenziali per il funzionamento del sito, come ricordare la tua scelta sui cookie. Sono sempre attivi e non possono essere disattivati.',
  analisiTitolo: 'Analisi utilizzo',
  analisiTesto:
    'Con PostHog, su server nell’Unione Europea: un identificativo per riconoscere le visite successive, i clic sulle pagine e la registrazione delle sessioni con testi e campi nascosti. Ci servono per capire come viene usato il sito e migliorarlo.',
  colonnaCookie: 'Cookie',
  colonnaDurata: 'Durata',
  colonnaDescrizione: 'Descrizione',
  informazioniTitolo: 'Più informazioni',
  informazioniTesto: [
    paragrafo(
      'Trovi tutti i dettagli nella ',
      { testo: 'Privacy & Cookie Policy', href: '/privacy' },
      ' e nei ',
      { testo: 'Termini di utilizzo', href: '/termini' },
      '.',
    ),
  ],
};

const esito = await client.createIfNotExists(doc);
console.log(`${esito._id}: ${esito._rev === undefined ? 'già presente' : 'pronto'}`);
