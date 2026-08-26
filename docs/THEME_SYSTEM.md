# Sistema de temas

`src/themes/registry.ts` cataloga IDs estáveis, modo, personalidade e tokens.
Tema e nicho continuam independentes: o nicho define linguagem, conteúdo e
composição; o tema define paleta, tipografia, textura, gradientes, geometria,
navegação e sombras. Para adicionar um tema, defina todos os tokens,
recomendações e teste contraste/foco nos quatro breakpoints móveis.

Overrides futuros devem validar contraste; valores são persistidos em appearance
settings, não em componentes nem variáveis técnicas de ambiente.

O runtime converte tokens para variáveis CSS no `BusinessProvider`. Um ID de
tema removido ou desconhecido usa `minimal_light` como fallback seguro, evitando
que configurações antigas deixem a aplicação sem renderização.

O proprietário escolhe somente temas recomendados para o nicho em
**Painel → Aparência**. Os cartões mostram uma prévia real da identidade e o
tema ativo também alcança sidebar, superfícies, campos e botões administrativos.
Login, recuperação de senha, agendamento e áreas de cliente/profissional também
herdam superfícies, contraste, tipografia e controles do mesmo tema. Os 12 IDs
existentes são contratos persistidos e não devem ser renomeados.

## Marca própria

`BusinessBrand` é a única renderização de marca para navbar, hero, rodapé,
transições e painel. Quando `business_profile.logo_url` existe ele substitui o
ícone do nicho; falhas de carregamento voltam ao ícone seguro. O editor permite
zoom e foco horizontal/vertical, gera WEBP 512×512 e persiste a mesma imagem em
`favicon_url`. Formatos aceitos: JPG, PNG e WEBP, até 5 MB.
