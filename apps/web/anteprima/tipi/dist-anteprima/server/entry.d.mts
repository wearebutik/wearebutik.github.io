// L'entry del server dell'anteprima (src/lib/anteprima/server.ts), come la
// scrive il build. Vedi file-client.d.ts.
import type { IncomingMessage, ServerResponse } from 'node:http';
export function handler(req: IncomingMessage, res: ServerResponse): Promise<void>;
