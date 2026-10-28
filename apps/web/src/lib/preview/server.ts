// Entry del server dell'anteprima, che gira in un Service Worker
// (preview/worker.ts): niente node:http, Request e Response sono già quelli del
// browser. Il token di chi scrive e la prospettiva scelta nello Studio arrivano
// con ogni richiesta; senza token, si vedono i contenuti pubblicati.
import type { ClientPerspective } from '@sanity/client';
import { createApp } from 'astro/app/entrypoint';
import { impostaSessione } from '#lib/anteprima/contenuti';

export { attendi, svuota } from '#lib/anteprima/contenuti';

const app = createApp();

export function render(request: Request, token: string | undefined, prospettiva?: ClientPerspective) {
  impostaSessione(token, prospettiva);
  return app.render(request, { routeData: app.match(request) });
}
