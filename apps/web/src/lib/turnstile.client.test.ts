// @vitest-environment jsdom
// La verifica Turnstile del form contatti, con un finto `window.turnstile`:
// quando Cloudflare chiede la spunta il form deve saperlo subito e aspettare la
// persona senza scadenza; un errore o una sfida scaduta chiudono l'attesa.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Opzioni = Record<string, (arg?: string) => void>;

let opzioni: Opzioni;
const turnstile = {
  render: vi.fn((_el: HTMLElement, o: Opzioni) => {
    opzioni = o;
    return 'w1';
  }),
  reset: vi.fn(),
};

async function prepara(suInterazione = vi.fn()) {
  vi.resetModules();
  const { preparaTurnstile } = await import('./turnstile.client');
  const verifica = preparaTurnstile(document.createElement('div'), 'chiave', { suInterazione });
  verifica.avvia();
  await vi.waitFor(() => expect(turnstile.render).toHaveBeenCalled());
  return { verifica, suInterazione };
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  window.turnstile = turnstile as unknown as Window['turnstile'];
  turnstile.render.mockClear();
  turnstile.reset.mockClear();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('preparaTurnstile', () => {
  it('consegna il token appena la verifica invisibile è pronta', async () => {
    const { verifica } = await prepara();
    const token = verifica.token();
    opzioni.callback!('tok');
    await expect(token).resolves.toBe('tok');
  });

  it('senza risposta né richiesta di spunta, l\'attesa scade', async () => {
    const { verifica } = await prepara();
    const token = verifica.token();
    vi.advanceTimersByTime(30_000);
    await expect(token).rejects.toThrow('turnstile');
  });

  it('quando chiede la spunta lo dice e aspetta la persona senza scadenza', async () => {
    const { verifica, suInterazione } = await prepara();
    const token = verifica.token();
    opzioni['before-interactive-callback']!();
    expect(suInterazione).toHaveBeenLastCalledWith(true);
    vi.advanceTimersByTime(120_000);
    opzioni['after-interactive-callback']!();
    expect(suInterazione).toHaveBeenLastCalledWith(false);
    opzioni.callback!('tok');
    await expect(token).resolves.toBe('tok');
  });

  it('una sfida scaduta chiude l\'attesa con un errore', async () => {
    const { verifica } = await prepara();
    const token = verifica.token();
    opzioni['before-interactive-callback']!();
    opzioni['timeout-callback']!();
    await expect(token).rejects.toThrow('turnstile');
  });

  it('dopo un invio il token successivo è nuovo', async () => {
    const { verifica } = await prepara();
    opzioni.callback!('primo');
    await expect(verifica.token()).resolves.toBe('primo');
    verifica.rinnova();
    expect(turnstile.reset).toHaveBeenCalledWith('w1');
    const secondo = verifica.token();
    opzioni.callback!('secondo');
    await expect(secondo).resolves.toBe('secondo');
  });
});
