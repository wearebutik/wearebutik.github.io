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
    const rispondi = (e: MessageEvent) => {
      if (e.origin !== ANTEPRIMA_WEB || e.data?.type !== 'butik-preview/token-request') return;
      const token = client.config().token;
      if (token) (e.source as Window | null)?.postMessage({ type: 'butik-preview/token', token }, ANTEPRIMA_WEB);
    };
    window.addEventListener('message', rispondi);
    return () => window.removeEventListener('message', rispondi);
  }, [client]);

  return props.renderDefault(props);
}
