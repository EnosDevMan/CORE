# Deployment

Um GitHub alimenta vários projetos Vercel. Cada Vercel possui URL/env próprios e
aponta para exatamente um Supabase próprio (banco, Auth e Storage). Use a mesma
branch estável para receber atualizações globais.

Antes de promover: backup, migration em staging, quatro checks de qualidade,
smoke test anônimo/autenticado e plano de rollback. Nunca conecte uma preview ao
banco de produção nem compartilhe chaves entre clientes.

## Gate de promoção

Execute `npm ci && npm run verify` no commit exato que será promovido. O comando
único executa lint, tipos, testes, build, orçamento de bundle e uma inspeção
estática dos artefatos, versão do Node, arquivos de ambiente rastreados e headers
da Vercel. Ele reduz erro humano, mas não substitui os passos operacionais abaixo.

Uma versão só está pronta para produção depois de registrar evidência de:

- migration aplicada e testada em staging, seguida de backup restaurável;
- URLs de redirect do Supabase Auth limitadas aos domínios reais;
- smoke tests como anônimo, customer, professional e owner em viewport móvel;
- criação, remarcação, cancelamento e conflito simultâneo de agendamentos;
- upload/leitura no Storage e entrega de recuperação de senha;
- headers conferidos na URL implantada (não apenas no arquivo `vercel.json`);
- monitoramento de erros, responsável pelo incidente e rollback ensaiado;
- aceite de privacidade/LGPD e política de retenção definidos pelo operador.

Os itens dependentes de Supabase, Vercel, domínio e operação não podem ser
certificados pelo repositório ou pela CI. Devem bloquear a promoção enquanto
não houver evidência no ambiente de destino.

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
