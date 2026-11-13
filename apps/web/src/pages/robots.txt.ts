// /robots.txt del sito pubblicato (testo in lib/seo/robots.ts). Sulla beta
// deploy-beta.yml lo sostituisce dopo il build con uno che blocca tutto.
import type { APIRoute } from 'astro';
import { testoRobots } from '#lib/seo/robots';

export const prerender = true;

export const GET: APIRoute = ({ site }) =>
  new Response(testoRobots(site), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
