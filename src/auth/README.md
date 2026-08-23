# Módulo de Autenticação (`src/auth`)

Autenticação real via **Supabase Auth**, com perfis de usuário na tabela
`profiles` (ver `supabase/migrations/0001_initial_schema.sql`).

## Estrutura

```
auth/
├── types/        Contratos (IAuthProvider, AuthUser, AuthSession, etc.)
├── lib/           Cliente Supabase (supabaseClient.ts)
├── services/      Implementação de IAuthProvider (supabaseAuthProvider.ts)
├── store/         Estado de auth (useAuthStore) — sessão, login, logout
├── hooks/         Ponto único de acesso da UI ao estado de auth (useAuth)
├── components/    (vazio) Telas de Login, Cadastro, Recuperação de senha
└── middleware/    (vazio) Guards de rota e checagem de permissões (RBAC)
```

## O que já funciona hoje

- `lib/supabaseClient.ts` inicializa o cliente a partir de
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` (ver `.env.example`).
- `services/supabaseAuthProvider.ts` implementa login, cadastro, logout,
  recuperação/atualização de senha e sessão persistente (refresh token).
- `store/useAuthStore.ts` expõe `currentUser`, `login`, `register`,
  `logout`, e escuta mudanças de sessão em tempo real.
- Ao se cadastrar, o usuário recebe automaticamente um `profile` com
  role `customer` (trigger `handle_new_user` no banco). Promover para
  `admin`/`barber` é manual (painel admin ou SQL direto), por segurança.
- O formulário de login/cadastro/recuperação de senha já existe e está
  conectado — ver `src/components/LoginModal.tsx` (fica fora de
  `auth/components/` por ser compartilhado com o resto da UI, ex: Navbar).
- Upload de foto de barbeiro via Supabase Storage (bucket `avatars`) —
  ver `src/services/storageService.ts` e
  `supabase/migrations/0003_storage_avatars.sql`.

## O que falta implementar (próximos passos)

1. **`middleware/`** — Guards de rota/seção por papel (RBAC): `admin`,
   `barber`, `customer`. Hoje `App.tsx` já faz essa checagem inline; extrair
   para cá só vale a pena se a lógica crescer.

## RBAC (Perfis)

O domínio já define três papéis em `src/types.ts` (`UserRole`) e na coluna
`profiles.role` no banco:

- `admin` — acesso total ao painel administrativo.
- `barber` — acesso à agenda/dashboard do profissional.
- `customer` — acesso à área do cliente.

As policies de RLS em `supabase/migrations/0001_initial_schema.sql` já
aplicam essas regras no nível do banco; `middleware/` deve replicar a
mesma lógica no nível de rota/UI.
