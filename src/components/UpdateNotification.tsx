import { useState, useEffect, useCallback } from 'react';
import { Download, RefreshCw, X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

type UpdateState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'no-update'; version: string }
  | { kind: 'available'; version: string }
  | { kind: 'downloading'; version: string; percent: number }
  | { kind: 'downloaded'; version: string }
  | { kind: 'error'; message: string };

/**
 * UI de auto-update com estados visiveis. Antes era silenciosa: se nao
 * houvesse update disponivel ou rolasse erro de rede, nada aparecia e o
 * operador ficava no escuro (caso real: PC com 1.4.9 instalado nunca
 * recebia notificacao do 1.3.0 publicado, sem feedback de "ja esta atual").
 *
 * P7 (estado visivel sempre): badge persistente bottom-right mostra status.
 * P8 (reducao de clique): botao "Verificar agora" sempre acessivel.
 */
export function UpdateNotification() {
  const [state, setState] = useState<UpdateState>({ kind: 'idle' });
  const [appVersion, setAppVersion] = useState('');
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    if (!window.electronAPI?.onUpdateAvailable) return;

    window.electronAPI.getAppVersion().then(v => setAppVersion(v));

    const cleanups = [
      window.electronAPI.onUpdateChecking?.(() => setState({ kind: 'checking' })),
      window.electronAPI.onUpdateAvailable((info) => {
        setState({ kind: 'available', version: info.version });
        setCollapsed(false);
      }),
      window.electronAPI.onUpdateNotAvailable?.((info) => {
        setState({ kind: 'no-update', version: info?.version || appVersion });
      }),
      window.electronAPI.onUpdateProgress((p) => {
        setState(prev => prev.kind === 'downloading' || prev.kind === 'available'
          ? { kind: 'downloading', version: prev.kind === 'available' ? prev.version : prev.version, percent: p.percent }
          : prev);
      }),
      window.electronAPI.onUpdateDownloaded(() => {
        setState(prev => ({ kind: 'downloaded', version: prev.kind === 'downloading' || prev.kind === 'available' ? prev.version : '' }));
        setCollapsed(false);
      }),
      window.electronAPI.onUpdateError?.((info) => {
        setState({ kind: 'error', message: info?.message || 'Erro desconhecido' });
      }),
    ];

    return () => cleanups.forEach(fn => fn?.());
  }, [appVersion]);

  const checkNow = useCallback(async () => {
    if (!window.electronAPI?.checkForUpdates) return;
    setState({ kind: 'checking' });
    try {
      const r = await window.electronAPI.checkForUpdates();
      if (!r?.ok) {
        setState({ kind: 'error', message: r?.error || 'Falha ao verificar' });
      } else if (r.updateAvailable && r.version) {
        setState({ kind: 'available', version: r.version });
        setCollapsed(false);
      } else {
        setState({ kind: 'no-update', version: r.currentVersion });
      }
    } catch (err) {
      setState({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  if (!window.electronAPI?.isElectron) return null;

  // Badge persistente bottom-right (sempre visivel, expandivel)
  const isImportant = state.kind === 'available' || state.kind === 'downloaded' || state.kind === 'downloading';

  if (collapsed && !isImportant) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-3 right-3 z-[9999] h-7 px-2.5 rounded-md bg-zinc-900/80 border border-zinc-700/60 text-[10px] text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors flex items-center gap-1.5 backdrop-blur-sm"
        title="Status de atualizacao"
      >
        {state.kind === 'checking' && <Loader2 className="h-3 w-3 animate-spin" />}
        {state.kind === 'no-update' && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
        {state.kind === 'error' && <AlertTriangle className="h-3 w-3 text-amber-500" />}
        {state.kind === 'idle' && <RefreshCw className="h-3 w-3" />}
        <span className="font-mono">v{appVersion || '?'}</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-3 right-3 z-[9999] bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-3 w-72 text-zinc-100">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {state.kind === 'checking' && <Loader2 className="h-4 w-4 text-zinc-400 animate-spin" />}
          {state.kind === 'no-update' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          {(state.kind === 'available' || state.kind === 'downloading') && <Download className="h-4 w-4 text-emerald-400" />}
          {state.kind === 'downloaded' && <RefreshCw className="h-4 w-4 text-emerald-400" />}
          {state.kind === 'error' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
          {state.kind === 'idle' && <RefreshCw className="h-4 w-4 text-zinc-400" />}
          <span className="text-xs font-semibold uppercase tracking-wider">
            {state.kind === 'checking' && 'Verificando…'}
            {state.kind === 'no-update' && 'Atualizado'}
            {state.kind === 'available' && 'Atualizacao disponivel'}
            {state.kind === 'downloading' && 'Baixando…'}
            {state.kind === 'downloaded' && 'Pronto pra instalar'}
            {state.kind === 'error' && 'Erro de verificacao'}
            {state.kind === 'idle' && 'Atualizacoes'}
          </span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="text-zinc-500 hover:text-white transition-colors"
          title="Recolher"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="text-[11px] text-zinc-400 font-mono mb-2.5">
        Instalado: v{appVersion || '?'}
        {(state.kind === 'available' || state.kind === 'downloading' || state.kind === 'downloaded') &&
          <> → <span className="text-emerald-400">v{state.version}</span></>}
        {state.kind === 'no-update' && <> · ja na ultima versao</>}
      </div>

      {state.kind === 'downloading' && (
        <div className="mb-2.5">
          <div className="flex justify-between text-[10px] text-zinc-500 mb-1 font-mono">
            <span>{Math.round(state.percent)}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${state.percent}%` }} />
          </div>
        </div>
      )}

      {state.kind === 'error' && (
        <div className="text-[11px] text-amber-400/80 mb-2.5 font-mono break-words">
          {state.message}
        </div>
      )}

      <div className="flex gap-2">
        {state.kind === 'available' && (
          <button
            onClick={() => window.electronAPI?.downloadUpdate()}
            className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs uppercase tracking-wide transition-colors"
          >
            Baixar
          </button>
        )}
        {state.kind === 'downloaded' && (
          <button
            onClick={() => window.electronAPI?.installUpdate()}
            className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Instalar e reiniciar
          </button>
        )}
        {(state.kind === 'idle' || state.kind === 'no-update' || state.kind === 'error') && (
          <button
            onClick={checkNow}
            className="flex-1 h-8 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded text-xs uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Verificar agora
          </button>
        )}
        {state.kind === 'checking' && (
          <button disabled className="flex-1 h-8 bg-zinc-800/50 text-zinc-500 font-medium rounded text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 cursor-not-allowed">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Verificando…
          </button>
        )}
      </div>
    </div>
  );
}
