# Nova instalação

1. Crie um projeto Supabase gratuito e aplique uma única vez o `supabase/schema.sql` consolidado. Não execute as migrations depois do schema; elas atualizam somente instalações existentes.
2. Crie um projeto Vercel ligado à branch estável deste mesmo repositório.
3. Configure apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Cadastre a primeira conta pela aplicação e faça login. Quando ainda não há
   proprietário, o wizard reivindica essa conta uma única vez com trava transacional.
5. Execute o onboarding exibido: nicho, identidade, tema, horários, serviços
   sugeridos/editáveis, equipe e regras iniciais da agenda. A conclusão persiste
   todas as etapas atomicamente; falhas não deixam uma instalação parcial.

Escolha `barbershop`, `beauty_salon`, `nail_studio` ou `pet_shop`. Os presets
sugerem conteúdo; revise/remova tudo. Pet Shop habilita `pets`. Cada empresa
repete esses passos em projetos novos, sem fork ou alteração de código.
