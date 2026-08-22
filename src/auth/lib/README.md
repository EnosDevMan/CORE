# auth/lib

O cliente Supabase é único no projeto e vive em `src/lib/supabaseClient.ts`
(compartilhado com a camada de dados). Este módulo importa de lá em vez de
criar uma segunda instância — ver o comentário no próprio arquivo para o
motivo.
