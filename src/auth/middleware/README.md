# auth/middleware

Guards de permissão por papel (RBAC).

**Importante:** este projeto não usa `react-router` — a navegação é feita
por estado em `App.tsx` (`currentView` + `navigateTo`). A blindagem
principal contra acesso indevido (ex: cliente tentando abrir `/admin`)
já acontece ali, dentro de `navigateTo`.

## `withRoleGuard.tsx`

Uma segunda camada de defesa, no nível de componente (não de rota):

```typescript
export default withRoleGuard(AdminPanel, 'admin');
export default withRoleGuard(BarberDashboard, ['admin', 'barber']);
```

Se o usuário não tiver a role exigida, renderiza uma mensagem de acesso
negado em vez do conteúdo — não redireciona (não há rotas pra redirecionar).

Também inclui `useCanAccess`, pra esconder/mostrar botões condicionalmente:

```typescript
const podeVerAdmin = useCanAccess('admin');
{podeVerAdmin && <BotaoAdmin />}
```

## Se o projeto migrar para react-router no futuro

Aí sim faria sentido reescrever este guard usando `<Navigate>` para
redirecionar rotas de verdade. Até lá, `useCanAccess` + a checagem em
`App.tsx > navigateTo` cobrem o caso de uso atual.
