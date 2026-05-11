// Script prebuild: valida todos los JSON de ediciones contra schema + coherencia
// Uso: tsx scripts/validate-content.ts

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { validateEdicion } from '../src/lib/validation/schemaValidator';

const CONTENT_DIR = join(process.cwd(), 'content', 'historia', 'ediciones');

function color(code: string, s: string) {
  return process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : s;
}
const red = (s: string) => color('31', s);
const green = (s: string) => color('32', s);
const yellow = (s: string) => color('33', s);
const dim = (s: string) => color('2', s);

let totalFiles = 0;
let totalErrors = 0;
const failed: string[] = [];

let files: string[];
try {
  files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json'));
} catch (err) {
  console.error(red(`✗ No se pudo leer ${CONTENT_DIR}`));
  console.error(err);
  process.exit(1);
}

console.log(dim(`\nValidando ${files.length} ediciones en ${CONTENT_DIR}\n`));

for (const file of files.sort()) {
  totalFiles++;
  const path = join(CONTENT_DIR, file);
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (err) {
    totalErrors++;
    failed.push(file);
    console.log(red(`✗ ${file}`));
    console.log(red(`  JSON inválido: ${(err as Error).message}`));
    continue;
  }

  const result = validateEdicion(data);
  if (result.ok) {
    console.log(green(`✓ ${file}`));
    continue;
  }
  totalErrors++;
  failed.push(file);
  console.log(red(`✗ ${file}`));
  if (result.schemaErrors) {
    for (const err of result.schemaErrors) {
      console.log(yellow(`  [schema] ${err.instancePath || '/'} ${err.message ?? ''}`));
    }
  }
  for (const issue of result.coherenceIssues) {
    console.log(yellow(`  [${issue.code}] ${issue.message}`));
  }
}

console.log(dim(`\n— ${totalFiles} archivos, ${totalErrors} con errores —\n`));

if (totalErrors > 0) {
  console.log(red(`Fallos en: ${failed.join(', ')}`));
  process.exit(1);
}
console.log(green('Todas las ediciones válidas.'));
