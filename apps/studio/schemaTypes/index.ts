import { progetto } from './progetto';
import { servizio } from './servizio';
import { imageBlock, imageSide, imageCarousel, figura } from './blocchi';
import { sezioniServizio } from './sezioniServizio';
import { testoFormattato, link, linkSegnaposto } from './testo';
import { pagineTypes, testoLegale } from './pagine';

// ── Avviso sui link segnaposto, su tutto lo schema ──────────────────────────
// Ogni campo `string` o `text`, a qualsiasi profondità (oggetti, liste,
// campi delle annotazioni nel Portable Text), riceve l'avviso
// `linkSegnaposto` oltre alla sua validazione. Un campo aggiunto in futuro è
// coperto senza fare nulla.
type Nodo = Record<string, any>;
const TESTUALI = new Set(['string', 'text']);

function conAvvisoSegnaposto(nodo: Nodo): Nodo {
  const out: Nodo = { ...nodo };
  if (TESTUALI.has(nodo.type)) {
    const propria = nodo.validation;
    out.validation = (r: any) => [
      ...[propria?.(r)].flat().filter(Boolean),
      r.custom(linkSegnaposto).warning(),
    ];
  }
  if (Array.isArray(nodo.fields)) out.fields = nodo.fields.map(conAvvisoSegnaposto);
  if (Array.isArray(nodo.of)) out.of = nodo.of.map(conAvvisoSegnaposto);
  if (Array.isArray(nodo.marks?.annotations)) {
    out.marks = { ...nodo.marks, annotations: nodo.marks.annotations.map(conAvvisoSegnaposto) };
  }
  return out;
}

export const schemaTypes = [
  progetto,
  servizio,
  figura,
  imageBlock,
  imageSide,
  imageCarousel,
  ...sezioniServizio,
  testoFormattato,
  testoLegale,
  link,
  ...pagineTypes,
].map((t) => conAvvisoSegnaposto(t as Nodo)) as typeof pagineTypes;
