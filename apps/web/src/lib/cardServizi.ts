// Il link di una card dell'Elenco dei servizi (sezioneElencoServizi): lo
// decide la card con «Mostra il link», e il sito lo mostra solo se porta da
// qualche parte (`valido`, di solito linkValido di lib/links.ts: sul sito
// pubblico una scheda non pubblicata non esiste).

interface LinkCard {
  mostraLink?: boolean;
  href?: string;
  linkLabel?: string;
}

export async function linkDellaCard(
  card: LinkCard,
  valido: (href: string) => Promise<boolean>,
): Promise<{ href: string; label: string } | undefined> {
  if (!card.mostraLink || !card.href || !card.linkLabel) return undefined;
  return (await valido(card.href)) ? { href: card.href, label: card.linkLabel } : undefined;
}
