// Il Worker del modulo contatti: tutta la logica sta in form.ts.
import { gestisci, type Env } from './form';

export default {
  fetch: (req: Request, env: Env) => gestisci(req, env),
};
