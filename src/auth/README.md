# Módulo de Autenticação (`src/auth`)

Autenticação real via **Supabase Auth**, com perfis de aplicação em
`public.profiles`. A identidade é autenticada pelo Supabase; autorização é
aplicada por RLS, triggers e RPCs no PostgreSQL. Guards de UI são apenas UX e
nunca substituem a fronteira do banco.

## Estrutura

```
auth/
├── types/        Contratos de autenticação
├── lib/          Cliente Supabase
├── services/     Implementação do provider Supabase
├── store/        Sessão e estado de autenticação
├── hooks/        Acesso da UI ao estado de auth
└── authorization.ts  Contrato central de roles/compatibilidade
```

## Fluxos atuais

- `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` inicializam o cliente;
  segredos e `service_role` nunca são enviados ao navegador.
- Login, cadastro, logout, recuperação e atualização de senha usam Supabase
  Auth com sessão persistente.
- Todo cadastro público nasce como `customer` pelo trigger `handle_new_user`.
- Em instalação nova, criar a primeira conta **não** promove automaticamente o
  usuário. O operador prepara um código de instalação no SQL Editor; depois de
  confirmar o mesmo e-mail, o onboarding chama
  `complete_business_onboarding(...)`. Essa RPC valida e consome o código,
  reivindica o primeiro `owner` e grava a configuração no mesmo commit.
- `claim_first_owner()` é detalhe interno do onboarding e não possui grant de
  execução para papéis da Data API.
- O proprietário pode vincular contas a cadastros de profissionais pelos
  fluxos administrativos protegidos do banco.
- Recuperação de senha usa o modo de recovery do Supabase e não confia apenas
  em marcadores locais do navegador.

## RBAC

Os papéis canônicos persistidos são:

- `owner` — proprietário da instalação e principal administrativo;
- `professional` — profissional vinculado à própria agenda;
- `customer` — cliente final;
- `manager` e `receptionist` — reservados no schema, mas permanecem negados em
  áreas sensíveis até existirem policies explícitas para suas permissões.

`admin` e `barber` são aceitos somente na boundary de compatibilidade do
frontend para instalações antigas durante a migração de roles; não devem ser
usados em código novo como autoridade canônica.

`src/auth/authorization.ts` centraliza essa compatibilidade. Qualquer mudança de
permissão deve ser implementada primeiro no banco (RLS/RPC/trigger), coberta por
testes PostgreSQL e só então refletida na navegação ou nos guards da UI.

## Segurança operacional

- O provedor de e-mail padrão do Supabase é adequado apenas para desenvolvimento;
  produção deve usar SMTP próprio.
- Turnstile pode ser habilitado para login/cadastro/recuperação.
- Redirects de Auth devem permanecer restritos aos domínios esperados.
- Nunca registre tokens, setup codes, chaves PIX ou segredos de infraestrutura.

Veja também `docs/SECURITY.md`, `docs/ARCHITECTURE.md` e os testes em
`supabase/tests/`.
