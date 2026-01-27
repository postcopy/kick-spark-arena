import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { OctagonBackground } from "./OctagonBackground";
import { UseSerialPortReturn, EquipmentSlot } from "@/types/serial";
import logoImage from "@/assets/logo-desafio-relampago.png";

export interface EquipmentSetupScreenProps {
  serialPort: UseSerialPortReturn;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}

const STALE_MS = 10_000;

/**
 * IDs conforme documentação EngFlex:
 * 1: Colete vermelho (Red Vest)
 * 2: Colete azul (Blue Vest)
 * 3: Capacete vermelho (Red Helmet)
 * 4: Capacete azul (Blue Helmet)
 */
const EQUIPAMENTOS: Array<{
  id: EquipmentSlot;
  nome: string;
  cor: "vermelho" | "azul";
  tipo: "colete" | "capacete";
}> = [
  { id: 1, nome: "Colete vermelho", cor: "vermelho", tipo: "colete" },
  { id: 2, nome: "Colete azul", cor: "azul", tipo: "colete" },
  { id: 3, nome: "Capacete vermelho", cor: "vermelho", tipo: "capacete" },
  { id: 4, nome: "Capacete azul", cor: "azul", tipo: "capacete" },
];

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

function IndicadorBateria({ porcentagem }: { porcentagem: number | null }) {
  if (porcentagem === null) return null;

  const baixa = porcentagem <= 30;
  const muitoBaixa = porcentagem <= 15;
  const corTexto = muitoBaixa ? "text-red-200" : baixa ? "text-amber-200" : "text-emerald-200";
  const corFundo = muitoBaixa
    ? "bg-red-500/15 ring-red-400/20"
    : baixa
    ? "bg-amber-500/15 ring-amber-400/20"
    : "bg-emerald-500/15 ring-emerald-400/20";

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ring-1 tabular-nums", corTexto, corFundo)}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 9h16v6H3V9Z" stroke="currentColor" strokeWidth="2" />
        <path d="M21 10v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {porcentagem}%
    </span>
  );
}

function VestIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M7 6h10l2 4v10H5V10l2-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 10h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HelmetIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M4 14a8 8 0 1 1 16 0v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2Z" stroke="currentColor" strokeWidth="2" />
      <path d="M8 18v2M16 18v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function EquipmentSetupScreen({
  serialPort,
  onContinue,
  onSkip,
  onBack,
}: EquipmentSetupScreenProps) {
  const agora = Date.now();
  const mapa = serialPort.equipment;
  const versao = serialPort.equipmentVersion;

  const lista = useMemo(() => {
    return EQUIPAMENTOS.map((item) => {
      const raw = mapa.get(item.id);
      const bateria = raw?.battery ?? null;
      const lastSeen = raw?.lastSeen ?? null;
      const vistoRecentemente = lastSeen !== null && agora - lastSeen <= STALE_MS;
      const temBateria = typeof bateria === "number";
      const online = temBateria && vistoRecentemente;
      const stale = temBateria && !vistoRecentemente;

      return {
        ...item,
        bateria,
        online,
        stale,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapa, agora, versao]);

  const onlineCount = lista.filter((e) => e.online).length;
  const navegadorOk = serialPort.isSupported;
  const placaConectada = serialPort.isConnected;
  const conectando = serialPort.isConnecting;
  const prontoTotal = placaConectada && onlineCount === 4;
  const prontoMinimo = placaConectada && onlineCount >= 2;

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
          <h1 className="text-2xl font-semibold tracking-tight">Preparar Equipamentos</h1>
          <p className="mt-2 text-sm text-white/70">
            1) Conecte a placa no USB do computador. <br />
            2) Ligue os coletes e capacetes até aparecer "Online".
          </p>
        </div>

        {/* Browser alert */}
        {!navegadorOk && (
          <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            Este navegador não suporta a conexão da placa. Use <b>Chrome</b> ou <b>Edge</b>.
          </div>
        )}

        {/* Cards */}
        <div className="grid gap-4">
          {/* Card 1: USB */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold">1) Placa USB</div>
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

          {/* Card 2: Devices */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold">2) Dispositivos</div>
                <div className="mt-1 text-sm text-white/70">
                  Ligue os equipamentos e espere aparecer "Online".
                </div>
              </div>
              <Selo
                texto={`${onlineCount}/4 online`}
                tipo={onlineCount === 4 ? "verde" : onlineCount > 0 ? "amarelo" : "neutro"}
              />
            </div>

            <div className="mt-4 space-y-3">
              {lista.map((eq) => {
                const online = eq.online;
                const stale = eq.stale;
                const corIcone = eq.cor === "azul" ? "text-blue-200" : "text-red-200";
                const Icon = eq.tipo === "colete" ? VestIcon : HelmetIcon;

                return (
                  <div
                    key={eq.id}
                    className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-3 ring-1 ring-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <BolinhaStatus ok={online} alerta={stale} />
                      <Icon className={corIcone} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">{eq.nome}</div>
                        <div className="text-xs text-white/60">
                          {online ? "Online" : stale ? "Sem sinal..." : "Aguardando..."}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {online ? (
                        <>
                          <Selo texto="Online" tipo="verde" />
                          <IndicadorBateria porcentagem={eq.bateria} />
                        </>
                      ) : (
                        <Selo texto={stale ? "Sem sinal" : "Aguardando"} tipo={stale ? "amarelo" : "neutro"} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-xs text-white/50">
              Dica: se algum item ficar em "Sem sinal…", desligue e ligue o equipamento novamente.
            </div>
          </div>
        </div>

        {/* Footer / CTA */}
        <div className="mt-auto pt-6">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
            {prontoTotal ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex items-center gap-2 text-emerald-200">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-lg font-semibold">TUDO PRONTO!</span>
                </div>
                <button
                  type="button"
                  onClick={onContinue}
                  className="w-full max-w-md min-h-12 rounded-2xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  Continuar →
                </button>
              </div>
            ) : prontoMinimo ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="text-sm text-amber-200">
                  Falta(m) {4 - onlineCount} equipamento(s). Você pode continuar mesmo assim.
                </div>
                <button
                  type="button"
                  onClick={onContinue}
                  className="w-full max-w-md min-h-12 rounded-2xl bg-white/10 px-4 py-3 text-base font-semibold text-white ring-1 ring-white/10 hover:bg-white/15"
                >
                  Continuar mesmo assim →
                </button>
                <button
                  type="button"
                  onClick={onSkip}
                  className="text-xs text-white/60 underline hover:text-white/80"
                >
                  Pular e usar teclado (modo teste)
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="text-sm text-white/70">
                  Conecte a placa USB e ligue os equipamentos para começar.
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
