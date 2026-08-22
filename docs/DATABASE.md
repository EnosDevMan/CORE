# Banco de dados

O estado final para projetos novos fica concentrado em `supabase/schema.sql`. As migrations versionadas existem exclusivamente para atualizar projetos antigos. Cada
empresa usa um banco independente. `business_profile`, `booking_settings` e
`feature_settings` separam identidade, regras de agenda e capabilities.

`202608220006_canonical_application_roles.sql` renomeia valores do enum sem
trocar seus OIDs (`admin → owner`, `barber → professional`) e adiciona manager e
receptionist com negação por padrão. Constantes armazenadas em funções, triggers
e policies preservam o comportamento durante o deploy; projetos novos já
recebem diretamente o enum canônico pelo schema consolidado.

Migrations são ordenadas e secrets nunca entram em seed. O seed contém apenas
dados fictícios. Agendamentos agora registram `starts_at`, `ends_at` e duração
histórica; uma exclusion constraint GiST impede intervalos ativos sobrepostos
para o mesmo profissional, inclusive entre transações concorrentes.

`booking_services` normaliza a seleção e preserva nome, duração e preço no
momento do agendamento. O campo CSV legado permanece sincronizado durante a
migração das telas/RPCs. Antes do deploy, corrija referências inválidas e
sobreposições existentes: a migration falha deliberadamente em vez de ocultar
dados inconsistentes. O teste SQL descartável está em
`supabase/tests/booking_overlap.sql`.


## Profissionais e pets

A API neutra `professionals` é uma view com `security_invoker`, portanto preserva
a RLS da tabela-base durante a transição. Pets, notas clínicas/operacionais e o
vínculo opcional com agendamentos vivem em tabelas próprias. Policies limitam
tutores aos próprios animais e equipe às relações autorizadas; escritas exigem
a capability `pets`.

Enquanto a tabela física ainda usa `barber_id`, somente `dataService` converte
esse campo para `professionalId`. Essa fronteira impede que o nome legado volte
a vazar para tipos, componentes, stores ou regras de disponibilidade e permite
que a futura migration física seja feita sem alterar os contratos da UI.


## Onboarding atômico

A RPC final recebe identidade, capabilities, horários, serviços, equipe e regras
de agenda na mesma transação. Serviços/profissionais iniciais são idempotentes
por nome e somente entradas válidas são criadas. A assinatura anterior da RPC é
removida para não manter um caminho incompleto de configuração.
