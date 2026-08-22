# Arquitetura

## Limites

`core/business` resolve a identidade e capabilities da instalação;
`niches` contém somente defaults e terminologia; `themes` contém somente
apresentação; `features` contém domínios operacionais; Supabase é a fonte dos
dados. `BusinessProvider` oferece perfil, nicho, tema e capabilities sem novas
consultas por página.

Dados vindos do Supabase não são promovidos a tipos TypeScript somente por
cast. `core/business/runtimeMapper.ts` valida campos obrigatórios, IDs de
nicho/tema, timezone IANA e capabilities antes de montar o contexto. Valores
desconhecidos interrompem a inicialização com erro recuperável, em vez de
propagar estado inválido pela interface.

Uma instalação corresponde a um Vercel e um Supabase. Não há `tenant_id` nem
branch por cliente. Variáveis de ambiente são exclusivamente técnicas.

## Dependências permitidas

Features podem depender do Core e de primitives. O Core não depende de uma
feature opcional. Componentes não decidem nichos com condicionais: consultam o
registro/contexto. Pets permanece uma capability opcional.

## Agenda

Serviço, profissional, cliente, duração, disponibilidade, bloqueio, exceção e
timezone pertencem ao motor compartilhado. Escritas passam por RPC transacional;
triggers no banco são a última barreira contra conflitos. A migração futura de
`date`/`time` para um intervalo `tstzrange` está descrita no plano.

## Módulos verticais

`Professional` é a entidade compartilhada; nomenclatura vem do preset. A view
`professionals` mantém compatibilidade enquanto a tabela física legada é
migrada. `features/pets` e suas tabelas só aceitam escrita quando a capability
`pets` está habilitada; nenhum fluxo do Core depende desse módulo.

O workspace operacional já usa a rota interna `professional`, o shell
`ProfessionalDashboard` e a feature `professional-dashboard`. Nomes como
`barber_id`, `barbers` e `protect_barber_updates` aparecem somente nas bordas de
persistência que ainda precisam de migration de banco.

Os contratos de aplicação `Booking`, `ScheduleBlock` e `AvailabilityInput`
usam exclusivamente `professionalId`. A tradução temporária para
`barber_id` acontece em `services/dataService.ts`; componentes, stores e o
motor de disponibilidade não conhecem mais o identificador físico legado.

A coleção canônica em memória também se chama `professionals`. Operações de
cadastro usam `addProfessional`, `updateProfessional` e `deleteProfessional`,
e a configuração compartilhada usa `BusinessConfig`. Aliases antigos não são
mais exportados pelo Core; somente nomes SQL e caminhos de Storage aguardando
migration permanecem na fronteira externa.

Metadados públicos também são configurados em runtime. O HTML, manifest e seed
versionados usam somente textos genéricos; `BusinessProvider` publica título,
descrição, URL canônica, Open Graph, Twitter Card e cor do tema a partir do
perfil ativo, sem gerar builds ou branches específicos por cliente.

O dashboard consome o preset resolvido, nunca compara IDs de nicho. Navegação
opcional consulta `hasCapability`: por isso o cadastro de pets não aparece nem
é carregado nas instalações sem essa feature.

A mesma regra vale para agenda online, clientes, relatórios, serviços e equipe:
`features/admin/navigation.ts` é a fonte única da navegação administrativa e
remove módulos desabilitados antes de qualquer rota interna ser renderizada.
