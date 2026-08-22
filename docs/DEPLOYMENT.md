# Deployment

Um GitHub alimenta vários projetos Vercel. Cada Vercel possui URL/env próprios e
aponta para exatamente um Supabase próprio (banco, Auth e Storage). Use a mesma
branch estável para receber atualizações globais.

Antes de promover: backup, migration em staging, quatro checks de qualidade,
smoke test anônimo/autenticado e plano de rollback. Nunca conecte uma preview ao
banco de produção nem compartilhe chaves entre clientes.
