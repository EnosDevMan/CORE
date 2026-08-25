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
3. Crie um projeto Vercel ligado à branch estável deste mesmo repositório, com
   preset Vite, Node 22, instalação `npm ci`, build `npm run build` e saída
   `dist`.
4. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com valores
   desse novo Supabase. Em Auth, defina Site URL/redirects reais, confirmação
   de e-mail, senha mínima de oito caracteres e SMTP próprio autenticado.
   Sem SMTP próprio, clientes externos não receberão confirmação ou recuperação.
5. Opcionalmente configure `VITE_TURNSTILE_SITE_KEY` com a chave pública do
   Cloudflare Turnstile e habilite CAPTCHA no Supabase usando a chave secreta
   somente no painel Auth. Primeiro publique a variável; depois exija CAPTCHA.
6. Cadastre-se com exatamente o e-mail preparado, confirme esse endereço e faça
   login. Informe o código no wizard; outra conta não consegue reivindicar a
   instalação mesmo que se cadastre primeiro.
7. Execute o onboarding exibido: nicho, identidade, tema, horários, serviços
   sugeridos/editáveis, equipe e regras iniciais da agenda. A conclusão persiste
   todas as etapas atomicamente; falhas não deixam uma instalação parcial.
8. Para criar acessos da equipe, peça ao profissional que crie uma conta comum;
   depois, no painel proprietário, abra **Contas e acessos**, altere o papel
   para Profissional e vincule a conta no cadastro da equipe.

Escolha `barbershop`, `beauty_salon`, `nail_studio` ou `pet_shop`. Os presets
sugerem conteúdo; revise/remova tudo. Pet Shop habilita `pets`. Cada empresa
repete esses passos em projetos novos, sem fork ou alteração de código.
