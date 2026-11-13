// ── Modulo contatti (Worker) ───────────────────────────────────────────────
// Riceve il modulo della pagina Contatti, controlla Turnstile e inoltra il
// messaggio a info@wearebutik.com. Non conserva niente: il messaggio esiste
// solo nella mail che arriva alla casella (Privacy, «Per quanto tempo»).
//
// L'oggetto porta il codice [form-sito]: in Gmail un filtro le etichetta, e
// la pulizia periodica le trova tutte insieme. Chi scrive è il «Rispondi a»:
// si risponde dalla casella come a una mail qualsiasi.

/** Il messaggio nella forma del binding send_email (Cloudflare Email Service). */
export interface Messaggio {
  to: string;
  from: { email: string; name: string };
  replyTo: { email: string; name: string };
  subject: string;
  text: string;
}

export interface Env {
  EMAIL: { send(m: Messaggio): Promise<{ messageId: string }> };
  TURNSTILE_SECRET: string;
  DESTINATARIO: string;
  MITTENTE: string;
  /** Le pagine da cui il modulo può arrivare, separate da virgole. */
  ORIGINI: string;
}

/** true se Cloudflare conferma che a compilare il modulo è una persona. */
export type VerificaTurnstile = (token: string, segreto: string, ip: string | null) => Promise<boolean>;

export const verificaTurnstile: VerificaTurnstile = async (token, segreto, ip) => {
  const body = new FormData();
  body.set('secret', segreto);
  body.set('response', token);
  if (ip) body.set('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  if (!r.ok) return false;
  const esito = (await r.json()) as { success?: boolean };
  return esito.success === true;
};

const MAX = { name: 200, email: 254, organizzazione: 200, message: 5000 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Una riga sola: un a capo in un'intestazione della mail aprirebbe la strada a
// intestazioni aggiunte da chi scrive.
const riga = (s: string) => s.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();

function leggiCampi(dati: FormData) {
  const testo = (k: string) => {
    const v = dati.get(k);
    return typeof v === 'string' ? v : '';
  };
  const nome = riga(testo('name'));
  const email = riga(testo('email'));
  const organizzazione = riga(testo('organizzazione'));
  const messaggio = testo('message').trim();
  const valido =
    nome.length > 0 &&
    nome.length <= MAX.name &&
    email.length <= MAX.email &&
    EMAIL.test(email) &&
    organizzazione.length <= MAX.organizzazione &&
    messaggio.length > 0 &&
    messaggio.length <= MAX.message;
  return valido ? { nome, email, organizzazione, messaggio } : null;
}

export async function gestisci(req: Request, env: Env, verifica: VerificaTurnstile = verificaTurnstile): Promise<Response> {
  const origine = req.headers.get('Origin') ?? '';
  const ammessa = env.ORIGINI.split(',').map((o) => o.trim()).includes(origine);
  const cors: Record<string, string> = ammessa
    ? { 'Access-Control-Allow-Origin': origine, 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' }
    : {};
  const rispondi = (status: number, corpo?: object) =>
    new Response(corpo ? JSON.stringify(corpo) : null, {
      status,
      headers: { ...cors, ...(corpo && { 'Content-Type': 'application/json' }) },
    });

  if (!ammessa) return rispondi(403, { ok: false, errore: 'origine' });
  if (req.method === 'OPTIONS') return rispondi(204);
  if (req.method !== 'POST') return rispondi(405, { ok: false, errore: 'metodo' });

  let dati: FormData;
  try {
    dati = await req.formData();
  } catch {
    return rispondi(400, { ok: false, errore: 'campi' });
  }

  // Il campo trappola, nascosto alle persone: se è compilato è un bot. Gli si
  // risponde «ok» per non insegnargli niente.
  if (dati.get('botcheck')) return rispondi(200, { ok: true });

  const token = dati.get('cf-turnstile-response');
  if (typeof token !== 'string' || !token) return rispondi(403, { ok: false, errore: 'verifica' });

  const c = leggiCampi(dati);
  if (!c) return rispondi(400, { ok: false, errore: 'campi' });

  if (!(await verifica(token, env.TURNSTILE_SECRET, req.headers.get('CF-Connecting-IP')))) {
    return rispondi(403, { ok: false, errore: 'verifica' });
  }

  try {
    await env.EMAIL.send({
      to: env.DESTINATARIO,
      from: { email: env.MITTENTE, name: 'Sito butik' },
      replyTo: { email: c.email, name: c.nome },
      subject: `[form-sito] Messaggio da ${c.nome}`,
      text: [
        `Nome: ${c.nome}`,
        `Email: ${c.email}`,
        `Organizzazione: ${c.organizzazione || '—'}`,
        '',
        'Messaggio:',
        c.messaggio,
        '',
        '—',
        `Dal modulo contatti del sito. Rispondi a questa mail per scrivere a ${c.nome}.`,
      ].join('\n'),
    });
  } catch {
    return rispondi(502, { ok: false, errore: 'invio' });
  }
  return rispondi(200, { ok: true });
}
