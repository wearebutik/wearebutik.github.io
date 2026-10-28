// Collegamento con la scheda Anteprima web dello Studio, solo nell'anteprima
// delle bozze: la scheda segue le pagine che si aprono, il clic su un testo
// apre il suo campo, a ogni modifica salvata la pagina si ricarica, e la
// prospettiva scelta nello Studio (bozze, pubblicati, release) passa al worker
// che renderizza le pagine (preview/session.ts, /_perspective).
import { enableVisualEditing } from '@sanity/visual-editing';
import { navigate } from 'astro:transitions/client';

// Mentre si scrive arrivano molte modifiche di fila: si ricarica una volta,
// a scrittura ferma.
const ATTESA_MS = 600;

export function avviaVisualEditing() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  enableVisualEditing({
    history: {
      subscribe: (naviga) => {
        const segnala = () => naviga({ type: 'push', url: location.pathname + location.search + location.hash });
        document.addEventListener('astro:page-load', segnala);
        return () => document.removeEventListener('astro:page-load', segnala);
      },
      update: (u) => {
        if (u.type === 'pop') history.back();
        else navigate(u.url, { history: u.type === 'replace' ? 'replace' : 'push' });
      },
    },
    onPerspectiveChange: (prospettiva) =>
      fetch('/_perspective', { method: 'POST', body: JSON.stringify(prospettiva) }).then((r) => {
        if (r.status === 201) location.reload();
      }),
    refresh: () =>
      new Promise((fatto) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          location.reload();
          fatto();
        }, ATTESA_MS);
      }),
  });
}
