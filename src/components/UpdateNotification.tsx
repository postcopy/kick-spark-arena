import { useState, useEffect } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';

export function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<{ version: string } | null>(null);
  const [progress, setProgress] = useState<{ percent: number } | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    if (!window.electronAPI?.onUpdateAvailable) return;

    window.electronAPI.getAppVersion().then(v => setAppVersion(v));

    const cleanups = [
      window.electronAPI.onUpdateAvailable((info) => {
        setUpdateInfo(info);
        setDismissed(false);
      }),
      window.electronAPI.onUpdateProgress((p) => setProgress(p)),
      window.electronAPI.onUpdateDownloaded(() => setDownloaded(true)),
    ];

    return () => cleanups.forEach(fn => fn?.());
  }, []);

  if (!updateInfo || dismissed) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-4 max-w-sm animate-in slide-in-from-top duration-300">
      <button onClick={() => setDismissed(true)} className="absolute top-2 right-2 text-zinc-500 hover:text-white">
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Download className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <div className="text-sm font-bold text-white">Nova versao disponivel!</div>
          <div className="text-xs text-zinc-400">v{appVersion} → v{updateInfo.version}</div>
        </div>
      </div>

      {progress && !downloaded && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>Baixando...</span>
            <span>{progress.percent}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
      )}

      {downloaded ? (
        <button
          onClick={() => window.electronAPI?.installUpdate()}
          className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          INSTALAR E REINICIAR
        </button>
      ) : !progress ? (
        <div className="flex gap-2">
          <button
            onClick={() => window.electronAPI?.downloadUpdate()}
            className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-colors"
          >
            BAIXAR AGORA
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="h-9 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
          >
            DEPOIS
          </button>
        </div>
      ) : null}
    </div>
  );
}
