import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const failures = [];

const requireFile = (file) => {
  if (!existsSync(path.join(root, file))) failures.push(`arquivo obrigatório ausente: ${file}`);
};

for (const file of [
  'dist/index.html',
  'supabase/schema.sql',
  'supabase/tests/standalone_bootstrap.sql',
  'supabase/tests/booking_overlap.sql',
  'supabase/tests/booking_security.sql',
  'vercel.json',
  '.env.example',
]) {
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

const assetsDirectory = path.join(root, 'dist', 'assets');
if (existsSync(assetsDirectory)) {
  for (const asset of readdirSync(assetsDirectory)) {
    if (!asset.endsWith('.js')) continue;
    const content = readFileSync(path.join(assetsDirectory, asset), 'utf8');

    if (/sb_secret_[A-Za-z0-9_-]{20,}/.test(content)) {
      failures.push(`chave secreta do Supabase encontrada no bundle público: ${asset}`);
    }

    for (const candidate of content.matchAll(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
      try {
        const payload = JSON.parse(Buffer.from(candidate[0].split('.')[1], 'base64url').toString('utf8'));
        if (payload.role === 'service_role' || payload.role === 'supabase_admin') {
          failures.push(`JWT administrativo encontrado no bundle público: ${asset}`);
        }
      } catch {
        // Unrelated minified strings are not JWT credentials.
      }
    }
  }
}

if (failures.length) {
  console.error('Verificação de produção reprovada:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Verificação estática de produção aprovada (runtime, banco, artefatos, secrets, bundle e headers).');
