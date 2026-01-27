import { cn } from "@/lib/utils";
import { OctagonBackground } from "./OctagonBackground";
import { UseSerialPortReturn } from "@/types/serial";
import logoImage from "@/assets/logo-desafio-relampago.png";

export interface EquipmentSetupScreenProps {
  serialPort: UseSerialPortReturn;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

function BolinhaStatus({ ok, alerta }: { ok: boolean; alerta?: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-3 w-3 rounded-full ring-1 ring-white/10",
        ok ? "bg-emerald-400" : alerta ? "bg-amber-400" : "bg-white/20"
      )}
    />
  );
}

function Selo({
  texto,
  tipo = "neutro",
}: {
  texto: string;
  tipo?: "verde" | "amarelo" | "vermelho" | "neutro";
}) {
  const cls =
    tipo === "verde"
      ? "bg-emerald-500/15 text-emerald-200 ring-emerald-400/20"
      : tipo === "amarelo"
      ? "bg-amber-500/15 text-amber-200 ring-amber-400/20"
      : tipo === "vermelho"
      ? "bg-red-500/15 text-red-200 ring-red-400/20"
      : "bg-white/5 text-white/70 ring-white/10";

  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs ring-1", cls)}>
      {texto}
    </span>
  );
}

export function EquipmentSetupScreen({
  serialPort,
  onContinue,
  onSkip,
  onBack,
}: EquipmentSetupScreenProps) {
  const navegadorOk = serialPort.isSupported;
  const placaConectada = serialPort.isConnected;
  const conectando = serialPort.isConnecting;

  return (
    <div className="relative h-full w-full overflow-auto bg-background text-white">
      <OctagonBackground />

      <div className="relative z-10 mx-auto flex min-h-full max-w-3xl flex-col px-4 pb-10 pt-10">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/10 hover:bg-white/15"
          >
            ← Voltar
          </button>
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="Logo" className="h-9 w-auto" />
          </div>
          <div className="w-[72px]" />
        </div>

        <div className="mb-5 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Conectar Placa USB</h1>
          <p className="mt-2 text-sm text-white/70">
            Conecte a placa no USB do computador e clique para permitir o acesso.
          </p>
        </div>

        {/* Browser alert */}
        {!navegadorOk && (
          <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            Este navegador não suporta a conexão da placa. Use <b>Chrome</b> ou <b>Edge</b>.
          </div>
        )}

        {/* Card USB */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold">Placa USB</div>
              <div className="mt-1 text-sm text-white/70">
                Clique para permitir o acesso da placa no navegador.
              </div>
            </div>
            {placaConectada ? (
              <Selo texto="Conectada" tipo="verde" />
            ) : (
              <Selo texto={conectando ? "Conectando..." : "Aguardando"} tipo={conectando ? "amarelo" : "neutro"} />
            )}
          </div>

          <div className="mt-4 space-y-2 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <BolinhaStatus ok={navegadorOk} />
              <span>
                Navegador:{" "}
                <span className="text-white/70">
                  {navegadorOk ? "Web Serial OK" : "Não suportado"}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BolinhaStatus ok={placaConectada} alerta={conectando} />
              <span>
                Placa:{" "}
                <span className="text-white/70">
                  {placaConectada ? "Conectada" : "Ainda não conectada"}
                </span>
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {!placaConectada ? (
              <button
                type="button"
                onClick={() => serialPort.connect()}
                disabled={!navegadorOk || conectando}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-500/25 px-4 py-3 text-sm font-semibold text-blue-100 ring-1 ring-blue-400/30 hover:bg-blue-500/30 disabled:opacity-50"
              >
                {conectando ? "Conectando..." : "Conectar placa USB"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => serialPort.disconnect()}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15"
              >
                Desconectar
              </button>
            )}
          </div>
        </div>

        {/* Footer / CTA */}
        <div className="mt-auto pt-6">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
            {placaConectada ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex items-center gap-2 text-emerald-200">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-lg font-semibold">PLACA CONECTADA!</span>
                </div>
                <button
                  type="button"
                  onClick={onContinue}
                  className="w-full max-w-md min-h-12 rounded-2xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  Continuar →
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="text-sm text-white/70">
                  Conecte a placa USB para começar.
                </div>
                <button
                  type="button"
                  onClick={onSkip}
                  className="text-xs text-white/60 underline hover:text-white/80"
                >
                  Pular e usar teclado (modo teste)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
