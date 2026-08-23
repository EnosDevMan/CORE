import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Rede de segurança de última instância: sem isto, um erro de renderização
 * em qualquer lugar da árvore (ex: um dos painéis carregados via
 * React.lazy) derrubava a aplicação inteira para uma tela branca, sem
 * nenhuma forma de recuperação para quem estivesse usando o site.
 *
 * Precisa ser um componente de classe — React ainda não oferece um
 * equivalente via hooks para getDerivedStateFromError/componentDidCatch.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // Mantido apenas como console.error (não console.log) e só isto —
    // ponto de extensão natural para um serviço de monitoramento de erros
    // (Sentry ou similar) no futuro.
    console.error('Erro não tratado na aplicação:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
          <div className="max-w-sm w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center space-y-4">
            <h1 className="text-lg font-extrabold text-slate-900">Algo deu errado</h1>
            <p className="text-sm text-slate-500">
              Ocorreu um erro inesperado. Tente voltar para a página inicial; se o problema continuar, entre em contato com o estabelecimento.
            </p>
            <button
              onClick={this.handleReload}
              className="w-full h-11 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors"
            >
              Voltar para o início
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
