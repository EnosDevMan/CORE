# CORE Universal de Agendamento

Plataforma mobile-first de agenda e gestão para barbearias, salões de beleza,
nail studios e pet shops. Um único código é implantado em projetos Vercel e
Supabase independentes; marca, nicho, tema e dados pertencem à configuração de
cada instalação, nunca a branches por cliente.

## Stack e requisitos

- React 19, TypeScript estrito, Vite e Zustand;
- Supabase (Postgres, Auth, RLS e Storage);
- Node.js 22 e npm.

## Desenvolvimento

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Validação: `npm run lint`, `npm run typecheck`, `npm run test` e
`npm run build`. Esses comandos funcionam em Linux/Termux com Node 22; Docker
ou IDE desktop não são requisitos.

## Banco e deploy

Em um Supabase vazio, aplique somente `supabase/schema.sql`, que representa o
estado final consolidado. `supabase/migrations` é reservado para atualizar
instalações que já existiam; não repita as migrations após o schema. Nunca versione a `.env.local`.
Consulte [nova instalação](docs/NEW_BUSINESS_SETUP.md),
[deploy](docs/DEPLOYMENT.md) e [arquitetura](docs/ARCHITECTURE.md).

## Documentação

O índice completo e o estado das fases estão em [`docs/README.md`](docs/README.md).
