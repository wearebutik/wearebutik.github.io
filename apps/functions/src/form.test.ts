// Il Worker del modulo contatti, con un finto invio e un finto Turnstile:
// conta cosa arriva a info@ e cosa risponde al browser, non come lo fa.
import { describe, expect, it, vi } from 'vitest';
import { gestisci, type Env, type Messaggio } from './form';

const ORIGINE = 'https://beta.wearebutik.com';

function ambiente() {
  const inviati: Messaggio[] = [];
  const env: Env = {
    EMAIL: { send: vi.fn(async (m: Messaggio) => (inviati.push(m), { messageId: 'x' })) },
    TURNSTILE_SECRET: 'segreto',
    DESTINATARIO: 'info@wearebutik.com',
    MITTENTE: 'sito@form.wearebutik.com',
    ORIGINI: `${ORIGINE},https://wearebutik.com`,
  };
  return { env, inviati };
}

const campi = (extra: Record<string, string> = {}) => ({
  name: 'Ada Rossi',
  email: 'ada@example.com',
  organizzazione: 'Comune di Prova',
  message: 'Vorremmo un progetto sul patrimonio musicale.',
  'cf-turnstile-response': 'token-buono',
  ...extra,
});

function richiesta(dati: Record<string, string>, init: { origine?: string; metodo?: string } = {}) {
  const body = new FormData();
  for (const [k, v] of Object.entries(dati)) body.set(k, v);
  return new Request('https://form.wearebutik.com/', {
    method: init.metodo ?? 'POST',
    headers: { Origin: init.origine ?? ORIGINE, 'CF-Connecting-IP': '203.0.113.7' },
    body: (init.metodo ?? 'POST') === 'POST' ? body : undefined,
  });
}

const turnstile = (esito: boolean) => vi.fn(async () => esito);

describe('un messaggio valido', () => {
  it('arriva a info@ con il codice per i filtri, e chi scrive è il destinatario della risposta', async () => {
    const { env, inviati } = ambiente();
    const r = await gestisci(richiesta(campi()), env, turnstile(true));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
    expect(inviati).toHaveLength(1);
    const m = inviati[0];
    expect(m.to).toBe('info@wearebutik.com');
    expect(m.from).toEqual({ email: 'sito@form.wearebutik.com', name: 'Sito butik' });
    expect(m.replyTo).toEqual({ email: 'ada@example.com', name: 'Ada Rossi' });
    expect(m.subject).toBe('[form-sito] Messaggio da Ada Rossi');
    expect(m.text).toContain('Comune di Prova');
    expect(m.text).toContain('Vorremmo un progetto sul patrimonio musicale.');
  });

  it('il browser può leggere la risposta (CORS per la pagina di origine)', async () => {
    const { env } = ambiente();
    const r = await gestisci(richiesta(campi()), env, turnstile(true));
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe(ORIGINE);
  });

  it('passa a Turnstile il token e l’indirizzo di chi scrive', async () => {
    const { env } = ambiente();
    const verifica = turnstile(true);
    await gestisci(richiesta(campi()), env, verifica);
    expect(verifica).toHaveBeenCalledWith('token-buono', 'segreto', '203.0.113.7');
  });

  it('un a capo nel nome non entra nell’oggetto della mail', async () => {
    const { env, inviati } = ambiente();
    await gestisci(richiesta(campi({ name: 'Ada\r\nBcc: altri@example.com' })), env, turnstile(true));
    expect(inviati[0].subject).toBe('[form-sito] Messaggio da Ada Bcc: altri@example.com');
  });
});

describe('cosa non parte', () => {
  it('senza Turnstile superato: 403, nessuna mail', async () => {
    const { env, inviati } = ambiente();
    const r = await gestisci(richiesta(campi()), env, turnstile(false));
    expect(r.status).toBe(403);
    expect(await r.json()).toEqual({ ok: false, errore: 'verifica' });
    expect(inviati).toHaveLength(0);
  });

  it('senza token Turnstile: 403 senza nemmeno chiedere a Cloudflare', async () => {
    const { env, inviati } = ambiente();
    const verifica = turnstile(true);
    const r = await gestisci(richiesta(campi({ 'cf-turnstile-response': '' })), env, verifica);
    expect(r.status).toBe(403);
    expect(verifica).not.toHaveBeenCalled();
    expect(inviati).toHaveLength(0);
  });

  it.each([
    ['nome vuoto', { name: '  ' }],
    ['email non valida', { email: 'non-una-mail' }],
    ['messaggio vuoto', { message: '' }],
    ['messaggio troppo lungo', { message: 'x'.repeat(5001) }],
  ])('%s: 400, nessuna mail', async (_, extra) => {
    const { env, inviati } = ambiente();
    const r = await gestisci(richiesta(campi(extra)), env, turnstile(true));
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ ok: false, errore: 'campi' });
    expect(inviati).toHaveLength(0);
  });

  it('il campo trappola compilato (un bot): risponde ok e non manda niente', async () => {
    const { env, inviati } = ambiente();
    const r = await gestisci(richiesta(campi({ botcheck: 'on' })), env, turnstile(true));
    expect(r.status).toBe(200);
    expect(inviati).toHaveLength(0);
  });

  it('da una pagina che non è del sito: 403, senza CORS', async () => {
    const { env, inviati } = ambiente();
    const r = await gestisci(richiesta(campi(), { origine: 'https://altro.example' }), env, turnstile(true));
    expect(r.status).toBe(403);
    expect(r.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(inviati).toHaveLength(0);
  });

  it('un metodo diverso da POST: 405', async () => {
    const { env } = ambiente();
    const r = await gestisci(richiesta({}, { metodo: 'GET' }), env, turnstile(true));
    expect(r.status).toBe(405);
  });

  it('se l’invio fallisce: 502, così il sito mostra l’errore', async () => {
    const { env } = ambiente();
    env.EMAIL.send = vi.fn(async () => {
      throw new Error('invio non riuscito');
    });
    const r = await gestisci(richiesta(campi()), env, turnstile(true));
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ ok: false, errore: 'invio' });
  });
});

describe('preflight CORS', () => {
  it('OPTIONS dalla pagina del sito: 204 con le intestazioni', async () => {
    const { env } = ambiente();
    const r = await gestisci(richiesta({}, { metodo: 'OPTIONS' }), env, turnstile(true));
    expect(r.status).toBe(204);
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe(ORIGINE);
    expect(r.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });
});
