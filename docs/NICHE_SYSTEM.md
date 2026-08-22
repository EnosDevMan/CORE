# Sistema de nichos

`src/niches/registry.ts` é o catálogo central. Cada preset define terminologia,
capabilities recomendadas, temas recomendados e sugestões editáveis de serviço.
Ele não duplica telas nem impõe aparência.

Para adicionar um nicho: inclua o ID tipado, preset, fixture/teste, enum via
migration e documentação. Componentes consomem `useNiche()`; não adicione
condicionais espalhadas. Uma entidade específica deve ser feature opcional.


O módulo Pet Shop fica em `src/features/pets` e no conjunto `pets`, `pet_notes`
e `booking_pets`. Ativá-lo é uma decisão de capability do preset/configuração,
não uma dependência da agenda ou dos demais nichos.
