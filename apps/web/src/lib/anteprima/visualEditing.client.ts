// Collegamento con la scheda Presentation dello Studio, solo nell'anteprima
// delle bozze: la scheda segue le pagine che si aprono, il clic su un testo
// apre il suo campo, e a ogni modifica salvata la pagina si ricarica.
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
