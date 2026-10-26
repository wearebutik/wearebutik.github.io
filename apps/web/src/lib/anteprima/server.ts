// Entry del server dell'anteprima delle bozze: un handler `node:http` e
// nient'altro. I file statici li serve il binario (anteprima/cli.ts), che li
// porta dentro di sé: per questo non si usa @astrojs/node, che li cerca su disco.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from 'astro/app/entrypoint';
import { createRequestFromNodeRequest, writeResponse } from 'astro/app/node';

const app = createApp();

export async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const request = createRequestFromNodeRequest(req);
    await writeResponse(await app.render(request, { routeData: app.match(request) }), res);
  } catch (err) {
    console.error(`errore su ${req.url}:`, err);
    if (!res.headersSent) res.writeHead(500).end(String(err));
  }
}
