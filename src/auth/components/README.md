# auth/components

O formulário de login/cadastro/recuperação de senha vive em
`src/components/LoginModal.tsx` (é um modal usado em vários pontos da UI,
não exclusivo deste módulo).

A página de destino do link de "recuperar senha" (enviado por
`supabaseAuthProvider.sendPasswordResetEmail`) também já existe:
`src/components/ResetPasswordView.tsx`. Ela é exibida automaticamente em
`App.tsx` quando o Supabase dispara o evento `PASSWORD_RECOVERY` (ver
`useAuthStore.passwordRecoveryMode`) — não depende de rota, já que o app
não usa react-router.
