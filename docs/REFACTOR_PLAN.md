# Plano de refatoração

## Estado e fases

1. **Concluído:** auditoria, arquitetura alvo, registries de quatro nichos e cinco temas, modelo universal aditivo, CI e documentação-base.
2. **Concluído (P0):** snapshots de intervalo com timezone, serviços normalizados por booking e exclusion constraint contra sobreposição. O CSV permanece apenas como ponte de compatibilidade.
3. **Em andamento (P0/P1):** bootstrap e onboarding concluídos; enum e dados agora migram de forma versionada para owner/professional, enquanto manager/receptionist permanecem negados por padrão. Faltam desenhar e testar as policies RLS específicas dessas duas roles antes de habilitá-las na UI.
4. **Em andamento (P1):** `Professional` e `BusinessConfig` são os tipos canônicos; cadastro, workspace, landing, booking público, agendamentos, bloqueios, disponibilidade, stores e seletores já usam APIs internas neutras. A tradução de `professionalId` para `barber_id` e os nomes físicos legados estão isolados no data access. A view mantém compatibilidade e pets permanece isolado; tabela física e policies de Storage ainda serão migrados.
5. **Em andamento (P1):** runtime de negócio/tema integrado, boundaries do Supabase validados, contraste automatizado, metadados públicos derivados do perfil e primeiras primitives semânticas. HTML, manifest e seed não contêm identidade de cliente; perfis, nichos, temas, timezones e capabilities desconhecidos falham de forma explícita antes de chegar aos componentes. Componentes visuais legados serão convertidos por fluxo.
6. **Em andamento (P1):** wizard e fixtures multi-nicho concluídos; dashboard adapta terminologia, protege todos os módulos opcionais por capability e usa o timezone do perfil ativo. Widgets adicionais e testes end-to-end de navegador permanecem.
7. **Em andamento (P2):** a suíte local não depende mais de credenciais Supabase para testar utilitários puros, configuração técnica falha fechada antes do bootstrap, artefatos locais estão ignorados e os contextos React foram separados dos componentes para manter Fast Refresh confiável. Ainda faltam paginação por tela, acessibilidade automatizada e budgets de bundle.

Cada fase exige `npm run lint`, `npm run typecheck`, `npm run test` e
`npm run build`. Mudanças destrutivas têm migration de dados, verificação e
rollback; produção antiga nunca é alterada automaticamente.

## Critério de saída

Marca, nicho, tema, serviços sugeridos, logo, cores e horários devem mudar por
dados. Os quatro demos devem executar na mesma revisão do Git.
