# Plano de refatoração e promoção

Atualização: 24 de agosto de 2026.

## Estado das fases

| Fase | Estado | Resultado/saída |
|---|---|---|
| 1. Auditoria e baseline | Concluída | Arquitetura, CI, documentação e riscos mapeados. |
| 2. Agenda e concorrência | Concluída | RPCs, snapshots, tabela normalizada, locks e constraint GiST. |
| 3. Autenticação e primeiro owner | Concluída | Cadastro seguro, aceite, recuperação, bootstrap e onboarding atômico. |
| 4. RLS e exposição pública | Concluída para roles habilitadas | Owner/customer/professional/anônimo testados; roles futuras negadas. |
| 5. Integridade de dados | Concluída | Validações, FKs, triggers, estado histórico e desativação segura. |
| 6. UX crítica e acessibilidade | Concluída para fluxos principais | Formulários, dialogs, erros, loading, cobrança e ações duplicadas. |
| 7. Storage e galeria | Concluída | Limites de bucket, caminhos por identidade, compensação e ordem atômica. |
| 8. Limpeza e documentação | Em validação | Código morto removido; relatórios atualizados; depende do CI final. |
| 9. Staging e operação | Não iniciada | Depende da criação autorizada de Supabase/Vercel e decisões do operador. |

## Próxima sequência obrigatória

1. Publicar o branch de auditoria e aguardar os jobs `quality` e `database`.
2. Corrigir qualquer falha sem desabilitar lint, teste, constraint ou policy.
3. Fazer merge somente com o SHA esperado e checks verdes.
4. Criar um Supabase de staging e aplicar apenas o schema consolidado.
5. Criar Vercel de staging, configurar variáveis e redirects reais do Auth.
6. Executar a matriz de smoke tests de `docs/DEPLOYMENT.md`.
7. Decidir jurídico, retenção, notificação, anti-bot, backup e observabilidade.
8. Repetir o release em produção com backup, aprovação e rollback.

## Evolução após o primeiro lançamento

- carregar reservas e clientes por tela/período, com paginação server-side;
- consumir `booking_services` nos relatórios para atribuição exata de combos;
- adicionar E2E no navegador e testes automatizados de acessibilidade;
- integrar notificações duráveis com idempotência, retry e auditoria de entrega;
- migrar os nomes físicos legados sem quebrar o contrato `professionalId`;
- habilitar manager/receptionist apenas após RLS e testes por ação;
- concluir tokens semânticos e terminologia para todos os nichos.

Cada fase só muda para “concluída” quando houver evidência reproduzível. Um
comentário, mock ou tela visível não substitui teste de autorização no banco.
