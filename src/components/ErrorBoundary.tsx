import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-[100dvh] gap-6 p-6 text-center bg-[#0A0A0F]">
          <div className="p-5 bg-[#E11D48]/10 rounded-2xl">
            <svg className="w-14 h-14 text-[#E11D48]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-bold text-3xl text-white">Algo deu errado</h2>
            <p className="text-[#94A3B8] text-lg max-w-md">
              {this.props.fallbackMessage || 'Ocorreu um erro inesperado. Tente recarregar a página.'}
            </p>
          </div>

          {/* Debug: show actual error for diagnosis — photograph this! */}
          {this.state.error && (
            <div className="max-w-xl w-full bg-[#1a1a2e] border border-[#E11D48]/30 rounded-xl p-4 text-left overflow-auto" style={{ maxHeight: 200 }}>
              <p className="text-[#E11D48] text-sm font-mono font-bold mb-1">{this.state.error.name}: {this.state.error.message}</p>
              <pre className="text-[#64748B] text-xs font-mono whitespace-pre-wrap break-all">{this.state.error.stack?.split('\n').slice(0, 8).join('\n')}</pre>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="h-12 px-8 text-base font-bold rounded-xl bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white hover:from-[#C81840] hover:to-[#8F1035] shadow-lg shadow-[#E11D48]/20"
            >
              Tentar novamente
            </button>
            <button
              onClick={() => {
                const electronAPI = (window as any).electronAPI;
                if (electronAPI?.reload) {
                  electronAPI.reload();
                } else {
                  window.location.reload();
                }
              }}
              className="h-12 px-8 text-base font-bold rounded-xl bg-[#1E1E2E] text-[#94A3B8] hover:text-white hover:bg-[#2D2D3F] border border-[#2D2D3F]"
            >
              Recarregar app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
