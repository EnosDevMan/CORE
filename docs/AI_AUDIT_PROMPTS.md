# Prompts de auditoria para outra IA

Use cada prompt em uma sessão limpa, forneça o repositório inteiro e exija
evidência por arquivo/linha e teste reproduzível. A IA não deve alterar código
antes de registrar o diagnóstico.

## Autorização e RLS

> Audite todo o Supabase deste repositório como um atacante anônimo, customer,
> professional e owner. Para cada tabela, view, função RPC, trigger, policy,
> grant e bucket, tente leitura/escrita horizontal, elevação de privilégio,
> enumeração de IDs, bypass por SECURITY DEFINER e atualização sem linha afetada.
> Entregue primeiro uma matriz role × ação; depois crie testes SQL que falhem no
> estado vulnerável e só então proponha a correção mínima.

## Concorrência da agenda

> Modele requisições simultâneas de criação, reagendamento, cancelamento e
> bloqueio para o mesmo profissional. Verifique advisory locks, ordem de
> triggers, exclusion constraint, timezone, troca de duração/preço e rollback.
> Não aceite como garantia uma checagem feita apenas no React. Demonstre cada
> corrida com duas transações PostgreSQL e teste o resultado final.

## Fluxo completo no navegador

> Suba o projeto com um Supabase descartável e teste como anônimo, customer,
> professional e owner em 360×800 e desktop. Cubra cadastro com e sem confirmação
> de e-mail, login, reset, onboarding, reserva com taxa zero/positiva, conflito,
> PIX, status, reagendamento, cancelamento, bloqueio, upload e logout entre abas.
> Registre console, rede, acessibilidade por teclado e screenshots de falhas.

## Integridade e código morto

> Construa o grafo de imports e usos de tipos, stores, RPCs, colunas, enums e
> migrations. Liste módulos, props, estados, queries e branches inalcançáveis;
> diferencie helper de teste de código morto. Para cada remoção, prove que lint,
> typecheck, testes, build e busca de referências continuam verdes.

## Performance e escala

> Gere 10 mil clientes, 100 mil agendamentos, 100 profissionais e 500 serviços.
> Meça queries, payload inicial, renders, memória, bundle e tempo das telas.
> Use EXPLAIN (ANALYZE, BUFFERS) no PostgreSQL e profiler no React. Proponha
> paginação/índices por evidência, sem otimizações especulativas.

## Operação e recuperação

> Trate o sistema como um serviço real: simule indisponibilidade do Supabase,
> token expirado, upload parcial, webhook duplicado, deploy ruim e perda de
> banco. Produza SLOs, alertas, política de backup, teste de restauração,
> runbook, rollback e lista de dados que nunca podem aparecer em logs.

## Cadeia de dependências

> Audite package-lock, GitHub Actions e scripts de build para dependências
> vulneráveis, pacotes abandonados, permissões excessivas, secrets no bundle,
> actions sem pin e risco de supply chain. Confirme achados em fontes oficiais,
> proponha versões compatíveis e rode a suíte completa após cada atualização.
