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
  'supabase/tests/data_api_grants.sql',
  'supabase/tests/branding_storage_security.sql',
  'supabase/migrations/20260826193609_branding_logo_storage.sql',
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
  const configuredHeaders = (config.headers ?? []).flatMap((rule) => rule.headers ?? []);
  const headers = new Set(configuredHeaders.map((header) => header.key.toLowerCase()));
  for (const header of ['content-security-policy', 'x-content-type-options', 'x-frame-options', 'referrer-policy', 'permissions-policy']) {
    if (!headers.has(header)) failures.push(`header de segurança ausente no vercel.json: ${header}`);
  }

  const csp = configuredHeaders.find((header) => header.key.toLowerCase() === 'content-security-policy')?.value ?? '';
  for (const directive of ['script-src', 'frame-src']) {
    const value = csp.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${directive} `));
    if (!value?.includes('https://challenges.cloudflare.com')) {
      failures.push(`CSP incompatível com o Turnstile em ${directive}`);
    }
  }

  const imageSources = csp.split(';').map((part) => part.trim()).find((part) => part.startsWith('img-src '));
  if (!imageSources?.split(/\s+/).includes('blob:')) {
    failures.push('CSP incompatível com a prévia local do editor de logo em img-src');
  }
}

if (existsSync(path.join(root, '.env.example'))) {
  const example = readFileSync(path.join(root, '.env.example'), 'utf8');
  for (const variable of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_TURNSTILE_SITE_KEY']) {
    if (!example.includes(`${variable}=`)) failures.push(`variável ausente no .env.example: ${variable}`);
  }
  if (/service[_-]?role/i.test(example)) failures.push('.env.example não pode mencionar ou expor service_role');
}

if (existsSync(path.join(root, 'supabase/schema.sql'))) {
  const schema = readFileSync(path.join(root, 'supabase/schema.sql'), 'utf8');
  for (const surface of [
    'grant select on table public.booking_services to authenticated',
    'grant select (id) on table public.barbers to authenticated',
    'public.installation_bootstrap',
  ]) {
    if (!schema.includes(surface)) failures.push(`fronteira de acesso ausente no schema: ${surface}`);
  }
}

if (existsSync(path.join(root, 'supabase/tests/standalone_bootstrap.sql'))) {
  const bootstrap = readFileSync(path.join(root, 'supabase/tests/standalone_bootstrap.sql'), 'utf8');
  if (/alter\s+default\s+privileges[\s\S]{0,120}grant\s+all\s+on\s+tables/i.test(bootstrap)) {
    failures.push('bootstrap de testes restaura grants obsoletos e mascara instalações Supabase novas');
  }
}

const manifest = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const dependency of Object.keys(manifest.dependencies ?? {})) {
  if (Object.hasOwn(manifest.devDependencies ?? {}, dependency)) {
    failures.push(`dependência duplicada entre produção e desenvolvimento: ${dependency}`);
  }
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
