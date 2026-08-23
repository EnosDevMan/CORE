# Nova instalação

1. Crie um projeto Supabase exclusivo desta instalação e aplique uma única vez
   o `supabase/schema.sql` consolidado. Não execute as migrations depois do
   schema; elas atualizam somente instalações existentes.
2. No SQL Editor desse mesmo projeto, prepare a conta real do proprietário:

   ```sql
   select public.prepare_installation_owner('proprietario@exemplo.com');
   ```

   Copie o código de 64 caracteres exibido uma única vez. Ele expira em 24 horas,
   pertence exclusivamente ao e-mail informado e nunca deve ser salvo no GitHub,
   em variáveis `VITE_`, na URL ou em mensagens públicas. Executar novamente o
   comando invalida o código anterior enquanto ainda não houver proprietário.
3. Crie um projeto Vercel ligado à branch estável deste mesmo repositório.
4. Configure somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`
   com valores desse novo Supabase. Configure os redirects reais do Auth.
5. Cadastre-se com exatamente o e-mail preparado, confirme esse endereço e faça
   login. Informe o código no wizard; outra conta não consegue reivindicar a
   instalação mesmo que se cadastre primeiro.
6. Execute o onboarding exibido: nicho, identidade, tema, horários, serviços
   sugeridos/editáveis, equipe e regras iniciais da agenda. A conclusão persiste
   todas as etapas atomicamente; falhas não deixam uma instalação parcial.

Escolha `barbershop`, `beauty_salon`, `nail_studio` ou `pet_shop`. Os presets
sugerem conteúdo; revise/remova tudo. Pet Shop habilita `pets`. Cada empresa
repete esses passos em projetos novos, sem fork ou alteração de código.
