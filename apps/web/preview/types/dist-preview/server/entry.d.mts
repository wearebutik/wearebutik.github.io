// L'entry del server per il Service Worker (src/lib/preview/server.ts), come la
// scrive il build: serve al controllo dei tipi di worker.ts quando
// dist-preview/ non esiste (tsconfig.json, `rootDirs`).
export function svuota(): void;
export function attendi(id: string, rev: string | null): Promise<void>;
export function render(request: Request, token: string | undefined, prospettiva?: string | string[]): Promise<Response>;
