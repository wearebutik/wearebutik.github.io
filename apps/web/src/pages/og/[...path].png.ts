// Endpoint statico: a build-time genera una PNG OG per ogni rotta con card.
// getStaticPaths enumera tutte le rotte → Astro scrive i file in dist/og/*.png.
// A runtime non gira nulla: l'hosting serve i PNG già pronti.
import type { APIRoute, GetStaticPaths } from 'astro';
import { getAllOgCards, routeToParam, CARD_HANDLE, type OgCard } from '../../data/ogCards';
import { renderCardPng } from '../../lib/og/render';

export const getStaticPaths: GetStaticPaths = async () => {
  const cards = await getAllOgCards();
  return [...cards.entries()].map(([route, card]) => ({
    params: { path: routeToParam(route) },
    props: { card },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const png = await renderCardPng(props.card as OgCard, CARD_HANDLE);
  // Nessun Cache-Control "immutable": nel build statico la
  // Response viene ignorata, e in dev causerebbe solo PNG vecchie in cache.
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
};
