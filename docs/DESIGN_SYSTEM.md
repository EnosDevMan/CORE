# Design system

## Tokens

Background/canvas/foreground, surface/elevated, primary/secondary/accent e
respectivos foregrounds, muted, success, warning, danger, border, input, ring,
decorative, nav, famílias tipográficas, tracking, raios, sombras, gradientes e
textura são obrigatórios. Espaçamento usa escala consistente de 4px.

## Mobile e acessibilidade

Começar em 360px; touch targets devem ter pelo menos 44×44px. Inputs têm label,
erros associados e tipo/teclado apropriado. Dialogs respeitam viewport, foco e
Escape. Toda ação funciona sem hover. Estados loading, vazio e erro são claros.

## Primitives alvo

Button, Input, Textarea, Select, Checkbox, Radio, Switch, Dialog/Drawer, Card,
Badge, Tabs, Avatar, Toast, Spinner, Skeleton, EmptyState, ErrorState,
ConfirmDialog, DatePicker e TimePicker. Extraí-las somente com usos reais.

## Implementação

`BusinessRuntimeBoundary` carrega uma vez o perfil e as capabilities e aplica o
preset no `BusinessProvider`. Tokens viram custom properties `--core-*` no
limite da instalação. `Button` e `Field` são as primeiras primitives; novos
componentes devem usá-las, enquanto fluxos antigos são migrados sem uma troca
visual caótica. Pares de texto/fundo dos presets têm teste WCAG AA (4.5:1).

`data-niche`, `data-theme` e `data-section-style` permitem variar composição
sem misturar regras visuais com agendamento. A landing usa hero, cards,
portfólio e rodapé semânticos; admin, login, recuperação, agendamento e áreas
de cliente/profissional consomem os mesmos tokens em escopos próprios.
`BusinessBrand` concentra logo e fallback para que nenhum fluxo volte a exibir
uma marca genérica isolada. Imagens públicas quebradas recebem fallback visual.
