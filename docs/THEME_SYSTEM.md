# Sistema de temas

`src/themes/registry.ts` cataloga IDs estáveis, modo, recomendações e tokens.
Tema e nicho são independentes. Para adicionar um tema, defina todos os tokens,
recomendações e teste contraste/focus nos quatro breakpoints móveis.

Overrides futuros devem validar contraste; valores são persistidos em appearance
settings, não em componentes nem variáveis técnicas de ambiente.

O runtime converte tokens para variáveis CSS no `BusinessProvider`. Um ID de
tema removido ou desconhecido usa `minimal_light` como fallback seguro, evitando
que configurações antigas deixem a aplicação sem renderização.
