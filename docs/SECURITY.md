# Segurança

- Supabase Auth autentica; RLS e RPCs autorizam.
- Grants explícitos e mínimos controlam quais tabelas a Data API consegue
  alcançar; o teste SQL reproduz projetos novos sem permissões automáticas.
- UI guards não são fronteira de segurança.
- Tabelas públicas expõem apenas catálogo/configuração necessária. Disponibilidade
  pública contém horários e duração, nunca nome, telefone, observações ou IDs
  de agendamentos; bloqueios públicos omitem justificativas internas.
- Escritas administrativas verificam role no banco.
- Guest booking usa RPC e não INSERT público direto.
- Storage restringe escrita por bucket e identidade.
- O bundle recebe somente a chave publicável; `service_role` nunca usa o
  prefixo `VITE_` nem é enviado ao navegador. JWTs legados só são aceitos quando
  o payload informa a role `anon`; chaves secretas falham antes do bootstrap.
- Contas são removidas por RPC exclusiva do proprietário, incluindo as sessões
  e a identidade em `auth.users`; a conta proprietária não pode se autoexcluir.
- A tela **Contas e acessos** promove clientes para profissionais pelo caminho
  protegido de `profiles`, impede rebaixamento com agenda vinculada e exige
  confirmação antes da exclusão permanente da identidade.
- Cadastro e recuperação compartilham política mínima de oito caracteres.
- Turnstile opcional envia tokens ao Supabase Auth em login, cadastro e
  recuperação; a chave secreta existe somente no servidor/painel do provedor.
- Aceites de privacidade registram data do servidor e versão da política; o
  próprio cliente não consegue alterar essa evidência posteriormente.

Antes de produção: revisar grants após cada migration, testar owner/professional/
customer/anônimo, confirmar redirects permitidos, rotação de chaves e políticas
de backup. Nunca registrar tokens, PIX ou dados sensíveis em logs.

## Autorização da aplicação

O frontend centraliza compatibilidade de roles em `src/auth/authorization.ts`.
`owner` e `professional` são os nomes canônicos no schema consolidado;
`admin` e `barber` continuam aceitos temporariamente no frontend para clientes
que ainda não aplicaram a migration `202608220006_canonical_application_roles`.
Roles (`manager` e `receptionist`) permanecem negadas por padrão nas
áreas sensíveis até existirem policies RLS específicas — exibir uma tela nunca
é suficiente para conceder acesso aos dados.
Respostas de `profiles` também passam por `parseUserRole`; valores desconhecidos
falham fechados na boundary de autenticação, em vez de receberem um fallback de
permissão ou serem propagados pela interface.

`auth_role()` é um helper `SECURITY DEFINER` sem argumentos usado diretamente
pelas policies RLS e de Storage para resolver somente a role do chamador atual.
Ele permanece executável pelos papéis de navegador porque essas próprias
policies dependem dele; não aceita IDs externos, não altera dados e não é usado
como endpoint de mutação. Helpers privilegiados que alteram estado não recebem
essa exceção.

## Bootstrap do proprietário

Antes do cadastro público, o operador executa
`prepare_installation_owner('proprietario@exemplo.com')` exclusivamente no SQL
Editor. A função devolve um código único de 64 caracteres, armazena somente seu
hash, limita a validade a 24 horas e vincula a reivindicação ao e-mail confirmado.
Não há grant para `anon` ou `authenticated` gerar códigos ou ler a tabela privada.

`claim_first_owner(codigo)` usa advisory lock, validade, consumo único e uma
restrição física que admite apenas um proprietário. Ele é detalhe interno do
`complete_business_onboarding()` e não possui grant de execução para `anon`,
`authenticated` ou `service_role`; portanto não é uma RPC direta da Data API.
O registro interno faz `auth_role()` reconhecer o proprietário antes da promoção
do perfil, sem desabilitar a proteção contra autoelevação. O navegador conclui
a primeira instalação somente pela RPC transacional
`complete_business_onboarding()`, que reivindica o proprietário e persiste a
configuração no mesmo commit ou faz rollback de tudo.

## Integridade da agenda

Cada reserva mantém snapshots imutáveis de início, término e duração. Alterar
preços ou duração no catálogo não modifica agendamentos antigos nem muda o valor
de um reagendamento. A restrição GiST no banco impede conflitos inclusive entre
requisições concorrentes, e a janela pública, antecedência e prazo de cancelamento
são validados pelo servidor.

A CI aplica o schema consolidado em um PostgreSQL descartável sem grants
automáticos e verifica a promoção inicial, isolamento por role, superfície de
RPC privilegiada, exposição pública, conflito de horários, imutabilidade dos
snapshots, cancelamento e exclusão completa de contas.
