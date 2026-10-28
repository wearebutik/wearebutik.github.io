// La scheda «Anteprima web» apre l'anteprima che gira in un Service
// Worker (apps/web/preview). Nell'iframe il browser tiene storage e worker
// separati, e lì il login a Sanity non si apre: la pagina chiede il token della
// sessione dello Studio con postMessage, e lo Studio lo manda solo a quella
// origine. Il token non passa mai da un indirizzo.
import { useEffect } from 'react';
import { useClient, type LayoutProps } from 'sanity';

export const ANTEPRIMA_WEB = process.env.SANITY_STUDIO_ANTEPRIMA_WEB ?? 'https://butik.consiglio.fyi';

export function LayoutAnteprimaWeb(props: LayoutProps) {
  const client = useClient({ apiVersion: '2026-09-01' });

  useEffect(() => {
    // La pagina dell'anteprima chiede il token a ogni caricamento: da lì si
    // sa a quale finestra mandare anche gli altri messaggi.
    let anteprima: Window | null = null;
    const rispondi = (e: MessageEvent) => {
      if (e.origin !== ANTEPRIMA_WEB || e.data?.type !== 'butik-preview/token-request') return;
      anteprima = e.source as Window | null;
      const token = client.config().token;
      if (token) anteprima?.postMessage({ type: 'butik-preview/token', token }, ANTEPRIMA_WEB);
    };
    window.addEventListener('message', rispondi);

    // Una bozza scartata (Discard changes) sparisce, e la Presentation di
    // Sanity avvisa la pagina solo quando una bozza esiste e cambia: qui si
    // avvisa l'anteprima, che rilegge i contenuti senza quella bozza.
    const scarti = client
      .listen('*[_id in path("drafts.**") || _id in path("versions.**")]', {}, { events: ['mutation'], includeResult: false })
      .subscribe((ev) => {
        if (ev.type !== 'mutation' || ev.transition !== 'disappear') return;
        anteprima?.postMessage({ type: 'butik-preview/ricarica', id: ev.documentId }, ANTEPRIMA_WEB);
      });

    return () => {
      window.removeEventListener('message', rispondi);
      scarti.unsubscribe();
    };
  }, [client]);

  return props.renderDefault(props);
}
