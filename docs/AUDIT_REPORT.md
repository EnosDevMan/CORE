# Auditoria de prontidão — atualizada em 2026-08-23

## Parecer de produção

O código passa pelos gates automatizados locais, mas a promoção ainda é
**condicional**. Permanecem pendências arquiteturais P0/P1 descritas abaixo e
validações que só podem ocorrer no Supabase/Vercel de destino. O procedimento e
os critérios bloqueantes estão em `docs/DEPLOYMENT.md`; `npm run verify` agora é
o gate reproduzível usado também pela CI.

## Escopo

Inspeção de frontend, stores, data service, autenticação, schema, migrations,
RLS, agenda, responsividade, acessibilidade, configuração e testes.

## Achados

| Prioridade | Categoria | Problema e localização | Impacto/risco | Solução |
|---|---|---|---|---|
| P0 em andamento | ARCHITECTURE / HARDCODE | O runtime, onboarding e cadastro administrativo já são universais; agenda, roles e partes da UI ainda usam conceitos `Barber`/`barbershop` como compatibilidade. A marca real e os textos de barbearia foram removidos dos estados globais de loading/erro e dos fluxos públicos compartilhados. | Os fluxos legados restantes ainda limitam a troca completa de nicho. | Migrar agenda, booking e roles incrementalmente para `Professional`, mantendo testes a cada fluxo. |
| P0 resolvido | DATABASE | `bookings.service_id` guardava CSV sem FK. `booking_services` agora normaliza serviços e snapshots; o CSV permanece temporariamente para compatibilidade. | A ponte ainda deve ser removida após migrar RPCs/UI. | Trocar leituras e remover CSV em uma migration futura. |
| P0 resolvido | DATABASE / SECURITY | Conflitos dependiam de cálculos sobre `date`/`time` e duração atual do serviço. | Corridas e mudanças de duração produziam interpretação ambígua. | Intervalos/duração são snapshots e uma exclusion constraint é a barreira definitiva. |
| P1 | ARCHITECTURE | `dataService.loadAllData` carrega várias coleções globais e até todos os bookings permitidos. | Inicialização cresce com a base e aumenta exposição/custo. | Repositórios por feature e queries paginadas por tela/data. |
| P1 | AUTHORIZATION | Roles legadas são `admin/barber/customer`, divergindo de owner/manager/receptionist/professional. | Permissões futuras ficam rígidas. | Migração de roles e matriz de capabilities antes de ampliar equipe. |
| P1 | HARDCODE / THEME | `index.css` e diversos componentes codificam navy/copper/slate. | Tema não é realmente configurável. | Tokens semânticos, adaptador legado e migração gradual dos componentes. |
| P1 resolvido | ONBOARDING | O schema legado criava configuração de barbearia automaticamente e não possuía estado universal. | Banco novo não guiava configuração segura. | `business_profile.onboarding_completed`, bootstrap exclusivo do owner e wizard atômico/idempotente foram implementados. |
| P2 | PERFORMANCE | A landing e dashboards foram separados, mas o loader ainda cria waterfall auth→dados. | Primeiro conteúdo público espera sessão. | Carregar dados públicos em paralelo e privados sob demanda. |
| P2 | ACCESSIBILITY / MOBILE | Há focus/reduced-motion globais, porém componentes extensos precisam auditoria individual de labels, dialogs e touch targets. | Barreiras para teclado/leitor de tela e telas de 360px. | Testes de interação e checklist por componente durante migração. |
| P2 | TECH_DEBT | `src/types.ts` concentra domínios e comentários de compatibilidade. | Agentes alteram limites errados com facilidade. | Tipos por feature, mantendo barrel temporário. |
| P3 | DUPLICATION | Dashboards e formulários repetem shells/estados visuais. | Inconsistência e manutenção duplicada. | Extrair primitives somente ao migrar usos reais. |

## Pontos positivos preservados

TypeScript estrito, lazy loading das telas, RLS habilitado, RPCs de agenda,
paginação explícita, camada única de Supabase, reduced motion, proteção contra
zoom iOS e testes do agendamento já existem e devem ser evoluídos, não descartados.
