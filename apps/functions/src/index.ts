// Il Worker del modulo contatti: tutta la logica sta in modulo.ts.
import { gestisci, type Env } from './modulo';

export default {
  fetch: (req: Request, env: Env) => gestisci(req, env),
};
