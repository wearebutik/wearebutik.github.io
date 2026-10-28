// Entry del server dell'anteprima quando gira in un Service Worker
// (preview/worker.ts): niente node:http, Request e Response sono già quelli del
// browser.
import { createApp } from 'astro/app/entrypoint';

const app = createApp();

export function render(request: Request) {
  return app.render(request, { routeData: app.match(request) });
}
