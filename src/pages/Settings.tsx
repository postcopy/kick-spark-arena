import { Monitor, Clock } from 'lucide-react';
import { useScreensaverSettings } from '@/hooks/useScreensaverSettings';
import { cn } from '@/lib/utils';

const TIMEOUT_OPTIONS = [
  { value: 1, label: '1 min' },
  { value: 2, label: '2 min' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
];

export default function Settings() {
  const { enabled, timeoutMinutes, setEnabled, setTimeoutMinutes } = useScreensaverSettings();

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="font-display font-bold text-2xl md:text-3xl text-white">Configurações</h1>
          <p className="text-sm text-[#94A3B8]">Ajustes do aplicativo</p>
        </div>

        {/* Screensaver Section */}
        <div className="p-5 bg-[#141420] rounded-xl border border-[#1E1E2E] space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#1E1E2E] rounded-lg">
              <Monitor className="w-5 h-5 text-[#94A3B8]" />
            </div>
            <div className="flex-1">
              <h2 className="font-display font-bold text-lg text-white">Protetor de Tela</h2>
              <p className="text-xs text-[#64748B]">Exibe a logo animada quando ninguém está usando</p>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between py-3 border-t border-[#1E1E2E]">
            <span className="text-sm text-[#94A3B8] font-mono">Ativado</span>
            <button
              onClick={() => setEnabled(!enabled)}
              className={cn(
                'relative w-12 h-7 rounded-full transition-colors duration-200',
                enabled ? 'bg-[#E11D48]' : 'bg-[#1E1E2E]'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform duration-200',
                  enabled && 'translate-x-5'
                )}
              />
            </button>
          </div>

          {/* Timeout selector */}
          <div className={cn('space-y-3 transition-opacity', !enabled && 'opacity-40 pointer-events-none')}>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#64748B]" />
              <span className="text-sm text-[#94A3B8] font-mono">Tempo de inatividade</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {TIMEOUT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTimeoutMinutes(opt.value)}
                  className={cn(
                    'h-10 rounded-lg font-mono text-sm font-bold transition-all border',
                    timeoutMinutes === opt.value
                      ? 'bg-[#E11D48]/10 border-[#E11D48]/40 text-[#E11D48]'
                      : 'bg-[#1E1E2E]/50 border-[#1E1E2E] text-[#64748B] hover:border-[#94A3B8]/30 hover:text-[#94A3B8]'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
