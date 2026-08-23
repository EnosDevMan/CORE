# Plano de migração legada

1. Congelar janela e gerar backups verificáveis de banco, Auth e Storage.
2. Inventariar IDs, arquivos, regras e contagens por tabela.
3. Aplicar schema novo em projeto separado; nunca modificar produção automaticamente.
4. Transformar dados com mapa reproduzível e preservar relação usuário/perfil.
5. Validar contagens, amostras, agenda, permissões e arquivos.
6. Fazer cutover com período curto de escrita bloqueada.
7. Manter origem intacta durante aceite; rollback restaura URL/env e reabre origem.

Credenciais e dados reais não pertencem a scripts versionados.
