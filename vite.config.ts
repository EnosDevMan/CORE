import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.ts",
    },
    plugins: [react(), tailwindcss()],
    // Mantém avisos de licença em artefatos `.LEGAL.txt` separados. Eles
    // continuam no deploy, mas não são baixados/executados como JavaScript em
    // cada visita e não incham artificialmente o orçamento dos chunks.
    esbuild: {
      legalComments: 'external' as const,
    },
    resolve: {
      alias: {
        '@': projectRoot,
      },
    },
    build: {
      // Nenhuma configuração de build existia antes (só a de dev server).
      // Sourcemap desligado em produção: menor upload/deploy, e evita
      // expor o código-fonte original no browser de quem visita o site.
      sourcemap: false,
      rollupOptions: {
        output: {
          // Separa dependências grandes e estáveis (mudam raramente) em
          // chunks próprios, isolados do código da aplicação (que muda a
          // cada deploy). Resultado: quem já visitou o site antes reusa o
          // cache do navegador para essas libs em vez de rebaixar tudo de
          // novo a cada novo deploy.
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'supabase-vendor': ['@supabase/supabase-js'],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // File watching can be disabled in constrained development environments.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
