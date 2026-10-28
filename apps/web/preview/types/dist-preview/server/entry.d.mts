// L'entry del server per il Service Worker (src/lib/preview/server.ts), come la
// scrive il build: serve al controllo dei tipi di worker.ts quando
// dist-preview/ non esiste (tsconfig.json, `rootDirs`).
export function render(request: Request, token: string | undefined): Promise<Response>;
