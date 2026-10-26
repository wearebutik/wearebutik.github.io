// butik-anteprima: il sito con le bozze di Sanity, su localhost. Lo usa chi
// scrive i testi accanto allo Studio (Presentation tool), ADR-0004.
//
//   butik-anteprima login [--provider google|github|sanity]
//   butik-anteprima [--port 4321]
//
// Il token è quello dell'utente Sanity: lo dà `login` (lo stesso flusso di
// `sanity login`), oppure arriva da SANITY_AUTH_TOKEN o dal config della CLI
// di Sanity. Non è mai dentro il binario, che è pubblico.
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir, hostname } from 'node:os';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import fileClient from '../dist-anteprima/file-client';

const API = 'https://api.sanity.io/v2025-09-23';
const CONFIG = join(homedir(), '.config', 'butik-anteprima', 'config.json');
const CONFIG_SANITY = join(homedir(), '.config', 'sanity', 'config.json');

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    port: { type: 'string', default: '4321' },
    provider: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  },
  allowPositionals: true,
});

const leggi = (f: string) => (existsSync(f) ? (JSON.parse(readFileSync(f, 'utf8')).authToken as string) : undefined);

function token() {
  return process.env.SANITY_AUTH_TOKEN || leggi(CONFIG) || leggi(CONFIG_SANITY);
}

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

async function login(provider: string | undefined) {
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
    const nuovo = await promise;
    mkdirSync(dirname(CONFIG), { recursive: true });
    writeFileSync(CONFIG, JSON.stringify({ authToken: nuovo }), { mode: 0o600 });
    console.log(`Login fatto: token salvato in ${CONFIG}`);
  } finally {
    server.close();
  }
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

async function avvia(porta: number) {
  const t = token();
  const utente = t ? await chi(t) : undefined;
  if (t && !utente) throw new Error('token Sanity non valido o scaduto: rifai `butik-anteprima login`');
  if (utente) console.log(`Bozze lette come ${utente.name ?? utente.email}`);
  else console.warn('Nessun login: vedi solo i testi pubblicati. Esegui `butik-anteprima login`.');

  // Il client Sanity del sito legge il token all'import: va impostato prima.
  if (t) process.env.SANITY_AUTH_TOKEN = t;
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
    console.log('butik-anteprima login [--provider google|github|sanity]\nbutik-anteprima [--port 4321]');
  } else if (positionals[0] === 'login') {
    await login(values.provider);
  } else {
    await avvia(Number(values.port));
  }
} catch (err) {
  // Chi lo usa vede il messaggio, non lo stack del codice compilato.
  console.error(`butik-anteprima: ${(err as Error).message}`);
  process.exit(1);
}
