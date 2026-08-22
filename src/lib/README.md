# src/lib

Bibliotecas/integrações compartilhadas de baixo nível.

- `supabaseClient.ts` — instância única do cliente Supabase, usada tanto
  pelo módulo de autenticação (`src/auth`) quanto pela camada de dados
  (`src/services/dataService.ts`).

Outras integrações futuras não relacionadas a dados/auth também podem viver
aqui.
