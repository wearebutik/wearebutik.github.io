// Forma del file che anteprima/manifesto.ts genera al build: percorso
// pubblicato → file dentro il binario. Serve al controllo dei tipi del CLI
// quando dist-anteprima/ non esiste (tsconfig.json, `rootDirs`).
declare const fileClient: Record<string, string>;
export default fileClient;
