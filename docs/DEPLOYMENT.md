# Deployment

Um GitHub alimenta vários projetos Vercel. Cada Vercel possui URL/env próprios e
aponta para exatamente um Supabase próprio (banco, Auth e Storage). Use a mesma
branch estável para receber atualizações globais.

Antes de promover: backup, migration em staging, quatro checks de qualidade,
smoke test anônimo/autenticado e plano de rollback. Nunca conecte uma preview ao
banco de produção nem compartilhe chaves entre clientes.

## Variáveis técnicas

Configure separadamente nos ambientes Production, Preview e Development:

```env
VITE_SUPABASE_URL=https://PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

O bootstrap valida URL, HTTPS e placeholders antes de carregar a aplicação.
`VITE_SUPABASE_ANON_KEY` permanece apenas como fallback para instalações
antigas; projetos novos usam a chave publicável. Nunca exponha `service_role`
ou secrets administrativos em variáveis prefixadas por `VITE_`.
