// Entry del server dell'anteprima quando gira in un Service Worker
// (preview/worker.ts): niente node:http, Request e Response sono già quelli del
// browser. Il token di chi scrive arriva con ogni richiesta, dal login nel
// browser; senza, si vedono i contenuti pubblicati.
import { createApp } from 'astro/app/entrypoint';
import { impostaToken } from '#lib/anteprima/contenuti';

const app = createApp();

export function render(request: Request, token: string | undefined) {
  impostaToken(token);
  return app.render(request, { routeData: app.match(request) });
}
