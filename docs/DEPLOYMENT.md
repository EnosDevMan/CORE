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

## Orçamento do frontend

Depois do build, `npm run check:bundle` impede regressões acima de 230 kB por
chunk JavaScript, 700 kB de JavaScript total ou 100 kB de CSS total. A CI roda
esse gate em todo pull request. Mudanças conscientes podem ajustar os limites
por `BUNDLE_MAX_JS_KB`, `BUNDLE_TOTAL_JS_KB` e `BUNDLE_TOTAL_CSS_KB`, mas a
justificativa e a medição devem acompanhar a alteração.

## Headers e cache

`vercel.json` aplica CSP, HSTS, bloqueio de frames, isolamento de contexto e
política de referência em todas as respostas. Somente arquivos versionados por
hash em `/assets/` recebem cache imutável de um ano; HTML e configurações não
recebem esse cache, evitando manter uma revisão antiga depois do deploy. A suíte
automatizada falha se os headers obrigatórios forem removidos.
