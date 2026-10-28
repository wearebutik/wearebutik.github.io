// La sessione Sanity di chi scrive, nel Service Worker. Il token arriva in due
// modi: dal login fatto qui (/_login → Sanity → /_callback), o dallo Studio,
// che lo passa con postMessage all'anteprima aperta nella sua scheda
// Presentation (worker.ts), e da lì a /_token.
// Resta in IndexedDB, perché il browser ferma il worker quando è inattivo.
/// <reference lib="webworker" />

const API = 'https://uvzsc0vv.api.sanity.io/v2025-09-23';
const PROJECT_ID = 'uvzsc0vv';

// `nostra`: aperta da /_login, quindi si revoca all'uscita. Quella dello
// Studio resta allo Studio.
export type Sessione = { token: string; nome: string; nostra: boolean };

function negozio(modo: IDBTransactionMode) {
  return new Promise<IDBObjectStore>((ok, ko) => {
    const r = indexedDB.open('preview', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('sessione');
    r.onsuccess = () => ok(r.result.transaction('sessione', modo).objectStore('sessione'));
    r.onerror = () => ko(r.error);
  });
}

function esito<T>(r: IDBRequest<T>) {
  return new Promise<T>((ok, ko) => {
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ko(r.error);
  });
}

let attuale: Promise<Sessione | undefined> | undefined;

/**
 * La sessione salvata, ricontrollata su Sanity la prima volta che il worker la
 * legge: una sessione revocata, scaduta o di chi ha perso l'accesso al
 * progetto si cancella.
 */
export function sessione() {
  attuale ??= negozio('readonly')
    .then((s) => esito(s.get('sessione') as IDBRequest<Sessione | undefined>))
    .then(async (s) => {
      if (!s) return undefined;
      try {
        return await apri(s.token, s.nostra);
      } catch {
        await salva(undefined);
        return undefined;
      }
    });
  return attuale;
}

async function salva(s: Sessione | undefined) {
  const n = await negozio('readwrite');
  if (s) await esito(n.put(s, 'sessione'));
  else await esito(n.delete('sessione'));
  attuale = Promise.resolve(s);
}

/**
 * Chi è il token, e se è un membro del progetto: solo allora apre una
 * sessione. È l'unico controllo su chi vede l'anteprima (worker.ts).
 */
async function apri(token: string, nostra: boolean): Promise<Sessione> {
  const headers = { Authorization: `Bearer ${token}` };
  const [me, progetto] = await Promise.all([fetch(`${API}/users/me`, { headers }), fetch(`${API}/projects/${PROJECT_ID}`, { headers })]);
  const utente = me.ok ? ((await me.json()) as { id?: string; name?: string; email?: string }) : undefined;
  if (!utente?.id) throw new Error(`sessione Sanity non valida (HTTP ${me.status})`);
  if (!progetto.ok) throw new Error(`${utente.email ?? utente.id} non ha accesso al progetto butik (HTTP ${progetto.status})`);
  return { token, nome: utente.name ?? utente.email ?? utente.id, nostra };
}

export const html = (corpo: string, status = 200) =>
  new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Anteprima delle bozze · butik</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; font: 16px/1.5 system-ui, sans-serif; background: #f4f1ec; color: #1a1a1a; }
  main { width: min(26rem, 100% - 2rem); background: #fff; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px #0002; }
  h1 { margin: 0 0 .5rem; font-size: 1.4rem; }
  p { margin: 0 0 1rem; color: #555; }
  a.metodo { display: block; margin-top: .5rem; padding: .7rem 1rem; border: 1px solid #ccc; border-radius: 6px; color: inherit; text-decoration: none; text-align: center; font-weight: 600; }
  a.metodo:hover, a.metodo:focus-visible { border-color: #1a1a1a; }
</style>
<main>${corpo}</main>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );

/** Le pagine e le azioni della sessione; undefined per ogni altro indirizzo. */
export async function gestisci(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  switch (url.pathname) {
    // Ognuno dei metodi è un utente Sanity diverso: va usato lo stesso dello Studio.
    case '/_login': {
      const { providers } = (await (await fetch(`${API}/auth/providers`)).json()) as {
        providers: { name: string; title: string; url: string }[];
      };
      const link = providers.map((p) => {
        const u = new URL(p.url);
        u.searchParams.set('type', 'token');
        u.searchParams.set('projectId', PROJECT_ID);
        u.searchParams.set('label', 'butik-preview');
        u.searchParams.set('origin', `${url.origin}/_callback`);
        return `<a class="metodo" href="${u}">${p.title}</a>`;
      });
      return html(
        `<h1>Anteprima delle bozze</h1><p>Il sito di butik con i testi non ancora pubblicati. Accedi a Sanity con lo stesso metodo che usi per lo Studio.</p>${link.join('')}`,
      );
    }
    // Sanity rimanda qui con un id di sessione, che /auth/fetch scambia con il token.
    case '/_callback': {
      try {
        const sid = new URL(url.searchParams.get('url') ?? '').search;
        const r = await fetch(`${API}/auth/fetch${sid}`);
        if (!r.ok) throw new Error(`/auth/fetch: HTTP ${r.status}`);
        await salva(await apri(((await r.json()) as { token: string }).token, true));
        return Response.redirect(`${url.origin}/`, 303);
      } catch (err) {
        return html(`<h1>Login non riuscito</h1><p>${(err as Error).message}</p><p><a href="/_login">Riprova</a></p>`, 500);
      }
    }
    case '/_logout': {
      const s = await sessione();
      if (s?.nostra) await fetch(`${API}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${s.token}` } });
      await salva(undefined);
      return Response.redirect(`${url.origin}/_login`, 303);
    }
    // Il token dello Studio: 201 se la sessione è cambiata e la pagina va
    // ricaricata, 204 se era già questa.
    case '/_token': {
      if (request.method !== 'POST') return new Response(null, { status: 405 });
      const token = (await request.text()).trim();
      if (token === (await sessione())?.token) return new Response(null, { status: 204 });
      try {
        await salva(await apri(token, false));
        return new Response(null, { status: 201 });
      } catch (err) {
        return new Response((err as Error).message, { status: 401 });
      }
    }
  }
}
