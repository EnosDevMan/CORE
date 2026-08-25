# Plano de refatoração e promoção

Atualização: 25 de agosto de 2026.

## Estado das fases

| Fase | Estado | Resultado/saída |
|---|---|---|
| 1. Auditoria e baseline | Concluída | Arquitetura, CI, documentação e riscos mapeados. |
| 2. Agenda e concorrência | Concluída | RPCs, snapshots, tabela normalizada, locks e constraint GiST. |
| 3. Autenticação, contas e primeiro owner | Concluída no código | Cadastro, senha mínima, CAPTCHA configurável, bootstrap, onboarding, promoção e exclusão segura. |
| 4. RLS, grants e exposição pública | Concluída para roles habilitadas | Grants explícitos compatíveis com Supabase novo; owner/customer/professional/anônimo testados; roles futuras negadas. |
| 5. Integridade de dados | Concluída | Validações, FKs, triggers, estado histórico e desativação segura. |
| 6. UX crítica e acessibilidade | Concluída para fluxos principais | Formulários, dialogs, erros, loading, cobrança e ações duplicadas. |
| 7. Storage e galeria | Concluída | Limites de bucket, caminhos por identidade, compensação e ordem atômica. |
| 8. Limpeza, relatórios e documentação | Concluída no código | Snapshots financeiros corretos, dependência duplicada removida e checklist operacional atualizado. |
| 9. Staging e operação | Não iniciada | Depende da criação autorizada de Supabase/Vercel e decisões do operador. |

## Próxima sequência operacional obrigatória

1. Criar um Supabase de staging e aplicar apenas o schema consolidado.
2. Criar Vercel de staging, configurar variáveis, redirects, SMTP e Auth reais.
3. Configurar Turnstile nos dois lados e executar os smoke tests de `docs/DEPLOYMENT.md`.
4. Decidir jurídico, retenção, notificação, backup e observabilidade.
5. Repetir o release em produção com backup, aprovação e rollback.

## Evolução após o primeiro lançamento

- carregar reservas e clientes por tela/período, com paginação server-side;
- adicionar E2E no navegador e testes automatizados de acessibilidade;
- integrar notificações duráveis com idempotência, retry e auditoria de entrega;
- migrar os nomes físicos legados sem quebrar o contrato `professionalId`;
- habilitar manager/receptionist apenas após RLS e testes por ação;
- concluir tokens semânticos e terminologia para todos os nichos.

Cada fase só muda para “concluída” quando houver evidência reproduzível. Um
comentário, mock ou tela visível não substitui teste de autorização no banco.
