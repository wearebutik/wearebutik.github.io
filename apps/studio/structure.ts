// Struttura dello Studio: progetti come elenco riordinabile a trascinamento
// (l'ordine è quello del sito), servizi come elenco semplice (l'ordine lo
// decide il blocco "Elenco dei servizi" della pagina), le pagine come voci
// fisse (un documento ciascuna, _id `pagina-<id>`). In cima, "Bozze da
// pubblicare" raccoglie ogni documento con modifiche non ancora pubblicate.
import type { StructureResolver } from 'sanity/structure';
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';
import { PAGINE, pagineTypes } from './schemaTypes/pagine';

export const PAGINE_TYPES = new Set<string>(Object.keys(PAGINE));

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Contenuti')
    .items([
      // Tutte le bozze, di qualsiasi tipo, dalla più recente: per controllarle
      // e pubblicarle senza aprire gli elenchi uno per uno.
      S.listItem()
        .title('Bozze da pubblicare')
        .id('bozze')
        .child(
          S.documentList()
            .title('Bozze da pubblicare')
            .apiVersion('2026-09-01')
            // Gli elenchi dello Studio leggono con le bozze applicate: lì `_id` è
            // quello pubblicato, e il prefisso `drafts.` resta in `_originalId`.
            .filter('_originalId in path("drafts.**")')
            .defaultOrdering([{ field: '_updatedAt', direction: 'desc' }]),
        ),
      S.divider(),
      orderableDocumentListDeskItem({ type: 'progetto', title: 'Progetti', S, context }),
      S.documentTypeListItem('servizio').title('Servizi'),
      S.divider(),
      S.listItem()
        .title('Pagine')
        .child(
          S.list()
            .title('Pagine')
            .items(
              pagineTypes.map((t) =>
                S.listItem()
                  .title(t.title ?? t.name)
                  .id(t.name)
                  .child(
                    S.document()
                      .schemaType(t.name)
                      .documentId(`pagina-${PAGINE[t.name as keyof typeof PAGINE]}`),
                  ),
              ),
            ),
        ),
    ]);
