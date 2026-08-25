# Auditoria de prontidão para produção

Atualização: 24 de agosto de 2026.

## Parecer executivo

O fluxo principal do CORE está implementado e recebeu defesa em profundidade no
frontend e no PostgreSQL. A revisão atual ainda precisa passar pelo CI do commit
que será promovido. Como o projeto não foi instalado no Supabase nem na Vercel,
nenhuma análise séria pode declarar a operação como 100% pronta neste momento.

Há duas métricas diferentes:

| Métrica | Situação deste checkpoint | Para chegar a 100% |
|---|---:|---|
| Implementação verificável no repositório | 97% | CI verde no commit final e correção de qualquer regressão encontrada |
| Prontidão real de lançamento | 78% | staging/produção, testes no navegador e domínio reais, operação, jurídico e monitoramento |

A primeira nota mede somente aquilo que código e CI conseguem provar. A segunda
inclui dependências que ainda não existem e não podem ser simuladas como
concluídas. A nota deve ser recalculada após cada evidência do checklist de
deploy.

## Escopo revisado

- React, TypeScript, Zustand, Vite, rotas internas e estados de carregamento;
- autenticação, recuperação de senha, cadastro, onboarding e autorização por role;
- agenda pública, agenda administrativa, reagendamento, cancelamento e status;
- disponibilidade, fusos horários, horários semanais, pausas e bloqueios;
- Supabase/PostgreSQL, RLS, grants, RPCs, triggers, constraints e Storage;
- formulários, limites, erros, acessibilidade, concorrência e responsividade;
- relatórios, histórico, fotos, dados mortos, documentação, CI e artefatos de deploy.

## Problemas críticos corrigidos no repositório

| Área | Correção aplicada |
|---|---|
| Instalação nova | Shell inicial funciona antes de existir `business_profile`; onboarding e reivindicação do primeiro proprietário são atômicos e protegidos por código de uso único. |
| Sessão | Dados privados são removidos na troca de sessão; falha ao restaurar perfil não é mais confundida com visitante anônimo. |
| Autorização | Projeções públicas não expõem vínculo Auth dos profissionais; managers/receptionists permanecem negados até terem policies próprias; alterações sem linha afetada agora falham. |
| Agenda concorrente | Criação e reagendamento passam por RPC, advisory lock, snapshots e exclusion constraint; duas requisições não podem ocupar o mesmo intervalo. |
| Regras do servidor | Preço, duração, telefone, serviços ativos, janela, antecedência, grade, expediente, pausas, bloqueios e profissional ativo são revalidados no banco. |
| Histórico | Valor, duração e intervalo são snapshots imutáveis; alterar ou desativar catálogo não reescreve agendamentos antigos. |
| Status | Fluxo operacional é `aguardando → confirmado → em atendimento → concluído`; profissional não pode pular etapas, registrar ausência antecipada ou adulterar cliente, serviço, preço, notas e horário diretamente. |
| Cliente | Cliente não pode editar observações, desfazer presença, cancelar finalizados ou reagendar sem revalidar conflito/prazo. |
| Pagamento | Taxa zero confirma automaticamente; taxa positiva exige PIX; valor e regra de cancelamento aparecem antes da reserva. |
| Configuração | Horários semanais, taxa, PIX, janela, intervalo, antecedência e cancelamento têm validação no navegador e no banco. |
| Profissionais/serviços | Exclusão destrutiva virou desativação, preservando histórico e FKs. Vínculos conta/agenda são sincronizados na mesma transação. |
| Storage | MIME e tamanho são limitados no bucket; uploads usam nomes únicos; falhas compensam rascunhos; remoção respeita identidade e ordem segura banco→arquivo. |
| Galeria | Reordenação é atômica; falha de banco não deixa foto pública quebrada. |
| Privacidade | Versão do aceite foi centralizada; texto e comportamento do WhatsApp/taxa foram alinhados. |
| UX/acessibilidade | Dialogs têm foco, Escape, retorno de foco, labels e bloqueio durante gravações; submissões duplicadas críticas foram impedidas e os termos abrem sem perder a reserva em preenchimento. |
| Código morto | Fluxo promocional e operações CRUD obsoletas foram removidos. O grafo estático só deixa fora do entrypoint helpers exclusivos dos testes. |
| Qualidade | CI executa lint, tipos, testes, build, orçamento de bundle, auditoria de dependências de produção, inspeção de secrets/headers e testes SQL em PostgreSQL 17. |

## Pendências que ainda bloqueiam a nota de produção

| Prioridade | Pendência | Evidência de conclusão |
|---|---|---|
| Bloqueador | Não existe ambiente Supabase/Vercel de staging ou produção. | Schema aplicado em Supabase vazio, Vercel ligada ao commit aprovado e variáveis separadas por ambiente. |
| Bloqueador | A política é um texto técnico e ainda precisa de decisão de retenção e revisão jurídica/LGPD. | Texto aprovado, contato real e prazos de retenção documentados antes de abrir cadastro. |
| Bloqueador | Não houve smoke test no domínio e navegador reais. | Matriz anônimo/customer/professional/owner em mobile e desktop, incluindo Auth redirect, Storage e recuperação de senha. |
| Alta | Não há provedor automático de WhatsApp/e-mail/SMS. O produto oferece link manual confiável. | Integrar provedor aprovado ou declarar formalmente que comunicação é manual. |
| Alta | Rate limit por telefone reduz abuso, mas não substitui proteção distribuída contra bots. | CAPTCHA/Turnstile, WAF/rate limit de borda ou decisão de risco registrada após teste. |
| Alta | Backup, restauração, alertas, logs e responsável por incidentes ainda não foram configurados. | Restauração ensaiada, alertas ativos, runbook e rollback com responsáveis. |
| Média | Não há suíte E2E de navegador versionada. | Playwright/Cypress para os fluxos críticos ou evidência manual reproduzível em staging. |

## Dívida técnica não bloqueante para o primeiro lançamento

- `loadAllData` ainda pagina todas as reservas permitidas na inicialização; mover
  consultas para cada tela antes de volume elevado.
- `service_id` CSV continua como ponte; `booking_services` já preserva snapshots,
  mas o detalhamento financeiro por serviço ainda divide combos igualmente.
- nomes físicos `barbers`/`barber_id` permanecem somente na fronteira SQL/Storage.
- manager e receptionist existem no enum, mas ficam intencionalmente sem acesso
  até uma matriz de permissões ser desenhada e testada.
- o sistema universal ainda possui textos visuais específicos de salão/barbearia;
  isso não impede uma barbearia, mas limita outros nichos.

## Critério objetivo de 100%

1. CI verde no SHA exato que será implantado.
2. Supabase novo criado e `supabase/schema.sql` aplicado uma única vez.
3. Staging Vercel ligada ao Supabase de staging, sem usar dados de produção.
4. Owner preparado, e-mail confirmado e onboarding completo.
5. Smoke tests de cadastro, login, reset, reserva, colisão, PIX, status,
   reagendamento, cancelamento, bloqueio e upload em mobile/desktop.
6. Headers e CSP conferidos na resposta HTTP do domínio final.
7. Backup restaurado em teste; monitoramento, alerta e rollback ensaiados.
8. Termos, retenção, contato e operação de notificações aprovados.
9. Proteção anti-bot decidida com base em teste de abuso.
10. Checklist e evidências anexados ao release; só então a prontidão real é 100%.
