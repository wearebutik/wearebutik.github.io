// Nota dentro le sezioni che non hanno testi propri (loghi, metodo,
// testimonianze, elenco dei servizi): dice da dove arrivano i contenuti e,
// quando la fonte è un documento, porta lì con un link.
import { Card, Stack, Text } from '@sanity/ui';
import { IntentLink } from 'sanity/router';

export interface Fonte {
  /** Frase completa: "I loghi arrivano dalla pagina Partner." */
  testo: string;
  /** Documento da aprire, se la fonte è un documento. */
  documento?: { id: string; type: string; etichetta: string };
}

export function notaSezione({ testo, documento }: Fonte) {
  return function NotaSezione() {
    return (
      <Card padding={3} radius={2} tone="primary" border>
        <Stack gap={3}>
          <Text size={1}>{testo}</Text>
          {documento && (
            <Text size={1} weight="semibold">
              <IntentLink intent="edit" params={{ id: documento.id, type: documento.type }}>
                {documento.etichetta} →
              </IntentLink>
            </Text>
          )}
        </Stack>
      </Card>
    );
  };
}
