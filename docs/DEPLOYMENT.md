# Deployment e checklist de produção

Um GitHub alimenta vários projetos Vercel. Cada Vercel possui URL/env próprios e
aponta para exatamente um Supabase próprio (banco, Auth e Storage). Use a mesma
branch estável para receber atualizações globais.

Antes de promover: backup, migration em staging, quatro checks de qualidade,
smoke test anônimo/autenticado e plano de rollback. Nunca conecte uma preview ao
banco de produção nem compartilhe chaves entre clientes.

## 1. Provisionar Supabase

1. Crie um projeto exclusivo para a instalação e selecione uma região adequada.
2. No SQL Editor, execute `supabase/schema.sql` inteiro uma única vez. Não
   execute as migrations históricas depois do schema consolidado.
3. O schema já inclui `GRANT` explícito para cada tabela consumida pelo
   navegador. Projetos novos do Supabase não concedem mais essas permissões
   automaticamente; não substitua essa matriz por grants amplos.
4. Ainda no SQL Editor, execute:

   ```sql
   select public.prepare_installation_owner('proprietario@exemplo.com');
   ```

   Guarde o código retornado fora do GitHub e de variáveis públicas.

## 2. Configurar autenticação e e-mail

No Supabase Auth:

- Em URL Configuration, defina Site URL como a URL HTTPS real da instalação e
  permita somente os redirects exatos de produção/staging necessários.
- Mantenha confirmação de e-mail habilitada.
- Configure senha mínima de **8 caracteres**; ative proteção contra senhas
  vazadas quando o plano disponibilizar essa opção.
- Em SMTP Settings, ative um provedor SMTP próprio com host, porta, usuário,
  senha, nome do remetente e endereço de envio válidos.
- Autentique o domínio do remetente com SPF/DKIM e, quando aplicável, DMARC;
  ajuste os limites de envio e teste confirmação de cadastro e recuperação.

**SMTP próprio é bloqueador de lançamento público.** O remetente embutido do
Supabase entrega apenas para membros autorizados da equipe e possui um limite
muito baixo. Cadastro e recuperação de senha de clientes reais não funcionam
sem essa configuração. Referência: [documentação oficial de SMTP do Supabase](https://supabase.com/docs/guides/auth/auth-smtp).

## 3. Configurar Vercel

Importe este repositório e use:

| Configuração | Valor |
|---|---|
| Framework Preset | Vite |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js | 22.x |

Cadastre as variáveis indicadas abaixo separadamente para Production, Preview
e Development. Cada ambiente deve apontar para o Supabase correspondente;
alterações de variáveis exigem um novo deploy.

## 4. Ativar proteção contra bots

O frontend já suporta Cloudflare Turnstile no login, cadastro e recuperação:

1. Crie um widget Turnstile restrito aos domínios reais da instalação.
2. Configure a **chave secreta** somente no painel Supabase Auth, na proteção
   CAPTCHA. Nunca adicione esse segredo à Vercel com prefixo `VITE_`.
3. Configure a **chave pública** do widget em `VITE_TURNSTILE_SITE_KEY` na
   Vercel e faça um novo deploy.
4. Ative CAPTCHA no Supabase somente quando o deploy com essa variável já
   estiver disponível; caso contrário, login/cadastro/recuperação falharão.
5. Teste os três fluxos. O Supabase valida o token no servidor; a CSP do
   `vercel.json` já permite somente script/frame oficiais da Cloudflare.

Sem a variável pública, o widget permanece desativado e o Auth também deve
permanecer sem CAPTCHA obrigatório.

## Gate de promoção

Execute `npm ci && npm run verify` no commit exato que será promovido. O comando
único executa lint, tipos, testes, build, orçamento de bundle e uma inspeção
estática dos artefatos, versão do Node, arquivos de ambiente rastreados e headers
da Vercel. Um segundo job da CI aplica o schema consolidado em PostgreSQL 17 e
executa testes reais de autorização, isolamento e integridade da agenda. Esses
gates reduzem erro humano, mas não substituem os passos operacionais abaixo.

Uma versão só está pronta para produção depois de registrar evidência de:

- migration aplicada e testada em staging, seguida de backup restaurável;
- proprietário previamente preparado pelo SQL Editor com e-mail confirmado e
  código de instalação de uso único;
- URLs de redirect do Supabase Auth limitadas aos domínios reais;
- SMTP próprio autenticado, envio para endereço externo e senha mínima de oito;
- Turnstile configurado nos dois lados ou justificativa de risco registrada;
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
VITE_TURNSTILE_SITE_KEY=chave_publica_do_widget_opcional
```

O bootstrap valida URL, HTTPS e placeholders antes de carregar a aplicação.
`VITE_SUPABASE_ANON_KEY` permanece apenas como fallback para instalações
antigas e somente aceita JWT com role `anon`; projetos novos usam a chave
publicável. `VITE_TURNSTILE_SITE_KEY` é opcional e contém somente a chave
pública do widget. Nunca exponha `service_role`, chaves `sb_secret_`, a chave
secreta do Turnstile, credenciais SMTP ou o código de instalação em variáveis
prefixadas por `VITE_`.

## Orçamento do frontend

Depois do build, `npm run check:bundle` impede regressões acima de 230 kB por
chunk JavaScript, 710 kB de JavaScript total ou 100 kB de CSS total. O aumento
de 700 para 710 kB acompanha os fluxos versionados de contas e anti-bot da 1.0,
sem aumentar o teto do maior chunk. A CI roda
esse gate em todo pull request. Mudanças conscientes podem ajustar os limites
por `BUNDLE_MAX_JS_KB`, `BUNDLE_TOTAL_JS_KB` e `BUNDLE_TOTAL_CSS_KB`, mas a
justificativa e a medição devem acompanhar a alteração.
