// Struttura dello Studio: progetti e servizi come elenchi, le pagine come voci
// fisse (un documento ciascuna, _id `pagina-<id>`).
import type { StructureResolver } from 'sanity/structure';
import { PAGINE, pagineTypes } from './schemaTypes/pagine';

export const PAGINE_TYPES = new Set<string>(Object.keys(PAGINE));

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Contenuti')
    .items([
      S.documentTypeListItem('progetto').title('Progetti'),
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
