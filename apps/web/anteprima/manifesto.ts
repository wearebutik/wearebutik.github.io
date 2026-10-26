// Scrive dist-anteprima/file-client.ts: un import `type: 'file'` per ogni file statico del
// build dell'anteprima, così `bun build --compile` li porta dentro il binario
// e il server li trova senza una cartella accanto.
import { readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const client = join(import.meta.dir, '../dist-anteprima/client');
const file = readdirSync(client, { recursive: true, withFileTypes: true })
  .filter((d) => d.isFile())
  .map((d) => relative(client, join(d.parentPath, d.name)));

const righe = file.map((f, i) => `import f${i} from './client/${f}' with { type: 'file' };`);
const mappa = file.map((f, i) => `  '/${f}': f${i},`);
writeFileSync(
  join(import.meta.dir, '../dist-anteprima/file-client.ts'),
  `// Generato da manifesto.ts: non modificare.\n// Gli import type: 'file' sono di Bun: TypeScript non li conosce.\n// @ts-nocheck\n${righe.join('\n')}\n\nexport default {\n${mappa.join('\n')}\n} as Record<string, string>;\n`,
);
console.log(`${file.length} file statici nel manifesto`);
