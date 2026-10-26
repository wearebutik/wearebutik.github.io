// butik-anteprima: il sito con le bozze di Sanity, su localhost. Lo usa chi
// scrive i testi accanto allo Studio (Presentation tool), ADR-0004.
//
//   butik-anteprima [--port 4321] [--provider google|github|sanity]
//   butik-anteprima logout
//
// A ogni avvio si accede a Sanity dal browser (lo stesso flusso di `sanity
// login`): la sessione vive solo in memoria e alla chiusura si revoca, così sul
// disco non resta nessun token. SANITY_AUTH_TOKEN, se c'è, salta il login e
// non si revoca: non l'ha creato il binario. Nessun token è dentro il binario,
// che è pubblico.
import { createServer } from 'node:http';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { homedir, hostname } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import fileClient from '../dist-anteprima/file-client';

const API = 'https://api.sanity.io/v2025-09-23';
// Dove la prima versione salvava il token: `logout` lo revoca e lo cancella.
const CONFIG = join(homedir(), '.config', 'butik-anteprima', 'config.json');

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    port: { type: 'string', default: '4321' },
    provider: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  },
  allowPositionals: true,
});

// Senza --provider si apre la pagina di login di Sanity, dove si sceglie il
// metodo (Google, GitHub, email, SSO): ognuno è un utente Sanity diverso, e va
// usato lo stesso dello Studio.
async function urlLogin(provider: string | undefined) {
  if (!provider) return 'https://www.sanity.io/login';
  const { providers } = (await (await fetch(`${API}/auth/providers`)).json()) as {
    providers: { name: string; url: string }[];
  };
  const scelto = providers.find((p) => p.name === provider);
  if (!scelto) throw new Error(`provider sconosciuto: ${provider} (${providers.map((p) => p.name).join(', ')})`);
  return scelto.url;
}

async function login(provider: string | undefined): Promise<string> {
  const base = await urlLogin(provider);

  // Il server di Sanity rimanda il browser a localhost con un id di sessione,
  // che /auth/fetch scambia con il token.
  const { promise, resolve, reject } = Promise.withResolvers<string>();
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname !== '/callback') return res.writeHead(404).end();
    try {
      const sid = new URL(url.searchParams.get('url') ?? '').search;
      const risposta = await fetch(`${API}/auth/fetch${sid}`);
      if (!risposta.ok) throw new Error(`/auth/fetch: HTTP ${risposta.status}`);
      resolve(((await risposta.json()) as { token: string }).token);
      res.writeHead(303, { Location: 'https://www.sanity.io/login/success' }).end();
    } catch (err) {
      reject(err);
      res.writeHead(303, { Location: 'https://www.sanity.io/login/error' }).end();
    }
  });
  await new Promise<void>((ok) => server.listen(0, ok));
  const { port } = server.address() as { port: number };

  const loginUrl = new URL(base);
  loginUrl.searchParams.set('type', 'token');
  loginUrl.searchParams.set('label', `${hostname().replace(/\.(local|lan)$/, '')} / butik-anteprima`);
  loginUrl.searchParams.set('origin', `http://localhost:${port}/callback`);
  console.log(`Apro il browser per il login su Sanity:\n${loginUrl}\n`);
  Bun.spawn(['open', loginUrl.href]);

  try {
    return await promise;
  } finally {
    server.close();
  }
}

/** Revoca la sessione su Sanity; una sessione già scaduta conta come revocata. */
async function revoca(t: string) {
  const r = await fetch(`${API}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${t}` } });
  if (!r.ok && r.status !== 401) throw new Error(`revoca della sessione: HTTP ${r.status}`);
}

async function logout() {
  if (!existsSync(CONFIG)) return console.log('Nessun token salvato.');
  await revoca(JSON.parse(readFileSync(CONFIG, 'utf8')).authToken as string);
  rmSync(CONFIG);
  console.log(`Sessione revocata e ${CONFIG} cancellato.`);
}

async function chi(t: string) {
  const r = await fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${t}` } });
  return r.ok ? ((await r.json()) as { name?: string; email?: string }) : undefined;
}

const TIPI: Record<string, string> = {
  css: 'text/css', js: 'text/javascript', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg',
  webp: 'image/webp', avif: 'image/avif', woff2: 'font/woff2', ico: 'image/x-icon', txt: 'text/plain',
  xml: 'application/xml', json: 'application/json', webmanifest: 'application/manifest+json',
};

async function avvia(porta: number, provider: string | undefined) {
  const daAmbiente = process.env.SANITY_AUTH_TOKEN;
  const t = daAmbiente || (await login(provider));
  const utente = await chi(t);
  if (!utente) throw new Error(daAmbiente ? 'SANITY_AUTH_TOKEN non valido o scaduto' : 'login non riuscito');
  console.log(`Bozze lette come ${utente.name ?? utente.email}`);

  if (!daAmbiente) {
    // Alla chiusura (Ctrl+C, terminale chiuso) la sessione si revoca.
    const chiudi = () =>
      revoca(t)
        .then(() => console.log('\nSessione Sanity revocata.'))
        .catch((err) => console.error(`\nbutik-anteprima: ${(err as Error).message}`))
        .finally(() => process.exit(0));
    for (const segnale of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) process.once(segnale, chiudi);
  }

  // Il client Sanity del sito legge il token all'import: va impostato prima.
  process.env.SANITY_AUTH_TOKEN = t;
  const { handler } = await import('../dist-anteprima/server/entry.mjs');

  createServer((req, res) => {
    const percorso = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    const statico = fileClient[percorso];
    if (statico) {
      const ext = percorso.split('.').pop() ?? '';
      res.writeHead(200, { 'Content-Type': TIPI[ext] ?? 'application/octet-stream' });
      Bun.file(statico).arrayBuffer().then((b) => res.end(Buffer.from(b)));
      return;
    }
    handler(req, res);
  }).listen(porta, () => console.log(`Anteprima su http://localhost:${porta}`));
}

try {
  if (values.help) {
    console.log('butik-anteprima [--port 4321] [--provider google|github|sanity]\nbutik-anteprima logout');
  } else if (positionals[0] === 'logout') {
    await logout();
  } else {
    await avvia(Number(values.port), values.provider);
  }
} catch (err) {
  // Chi lo usa vede il messaggio, non lo stack del codice compilato.
  console.error(`butik-anteprima: ${(err as Error).message}`);
  process.exit(1);
}
