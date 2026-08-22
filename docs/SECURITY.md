# Segurança

- Supabase Auth autentica; RLS e RPCs autorizam.
- UI guards não são fronteira de segurança.
- Tabelas públicas expõem apenas catálogo/configuração necessária.
- Escritas administrativas verificam role no banco.
- Guest booking usa RPC e não INSERT público direto.
- Storage restringe escrita por bucket e identidade.

Antes de produção: revisar grants após cada migration, testar owner/professional/
customer/anônimo, confirmar redirects permitidos, rotação de chaves e políticas
de backup. Nunca registrar tokens, PIX ou dados sensíveis em logs.

## Autorização da aplicação

O frontend centraliza compatibilidade de roles em `src/auth/authorization.ts`.
`owner` e `professional` são os nomes canônicos no schema consolidado;
`admin` e `barber` continuam aceitos temporariamente no frontend para clientes
que ainda não aplicaram a migration `202608220006_canonical_application_roles`.
Roles (`manager` e `receptionist`) permanecem negadas por padrão nas
áreas sensíveis até existirem policies RLS específicas — exibir uma tela nunca
é suficiente para conceder acesso aos dados.
Respostas de `profiles` também passam por `parseUserRole`; valores desconhecidos
falham fechados na boundary de autenticação, em vez de receberem um fallback de
permissão ou serem propagados pela interface.

## Bootstrap do proprietário

`claim_first_owner` usa advisory lock e uma tabela interna sem policies de API.
Apenas uma instalação sem owner/admin aceita a reivindicação. O registro interno
faz `auth_role()` reconhecer o proprietário antes da promoção do perfil, sem
desabilitar a proteção contra autoelevação. O onboarding completo exige owner e
é executado atomicamente por RPC.
