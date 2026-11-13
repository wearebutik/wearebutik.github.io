// Il link di una card dell'Elenco dei servizi lo decide la card
// («Mostra il link»), e il sito lo mostra solo se porta da qualche parte.
import { describe, expect, it } from 'vitest';
import { linkDellaCard } from './cardServizi';

const valido = async (href: string) => href !== '/servizi/non-pubblicata';
const card = { mostraLink: true, href: '/servizi/consulenza-strategica', linkLabel: 'Scopri consulenza strategica' };

describe('linkDellaCard', () => {
  it('con «Mostra il link» acceso e una destinazione che esiste, la card porta lì', async () => {
    expect(await linkDellaCard(card, valido)).toEqual({ href: card.href, label: card.linkLabel });
  });

  it('con «Mostra il link» spento non c’è link, anche se la destinazione esiste', async () => {
    expect(await linkDellaCard({ ...card, mostraLink: false }, valido)).toBeUndefined();
  });

  it('se la destinazione non esiste sul sito il link sparisce', async () => {
    expect(await linkDellaCard({ ...card, href: '/servizi/non-pubblicata' }, valido)).toBeUndefined();
  });

  it('senza destinazione o senza testo non c’è link', async () => {
    expect(await linkDellaCard({ ...card, href: undefined }, valido)).toBeUndefined();
    expect(await linkDellaCard({ ...card, linkLabel: undefined }, valido)).toBeUndefined();
  });
});
