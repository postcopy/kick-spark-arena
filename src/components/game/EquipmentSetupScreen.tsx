import { useEffect, useRef } from "react";
import { OctagonBackground } from "./OctagonBackground";
import { UseSerialPortReturn } from "@/types/serial";
import logoImage from "@/assets/logo-desafio-relampago.png";
import { Cpu, ArrowLeft, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useSound } from "@/contexts/SoundContext";

export interface EquipmentSetupScreenProps {
  serialPort: UseSerialPortReturn;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

type CheckStatus = "ok" | "pending" | "error" | "loading";

function CheckItem({ label, status }: { label: string; status: CheckStatus }) {
  const prefix =
    status === "ok" ? "[OK]" :
    status === "error" ? "[!!]" :
    "[..]";

  const colorClass =
    status === "ok" ? "text-emerald-400" :
    status === "error" ? "text-red-400" :
    "text-slate-400";

  return (
    <div className={`font-mono text-sm flex gap-2 ${status === "loading" ? "animate-pulse" : ""}`}>
      <span className={colorClass}>{prefix}</span>
      <span className="text-slate-300">{label}</span>
    </div>
  );
}

export function EquipmentSetupScreen({
  serialPort,
  onContinue,
  onSkip,
  onBack,
}: EquipmentSetupScreenProps) {
  const { isSupported, isConnected, isConnecting, isAutoConnecting, error } = serialPort;
  const { play } = useSound();

  // Play sound on USB connect/disconnect transition
  const prevConnected = useRef(isConnected);
  useEffect(() => {
    if (prevConnected.current !== isConnected) {
      if (isConnected) play('usbConnected');
      else if (prevConnected.current) play('usbDisconnected');
      prevConnected.current = isConnected;
    }
  }, [isConnected, play]);

  // Determine visual state
  const browserStatus: CheckStatus = isSupported ? "ok" : "error";
  const usbStatus: CheckStatus = isConnected ? "ok" : isConnecting || isAutoConnecting ? "loading" : "pending";
  const handshakeStatus: CheckStatus = isConnected ? "ok" : isConnecting ? "loading" : "pending";

  // Icon state
  const iconClass = isAutoConnecting
    ? "text-cyan-400 animate-pulse"
    : isConnecting
    ? "text-amber-400 animate-spin"
    : isConnected
    ? "text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.8)]"
    : "text-slate-600";

  return (
    <div role="main" aria-label="Configuração de equipamento" className="relative h-full w-full overflow-auto bg-background text-white">
      <OctagonBackground />

      <div className="relative z-10 mx-auto flex min-h-full max-w-lg flex-col items-center justify-center px-4 py-10">
        {/* Central panel */}
        <div className="w-full rounded-2xl border border-cyan-500/30 bg-[#0b1120]/90 p-6 backdrop-blur-md animate-in zoom-in duration-300">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-slate-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} />
              Voltar
            </button>
            <img src={logoImage} alt="Logo" className="h-8 w-auto opacity-80" />
          </div>

          {/* Central icon */}
          <div className="flex justify-center mb-4">
            <Cpu className={`w-20 h-20 transition-all duration-500 ${iconClass}`} />
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            {isAutoConnecting ? (
              <>
                <h2 className="font-mono text-xl font-bold tracking-wider text-cyan-400">
                  BUSCANDO HARDWARE...
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Dispositivo autorizado detectado. Reconectando...
                </p>
                <div className="mt-4">
                  <Progress value={60} className="h-1.5 bg-slate-800 [&>div]:bg-cyan-500 [&>div]:animate-pulse" />
                </div>
              </>
            ) : isConnecting ? (
              <>
                <h2 className="font-mono text-xl font-bold tracking-wider text-amber-400">
                  CONECTANDO...
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Estabelecendo comunicação com a placa.
                </p>
              </>
            ) : isConnected ? (
              <>
                <h2 className="font-mono text-xl font-bold tracking-wider text-emerald-400 animate-in fade-in duration-500">
                  SISTEMA ONLINE
                </h2>
                <p className="mt-2 text-sm text-emerald-300/70">
                  Hardware conectado e operacional.
                </p>
              </>
            ) : (
              <>
                <h2 className="font-mono text-xl font-bold tracking-wider text-cyan-400">
                  AGUARDANDO CONEXÃO
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Conecte o USB para iniciar o protocolo.
                </p>
              </>
            )}
          </div>

          {/* Browser incompatible alert */}
          {!isSupported ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 mb-4">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertTriangle size={18} />
                <span className="font-mono text-sm font-bold">NAVEGADOR INCOMPATÍVEL</span>
              </div>
              <p className="text-sm text-red-300/80">
                Web Serial API não disponível. Use <b>Google Chrome</b> ou <b>Microsoft Edge</b> para conectar a placa.
              </p>
            </div>
          ) : (
            <>
              {/* Terminal checklist */}
              <div className="rounded-lg border border-white/5 bg-black/30 p-4 mb-6 space-y-2">
                <CheckItem label="Compatibilidade do Navegador" status={browserStatus} />
                <CheckItem label="Permissão de Acesso USB" status={usbStatus} />
                <CheckItem label="Handshake do Equipamento" status={handshakeStatus} />
              </div>

              {/* Error display */}
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 mb-4 space-y-2" role="alert">
                  <p className="font-mono text-sm font-bold text-red-400 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    Falha na conexão
                  </p>
                  <p className="text-xs text-red-300">{error}</p>
                  <p className="text-xs text-slate-400">
                    Verifique se o cabo USB está conectado e o driver está instalado.
                  </p>
                  <button
                    type="button"
                    onClick={() => serialPort.connect()}
                    disabled={isConnecting}
                    className="mt-1 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-xs font-bold hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {/* Action buttons */}
              {!isAutoConnecting && (
                <div className="space-y-3">
                  {isConnected ? (
                    <>
                      <button
                        type="button"
                        onClick={onContinue}
                        className="w-full rounded-xl bg-emerald-600 py-4 px-8 font-bold tracking-widest uppercase text-white shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:bg-emerald-500 transition-colors"
                      >
                        CONTINUAR
                      </button>
                      <button
                        type="button"
                        onClick={() => serialPort.disconnect()}
                        className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        Desconectar
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => serialPort.connect()}
                      disabled={isConnecting}
                      className="w-full rounded-xl bg-cyan-600 py-4 px-8 font-bold tracking-widest uppercase text-white shadow-[0_0_20px_rgba(8,145,178,0.4)] hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isConnecting ? "CONECTANDO..." : "INICIALIZAR CONEXÃO"}
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Skip link */}
          {!isConnected && !isAutoConnecting && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onSkip}
                className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                Pular e usar teclado (modo teste)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
