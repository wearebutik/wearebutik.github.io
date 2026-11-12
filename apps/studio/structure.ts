// Struttura dello Studio: progetti e servizi come elenchi riordinabili a
// trascinamento (l'ordine è quello del sito), le pagine come voci fisse (un
// documento ciascuna, _id `pagina-<id>`).
import type { StructureResolver } from 'sanity/structure';
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';
import { PAGINE, pagineTypes } from './schemaTypes/pagine';

export const PAGINE_TYPES = new Set<string>(Object.keys(PAGINE));

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Contenuti')
    .items([
      orderableDocumentListDeskItem({ type: 'progetto', title: 'Progetti', S, context }),
      orderableDocumentListDeskItem({ type: 'servizio', title: 'Servizi', S, context }),
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
