// Testo formattato da Sanity (tipo `testoFormattato`: grassetto, corsivo, link)
// → HTML inline con le classi del copy editoriale: <strong class="copy-strong">,
// <a class="copy-link">. L'elemento contenitore (<p>, <address>…) resta nella
// pagina che lo usa, con `set:html`, così ne mantiene gli stili scoped. Gli a
// capo diventano <br />; più paragrafi nello stesso campo sono separati da
// una riga vuota.
interface Span {
  _type: string;
  text?: string;
  marks?: string[];
}
interface Block {
  _type: string;
  children?: Span[];
  markDefs?: { _key: string; _type: string; href?: string }[];
}

// Stessi schemi ammessi dallo Studio (apps/studio/schemaTypes/testo.ts).
const SAFE_HREF = /^(https?:|mailto:|tel:|\/|#|\?)/i;

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function spanHtml(span: Span, markDefs: Block['markDefs'] = []): string {
  let html = escape(span.text ?? '').replace(/\n/g, '<br />');
  for (const mark of [...(span.marks ?? [])].reverse()) {
    const def = markDefs.find((d) => d._key === mark);
    if (def?._type === 'link') {
      // Solo schemi sicuri: un href come `javascript:` resta testo, senza link.
      const href = (def.href ?? '').trim();
      if (SAFE_HREF.test(href)) html = `<a href="${escape(href)}" class="copy-link">${html}</a>`;
    }
    else if (mark === 'strong') html = `<strong class="copy-strong">${html}</strong>`;
    else if (mark === 'em') html = `<em>${html}</em>`;
  }
  return html;
}

export function richTextHtml(value: unknown): string {
  return ((value as Block[] | undefined) ?? [])
    .filter((b) => b._type === 'block')
    .map((b) => (b.children ?? []).map((s) => spanHtml(s, b.markDefs)).join(''))
    .join('<br /><br />');
}
