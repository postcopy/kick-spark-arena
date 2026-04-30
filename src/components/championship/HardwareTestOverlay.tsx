import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { HardwareTestHit } from '@/types/championship';
import logoSpe from '@/assets/logo-spe-branca.png';
import imgCapaceteAzul from '@/assets/capacete-azul.png';
import imgCapaceteVermelho from '@/assets/capacete-vermelho.png';
import imgColeteAzul from '@/assets/colete-azul.png';
import imgColeteVermelho from '@/assets/colete-vermelho.png';

// ───────────────────────────────────────────────────────────────────
// AURORA — Teste de equipamento (versão TV-friendly)
// 3 estados por quadrante:
//   IDLE      — fundo escuro, equipamento iluminado, aura sutil
//   VERIFIED  — quadrante fica permanentemente azul/vermelho saturado
//   HIT       — pulso branco + ondas concêntricas + "HIT" gigante (700ms)
// ───────────────────────────────────────────────────────────────────

interface DeviceHitState {
  lastHitTs: number;
  lastIntensity: number;
  hitCount: number;
  tested: boolean;
}

interface HardwareTestOverlayProps {
  onClose: () => void;
  onReset?: () => void;
  /** External hits (from BroadcastChannel on TV side) */
  externalHits?: HardwareTestHit[];
  /** Direct impact callback (operator side) */
  onRegisterHitCallback?: (cb: (hit: HardwareTestHit) => void) => void;
  athleteBlue?: string;
  athleteRed?: string;
  /** Hide close button (TV mode) */
  hideControls?: boolean;
}

type Side = 'blue' | 'red';
type Kind = 'helmet' | 'vest';
type Slot = 'top' | 'bottom';

interface EquipmentSlot {
  deviceId: number;
  side: Side;
  kind: Kind;
  /** Posição visual no grid 2x2 */
  gridSide: 'left' | 'right';
  gridSlot: Slot;
  /** Hotkey simulada (1-4) */
  hotkey: '1' | '2' | '3' | '4';
}

// Layout: capacetes em cima, coletes embaixo. CHUNG (azul) à esquerda, HONG (vermelho) à direita.
// EngFlex IDs: 1=blue vest, 2=red vest, 3=blue helmet, 4=red helmet (odd=blue, even=red).
const EQUIPMENT_ORDER: EquipmentSlot[] = [
  { deviceId: 3, side: 'blue', kind: 'helmet', gridSide: 'left', gridSlot: 'top', hotkey: '1' },
  { deviceId: 4, side: 'red', kind: 'helmet', gridSide: 'right', gridSlot: 'top', hotkey: '3' },
  { deviceId: 1, side: 'blue', kind: 'vest', gridSide: 'left', gridSlot: 'bottom', hotkey: '2' },
  { deviceId: 2, side: 'red', kind: 'vest', gridSide: 'right', gridSlot: 'bottom', hotkey: '4' },
];

const EQUIPMENT_IMAGES = {
  helmet: { blue: imgCapaceteAzul, red: imgCapaceteVermelho },
  vest: { blue: imgColeteAzul, red: imgColeteVermelho },
} as const;

const DEVICE_FRIENDLY_LABEL: Record<number, string> = {
  1: 'Colete do atleta azul',
  2: 'Colete do atleta vermelho',
  3: 'Capacete do atleta azul',
  4: 'Capacete do atleta vermelho',
};

// Hotkey 1-4 → deviceId, alinhado com gridSide+gridSlot:
//   1 = top-left  (capacete azul = dev 3)
//   2 = bottom-left (colete azul = dev 1)
//   3 = top-right (capacete vermelho = dev 4)
//   4 = bottom-right (colete vermelho = dev 2)
const KEY_TO_DEVICE: Record<string, number> = {
  '1': 3,
  '2': 1,
  '3': 4,
  '4': 2,
};

// Slot index visual (1..4) baseado em gridSide+gridSlot:
//   left/top=1, left/bottom=2, right/top=3, right/bottom=4
function slotIndexOf(s: EquipmentSlot): number {
  if (s.gridSide === 'left') return s.gridSlot === 'top' ? 1 : 2;
  return s.gridSlot === 'top' ? 3 : 4;
}

// ───────────────────────────────────────────────────────────────────
// AuroraQuadrant — um dos 4 quadrantes
// ───────────────────────────────────────────────────────────────────

interface AuroraQuadrantProps {
  slot: EquipmentSlot;
  hitCount: number;
  isHit: boolean;
  onHit: () => void;
  disabled?: boolean;
}

function AuroraQuadrant({ slot, hitCount, isHit, onHit, disabled }: AuroraQuadrantProps) {
  const isBlue = slot.side === 'blue';
  const corner = isBlue ? 'CHUNG' : 'HONG';
  const label = slot.kind === 'helmet' ? 'CAPACETE' : 'COLETE';
  const image = EQUIPMENT_IMAGES[slot.kind][slot.side];
  const slotIndex = slotIndexOf(slot);

  const accent = isBlue ? '#1E5BD6' : '#D6213A';
  const accentGlow = isBlue ? '59,130,246' : '239,68,68';
  const accentLight = isBlue ? '#60A5FA' : '#F87171';

  const isVerified = hitCount > 0;

  // Backgrounds por estado
  const idleBg = `radial-gradient(circle at center, ${
    isBlue ? 'rgba(30,91,214,0.18)' : 'rgba(214,33,58,0.18)'
  } 0%, #050507 70%)`;
  const verifiedBg = `radial-gradient(circle at center, ${accent} 0%, ${
    isBlue ? '#0E2A6E' : '#5C0F1C'
  } 75%, ${isBlue ? '#071534' : '#2C0710'} 100%)`;
  const hitBg = `radial-gradient(circle at center, ${accentLight} 0%, ${accent} 50%, ${
    isBlue ? '#0E2A6E' : '#5C0F1C'
  } 100%)`;

  return (
    <div
      onClick={() => !disabled && onHit()}
      className={cn(
        'relative w-full h-full overflow-hidden select-none',
        !disabled && 'cursor-pointer',
      )}
      style={{
        background: isHit ? hitBg : isVerified ? verifiedBg : idleBg,
        transition: isHit
          ? 'background 80ms linear'
          : 'background 500ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Flash + ondas concêntricas durante o HIT */}
      {isHit && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at center, rgba(255,255,255,0.45) 0%, transparent 50%)',
              mixBlendMode: 'screen',
              animation: 'auroraFlash 600ms ease-out forwards',
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
            style={{
              width: 100,
              height: 100,
              marginLeft: -50,
              marginTop: -50,
              border: `4px solid ${accentLight}`,
              animation: 'auroraRing 800ms ease-out forwards',
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
            style={{
              width: 100,
              height: 100,
              marginLeft: -50,
              marginTop: -50,
              border: `2px solid ${accentLight}`,
              animation: 'auroraRing 800ms 120ms ease-out forwards',
            }}
          />
        </>
      )}

      {/* Borda persistente — branca no hit, accent no verified, fraca no idle */}
      <div
        className="absolute pointer-events-none rounded-lg"
        style={{
          inset: 12,
          border: `2px solid ${
            isHit
              ? '#fff'
              : isVerified
              ? accentLight
              : isBlue
              ? 'rgba(59,130,246,0.25)'
              : 'rgba(239,68,68,0.25)'
          }`,
          boxShadow: isHit
            ? `0 0 60px rgba(${accentGlow},1), inset 0 0 100px rgba(255,255,255,0.25)`
            : isVerified
            ? `0 0 30px rgba(${accentGlow},0.5), inset 0 0 80px rgba(${accentGlow},0.18)`
            : `inset 0 0 80px rgba(${accentGlow},0.05)`,
          transition: isHit ? 'all 80ms linear' : 'all 500ms ease-out',
        }}
      />

      {/* Header: corner + label + slot index */}
      <div className="absolute top-7 left-9 right-9 flex items-start justify-between z-[4]">
        <div>
          <div
            className="font-mono font-bold tracking-[0.3em] transition-colors"
            style={{
              fontSize: 16,
              color: isHit || isVerified ? '#fff' : 'rgba(255,255,255,0.55)',
            }}
          >
            {corner}
          </div>
          <div
            className="font-black text-white"
            style={{
              fontSize: 56,
              letterSpacing: '0.04em',
              lineHeight: 0.95,
              marginTop: 4,
              textShadow: isHit ? `0 0 30px rgba(${accentGlow},0.9)` : 'none',
            }}
          >
            {label}
          </div>
        </div>
        <div
          className="flex items-center justify-center font-mono font-extrabold text-white rounded-lg"
          style={{
            width: 64,
            height: 64,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            fontSize: 32,
          }}
        >
          {slotIndex}
        </div>
      </div>

      {/* Equipamento centralizado */}
      <div className="absolute inset-0 flex items-center justify-center z-[2]">
        <img
          src={image}
          alt={`${label} ${corner}`}
          draggable={false}
          style={{
            maxWidth: '55%',
            maxHeight: '70%',
            objectFit: 'contain',
            filter: isHit
              ? `drop-shadow(0 0 60px rgba(255,255,255,0.9)) drop-shadow(0 0 120px rgba(${accentGlow},1)) brightness(1.2)`
              : isVerified
              ? `drop-shadow(0 0 40px rgba(${accentGlow},0.8)) drop-shadow(0 8px 30px rgba(0,0,0,0.5)) brightness(1.05)`
              : 'drop-shadow(0 8px 30px rgba(0,0,0,0.6))',
            transform: isHit ? 'scale(1.06)' : 'scale(1)',
            transition: isHit ? 'all 80ms ease-out' : 'all 500ms cubic-bezier(0.34,1.56,0.64,1)',
          }}
        />
      </div>

      {/* "HIT" gigante durante o impacto */}
      {isHit && (
        <div
          className="absolute top-1/2 left-1/2 font-black text-white pointer-events-none z-[3]"
          style={{
            transform: 'translate(-50%, -50%)',
            fontSize: 220,
            letterSpacing: '0.04em',
            textShadow: `0 0 80px rgba(255,255,255,0.7), 0 0 40px rgba(${accentGlow},1)`,
            animation: 'auroraHitText 600ms cubic-bezier(0.34,1.56,0.64,1) forwards',
            lineHeight: 1,
          }}
        >
          HIT
        </div>
      )}

      {/* Footer: contador + status */}
      <div className="absolute bottom-7 left-9 right-9 flex items-end justify-between z-[4]">
        <div>
          <div
            className="font-mono font-bold tracking-[0.3em]"
            style={{
              fontSize: 13,
              color: isVerified ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)',
            }}
          >
            HITS DETECTADOS
          </div>
          <div
            className="font-mono font-black tabular-nums"
            style={{
              fontSize: 88,
              color: hitCount > 0 ? '#fff' : 'rgba(255,255,255,0.3)',
              lineHeight: 1,
              marginTop: 2,
              textShadow: isHit ? `0 0 30px rgba(${accentGlow},0.9)` : 'none',
            }}
          >
            {String(hitCount).padStart(2, '0')}
          </div>
        </div>
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-md"
          style={{
            background: hitCount > 0 ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${
              hitCount > 0 ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.15)'
            }`,
          }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: hitCount > 0 ? '#22C55E' : '#64748B',
              boxShadow: hitCount > 0 ? '0 0 12px rgba(34,197,94,0.9)' : 'none',
            }}
          />
          <span
            className="font-mono font-bold tracking-[0.2em]"
            style={{
              fontSize: 14,
              color: hitCount > 0 ? '#86EFAC' : 'rgba(255,255,255,0.55)',
            }}
          >
            {hitCount > 0 ? 'OK' : 'AGUARDANDO'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// HardwareTestOverlay — wrapper com a mesma assinatura do anterior
// ───────────────────────────────────────────────────────────────────

export function HardwareTestOverlay({
  onClose,
  onReset,
  externalHits,
  onRegisterHitCallback,
  athleteBlue,
  athleteRed,
  hideControls = false,
}: HardwareTestOverlayProps) {
  const [devices, setDevices] = useState<Record<number, DeviceHitState>>({
    1: { lastHitTs: 0, lastIntensity: 0, hitCount: 0, tested: false },
    2: { lastHitTs: 0, lastIntensity: 0, hitCount: 0, tested: false },
    3: { lastHitTs: 0, lastIntensity: 0, hitCount: 0, tested: false },
    4: { lastHitTs: 0, lastIntensity: 0, hitCount: 0, tested: false },
  });

  const [, forceRender] = useState(0);
  const testedNotifiedRef = useRef<Set<number>>(new Set());
  const allTestedNotifiedRef = useRef(false);

  const handleHit = useCallback((hit: HardwareTestHit) => {
    if (hit.deviceId < 1 || hit.deviceId > 4) return;
    setDevices((prev) => ({
      ...prev,
      [hit.deviceId]: {
        lastHitTs: hit.ts || Date.now(),
        lastIntensity: hit.intensity,
        hitCount: prev[hit.deviceId].hitCount + 1,
        tested: true,
      },
    }));
  }, []);

  useEffect(() => {
    onRegisterHitCallback?.(handleHit);
  }, [onRegisterHitCallback, handleHit]);

  const processedCountRef = useRef(0);
  useEffect(() => {
    if (!externalHits || externalHits.length === 0) return;
    if (externalHits.length > processedCountRef.current) {
      const newHits = externalHits.slice(processedCountRef.current);
      newHits.forEach(handleHit);
      processedCountRef.current = externalHits.length;
    }
  }, [externalHits, handleHit]);

  // Auto-refresh para o flash decair (700ms)
  useEffect(() => {
    const hasActiveFlash = Object.values(devices).some((d) => Date.now() - d.lastHitTs < 800);
    if (hasActiveFlash) {
      const timer = setTimeout(() => forceRender((n) => n + 1), 100);
      return () => clearTimeout(timer);
    }
  }, [devices]);

  // Toasts: por equipamento + final
  useEffect(() => {
    for (const [id, d] of Object.entries(devices)) {
      const deviceId = Number(id);
      if (d.tested && !testedNotifiedRef.current.has(deviceId)) {
        testedNotifiedRef.current.add(deviceId);
        toast.success(`${DEVICE_FRIENDLY_LABEL[deviceId]} funcionando!`);
      }
    }
    const allTested = Object.values(devices).every((d) => d.tested);
    if (allTested && !allTestedNotifiedRef.current) {
      allTestedNotifiedRef.current = true;
      toast.success('Tudo pronto! Boa luta.', { duration: 3500 });
    }
  }, [devices]);

  // Atalhos 1–4 (operador)
  useEffect(() => {
    if (hideControls) return;
    const onKey = (e: KeyboardEvent) => {
      const deviceId = KEY_TO_DEVICE[e.key];
      if (!deviceId) return;
      handleHit({
        deviceId,
        intensity: 40 + Math.floor(Math.random() * 55),
        ts: Date.now(),
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hideControls, handleHit]);

  const handleReset = () => {
    setDevices({
      1: { lastHitTs: 0, lastIntensity: 0, hitCount: 0, tested: false },
      2: { lastHitTs: 0, lastIntensity: 0, hitCount: 0, tested: false },
      3: { lastHitTs: 0, lastIntensity: 0, hitCount: 0, tested: false },
      4: { lastHitTs: 0, lastIntensity: 0, hitCount: 0, tested: false },
    });
    processedCountRef.current = 0;
    testedNotifiedRef.current.clear();
    allTestedNotifiedRef.current = false;
    onReset?.();
  };

  const now = Date.now();
  const isHitNow = (deviceId: number) => now - devices[deviceId].lastHitTs < 700;
  const testedCount = Object.values(devices).filter((d) => d.tested).length;
  const allOk = testedCount >= 4;
  const hasProgress = testedCount > 0;

  // athleteBlue/athleteRed mantidos pra compat — não usados na variante Aurora,
  // mas a prop continua na assinatura
  useMemo(() => ({ athleteBlue, athleteRed }), [athleteBlue, athleteRed]);

  // Helper pra encontrar slot por gridSide+gridSlot
  const slotAt = (gridSide: 'left' | 'right', gridSlot: Slot): EquipmentSlot =>
    EQUIPMENT_ORDER.find((s) => s.gridSide === gridSide && s.gridSlot === gridSlot)!;

  return (
    <div className="fixed inset-0 z-50 bg-[#050507] flex flex-col animate-in fade-in duration-300 font-sans text-white overflow-hidden">
      {/* keyframes inline — escopados a este overlay */}
      <style>{`
        @keyframes auroraFlash { 0% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes auroraRing {
          0%   { width: 100px;  height: 100px;  margin-left: -50px;  margin-top: -50px;  opacity: 1; }
          100% { width: 1600px; height: 1600px; margin-left: -800px; margin-top: -800px; opacity: 0; }
        }
        @keyframes auroraHitText {
          0%   { transform: translate(-50%, -50%) scale(0.4); opacity: 0; }
          30%  { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          70%  { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1);   opacity: 0; }
        }
      `}</style>

      {/* ── Header ── */}
      <header
        className="h-[68px] px-9 flex items-center justify-between border-b border-white/10 shrink-0 z-10"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-6">
          <img src={logoSpe} alt="SPE" className="h-5 opacity-95" draggable={false} />
          <div className="h-4 w-px bg-white/15" />
          <div className="font-mono font-bold tracking-[0.3em] text-white/85 uppercase text-base">
            Teste de equipamento
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* progress dots */}
          <div className="flex gap-2">
            {EQUIPMENT_ORDER.map((s) => {
              const ok = devices[s.deviceId].tested;
              return (
                <div
                  key={s.deviceId}
                  className="w-3 h-3 rounded-full transition-all"
                  style={{
                    background: ok ? '#22C55E' : 'rgba(255,255,255,0.15)',
                    boxShadow: ok ? '0 0 10px rgba(34,197,94,0.7)' : 'none',
                  }}
                />
              );
            })}
          </div>

          <div className="font-mono font-bold tracking-[0.2em] text-white/60 text-sm">
            {testedCount}/4 VERIFICADOS
          </div>

          {!hideControls && hasProgress && !allOk && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-[10px] font-bold tracking-[0.2em] text-white/90 border border-white/15 hover:bg-white/10"
                >
                  <RotateCcw className="w-3 h-3 mr-1.5" />
                  Começar de novo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[hsl(var(--sulsport-dark))] border-[hsl(var(--sulsport-gray))]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">
                    Zerar todos os testes?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-zinc-400">
                    Você vai precisar testar os 4 equipamentos novamente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReset}
                    className="bg-yellow-600 hover:bg-yellow-500 text-black"
                  >
                    Sim, começar de novo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {!hideControls && (
            <Button
              disabled={!allOk}
              onClick={onClose}
              className={cn(
                'h-9 px-4 rounded-md text-xs font-black tracking-[0.22em] uppercase transition-all',
                allOk
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_4px_18px_rgba(16,185,129,0.4)]'
                  : 'bg-white/5 text-white/40 cursor-not-allowed hover:bg-white/5',
              )}
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              {allOk ? 'Tudo pronto · Concluir' : 'Aguardando...'}
            </Button>
          )}

          {!hideControls && (
            <button
              onClick={onClose}
              className="ml-1 p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Fechar (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* ── Grid 2×2 ── */}
      <div className="flex-1 min-h-0 relative grid grid-cols-2 grid-rows-2">
        <AuroraQuadrant
          slot={slotAt('left', 'top')}
          hitCount={devices[slotAt('left', 'top').deviceId].hitCount}
          isHit={isHitNow(slotAt('left', 'top').deviceId)}
          onHit={() =>
            handleHit({
              deviceId: slotAt('left', 'top').deviceId,
              intensity: 40 + Math.floor(Math.random() * 55),
              ts: Date.now(),
            })
          }
          disabled={hideControls}
        />
        <AuroraQuadrant
          slot={slotAt('right', 'top')}
          hitCount={devices[slotAt('right', 'top').deviceId].hitCount}
          isHit={isHitNow(slotAt('right', 'top').deviceId)}
          onHit={() =>
            handleHit({
              deviceId: slotAt('right', 'top').deviceId,
              intensity: 40 + Math.floor(Math.random() * 55),
              ts: Date.now(),
            })
          }
          disabled={hideControls}
        />
        <AuroraQuadrant
          slot={slotAt('left', 'bottom')}
          hitCount={devices[slotAt('left', 'bottom').deviceId].hitCount}
          isHit={isHitNow(slotAt('left', 'bottom').deviceId)}
          onHit={() =>
            handleHit({
              deviceId: slotAt('left', 'bottom').deviceId,
              intensity: 40 + Math.floor(Math.random() * 55),
              ts: Date.now(),
            })
          }
          disabled={hideControls}
        />
        <AuroraQuadrant
          slot={slotAt('right', 'bottom')}
          hitCount={devices[slotAt('right', 'bottom').deviceId].hitCount}
          isHit={isHitNow(slotAt('right', 'bottom').deviceId)}
          onHit={() =>
            handleHit({
              deviceId: slotAt('right', 'bottom').deviceId,
              intensity: 40 + Math.floor(Math.random() * 55),
              ts: Date.now(),
            })
          }
          disabled={hideControls}
        />

        {/* divisor em cruz + VS */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 pointer-events-none" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 pointer-events-none" />
        <div
          className="absolute top-1/2 left-1/2 rounded-full flex items-center justify-center font-mono font-extrabold tracking-[0.1em] z-[5]"
          style={{
            transform: 'translate(-50%, -50%)',
            width: 88,
            height: 88,
            background: '#0A0A0F',
            border: '2px solid rgba(255,255,255,0.18)',
            fontSize: 22,
            color: 'rgba(255,255,255,0.65)',
          }}
        >
          VS
        </div>
      </div>

      {/* ── Footer hint ── */}
      {!hideControls && (
        <footer className="h-9 px-9 flex items-center justify-center bg-black/70 border-t border-white/5 shrink-0 z-10">
          <span className="font-mono font-semibold tracking-[0.25em] text-xs text-white/40 uppercase">
            Bata no equipamento ou clique / tecle 1–4 para simular
          </span>
        </footer>
      )}
    </div>
  );
}
