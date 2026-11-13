// Il testo di /llms.txt (pages/llms.txt.ts): la presentazione di butik per
// gli agenti AI (PDR-0007), nel formato di llmstxt.org. Titolo, la
// descrizione citabile (elemento del sito «Descrizione per gli agenti AI»),
// poi servizi, progetti e pagine con un link e una riga ciascuno, e i
// contatti. Indirizzi assoluti, con la barra finale come sul sito.

export interface DatiLlms {
  site: URL;
  nome: string;
  descrizione: string;
  dettagli?: string;
  servizi: { title: string; desc: string; ancora: string }[];
  progetti: { id: string; title: string; subtitle: string }[];
  pagine: { percorso: string; titolo: string; descrizione: string }[];
  contatti: { ragioneSociale: string; indirizzo: string; partitaIva: string; email: string };
}

const voce = (titolo: string, url: string, riga: string) => `- [${titolo}](${url}): ${riga}`;
const sezione = (titolo: string, voci: string[]) => (voci.length ? `## ${titolo}\n\n${voci.join('\n')}` : '');
// «Chi siamo — Butik» → «Chi siamo»: il nome del sito è già nel titolo del file.
const senzaNome = (titolo: string, nome: string) => titolo.replace(new RegExp(`\\s*[—–|-]\\s*${nome}\\s*$`, 'i'), '');

export function testoLlms(d: DatiLlms): string {
  const url = (percorso: string) => new URL(percorso, d.site).href;
  const parti = [
    `# ${d.nome}`,
    `> ${d.descrizione.trim()}`,
    d.dettagli?.trim() ?? '',
    sezione('Servizi', d.servizi.map((s) => voce(s.title, url(`/servizi/#${s.ancora}`), s.desc))),
    sezione('Progetti', d.progetti.map((p) => voce(p.title, url(`/progetti/${p.id}/`), p.subtitle))),
    sezione('Pagine', d.pagine.map((p) => voce(senzaNome(p.titolo, d.nome), url(`${p.percorso}/`), p.descrizione))),
    sezione('Contatti', [
      `- ${d.contatti.ragioneSociale}, P. IVA ${d.contatti.partitaIva}`,
      `- ${d.contatti.indirizzo}`,
      `- ${d.contatti.email}`,
    ]),
  ];
  return `${parti.filter(Boolean).join('\n\n')}\n`;
}
