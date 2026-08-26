# Sistema de nichos

`src/niches/registry.ts` é o catálogo central. Cada preset define terminologia,
capabilities recomendadas, temas recomendados, composição pública e sugestões
editáveis de serviço. Ele não duplica fluxos nem componentes de negócio.

As quatro composições públicas têm assinaturas distintas: barbearia é
editorial/industrial, salão trabalha respiro e luxo leve, nail studio usa
vitrine glossy e formas orgânicas, e pet shop prioriza acolhimento e geometria
arredondada. Conteúdo e imagens do proprietário sempre prevalecem sobre presets.

Para adicionar um nicho: inclua o ID tipado, preset, layout, identidade visual,
fixture/teste, enum via migration e documentação. Componentes consomem
`useNiche()`; condicionais visuais devem ficar em componentes/CSS sem duplicar
regras de agenda. Uma entidade específica deve ser feature opcional.


O módulo Pet Shop fica em `src/features/pets` e no conjunto `pets`, `pet_notes`
e `booking_pets`. Ativá-lo é uma decisão de capability do preset/configuração,
não uma dependência da agenda ou dos demais nichos.
