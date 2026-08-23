import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const failures = [];

const requireFile = (file) => {
  if (!existsSync(path.join(root, file))) failures.push(`arquivo obrigatório ausente: ${file}`);
};

for (const file of ['dist/index.html', 'supabase/schema.sql', 'vercel.json', '.env.example']) {
  requireFile(file);
}

const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor !== 22) failures.push(`Node 22 é obrigatório; versão atual: ${process.versions.node}`);

const trackedFiles = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
  .trim()
  .split('\n');
const trackedSecrets = trackedFiles.filter((file) => /(^|\/)\.env($|\.)/.test(file) && file !== '.env.example');
if (trackedSecrets.length) failures.push(`arquivo(s) de ambiente versionado(s): ${trackedSecrets.join(', ')}`);

if (existsSync(path.join(root, 'vercel.json'))) {
  const config = JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const headers = new Set((config.headers ?? []).flatMap((rule) => rule.headers ?? []).map((header) => header.key.toLowerCase()));
  for (const header of ['content-security-policy', 'x-content-type-options', 'x-frame-options', 'referrer-policy', 'permissions-policy']) {
    if (!headers.has(header)) failures.push(`header de segurança ausente no vercel.json: ${header}`);
  }
}

if (existsSync(path.join(root, '.env.example'))) {
  const example = readFileSync(path.join(root, '.env.example'), 'utf8');
  for (const variable of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY']) {
    if (!example.includes(`${variable}=`)) failures.push(`variável ausente no .env.example: ${variable}`);
  }
  if (/service[_-]?role/i.test(example)) failures.push('.env.example não pode mencionar ou expor service_role');
}

if (failures.length) {
  console.error('Verificação de produção reprovada:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Verificação estática de produção aprovada (runtime, artefatos, secrets e headers).');
