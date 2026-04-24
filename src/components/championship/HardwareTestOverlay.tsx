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

// ─── Types ───

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

// ─── Equipment ordering & metadata ───

type Side = 'blue' | 'red';
type Kind = 'helmet' | 'vest';

interface EquipmentSlot {
  deviceId: number;
  side: Side;
  kind: Kind;
}

// Presentation order (prototype): blue-helmet → blue-vest → red-helmet → red-vest.
// EngFlex hardware: helmets are inverted (blue helmet = device 4, red helmet = device 3).
const EQUIPMENT_ORDER: EquipmentSlot[] = [
  { deviceId: 4, side: 'blue', kind: 'helmet' },
  { deviceId: 1, side: 'blue', kind: 'vest' },
  { deviceId: 3, side: 'red', kind: 'helmet' },
  { deviceId: 2, side: 'red', kind: 'vest' },
];

const EQUIPMENT_IMAGES = {
  helmet: { blue: imgCapaceteAzul, red: imgCapaceteVermelho },
  vest: { blue: imgColeteAzul, red: imgColeteVermelho },
} as const;

const DEVICE_FRIENDLY_LABEL: Record<number, string> = {
  1: 'Colete do atleta azul',
  2: 'Colete do atleta vermelho',
  3: 'Capacete do atleta vermelho',
  4: 'Capacete do atleta azul',
};

// Keyboard 1-4 → deviceId (same order as EQUIPMENT_ORDER)
const KEY_TO_DEVICE: Record<string, number> = {
  '1': 4,
  '2': 1,
  '3': 3,
  '4': 2,
};

const SIDE_COLOR = {
  blue: { text: 'text-blue-400', ring: 'ring-blue-500/40', glow: 'rgba(59,130,246,0.55)', dot: 'bg-blue-500' },
  red: { text: 'text-red-400', ring: 'ring-red-500/40', glow: 'rgba(239,68,68,0.55)', dot: 'bg-red-500' },
} as const;

// ─── Main Component ───

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

  // Handle incoming hit
  const handleHit = useCallback((hit: HardwareTestHit) => {
    if (hit.deviceId < 1 || hit.deviceId > 4) return;
    setDevices(prev => ({
      ...prev,
      [hit.deviceId]: {
        lastHitTs: hit.ts || Date.now(),
        lastIntensity: hit.intensity,
        hitCount: prev[hit.deviceId].hitCount + 1,
        tested: true,
      },
    }));
  }, []);

  // Register callback for direct hits (operator side)
  useEffect(() => {
    onRegisterHitCallback?.(handleHit);
  }, [onRegisterHitCallback, handleHit]);

  // Process external hits (TV side via BroadcastChannel)
  const processedCountRef = useRef(0);
  useEffect(() => {
    if (!externalHits || externalHits.length === 0) return;
    if (externalHits.length > processedCountRef.current) {
      const newHits = externalHits.slice(processedCountRef.current);
      newHits.forEach(handleHit);
      processedCountRef.current = externalHits.length;
    }
  }, [externalHits, handleHit]);

  // Auto-refresh for flash decay
  useEffect(() => {
    const hasActiveFlash = Object.values(devices).some(d => Date.now() - d.lastHitTs < 1200);
    if (hasActiveFlash) {
      const timer = setTimeout(() => forceRender(n => n + 1), 100);
      return () => clearTimeout(timer);
    }
  }, [devices, forceRender]);

  // Toast feedback on first-time verification per device and when all 4 are tested
  useEffect(() => {
    for (const [id, d] of Object.entries(devices)) {
      const deviceId = Number(id);
      if (d.tested && !testedNotifiedRef.current.has(deviceId)) {
        testedNotifiedRef.current.add(deviceId);
        toast.success(`${DEVICE_FRIENDLY_LABEL[deviceId]} funcionando!`);
      }
    }
    const allTested = Object.values(devices).every(d => d.tested);
    if (allTested && !allTestedNotifiedRef.current) {
      allTestedNotifiedRef.current = true;
      toast.success('Tudo pronto! Boa luta.', { duration: 3500 });
    }
  }, [devices]);

  // Keyboard shortcuts 1-4 (operator only) — simulates a hit with random intensity
  useEffect(() => {
    if (hideControls) return;
    const onKey = (e: KeyboardEvent) => {
      const deviceId = KEY_TO_DEVICE[e.key];
      if (!deviceId) return;
      handleHit({ deviceId, intensity: 40 + Math.floor(Math.random() * 55), ts: Date.now() });
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
  const isHit = (deviceId: number) => now - devices[deviceId].lastHitTs < 1200;
  const testedCount = Object.values(devices).filter(d => d.tested).length;
  const allOk = testedCount >= 4;
  const hasProgress = testedCount > 0;

  // Focus = first not-yet-tested slot in presentation order
  const focusIdx = EQUIPMENT_ORDER.findIndex(slot => !devices[slot.deviceId].tested);
  const focusSlot = focusIdx >= 0 ? EQUIPMENT_ORDER[focusIdx] : null;

  const sideName = useMemo(
    () => ({
      blue: athleteBlue || 'CHUNG (azul)',
      red: athleteRed || 'HONG (vermelho)',
    }),
    [athleteBlue, athleteRed],
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0f] flex flex-col animate-in fade-in duration-300">
      {/* ── Top chrome ── */}
      <header className="h-14 px-5 flex items-center justify-between border-b border-white/5 bg-[#0a0a0f] shrink-0">
        <div className="flex items-center gap-3.5">
          <img src={logoSpe} alt="SPE" className="h-5 opacity-95" draggable={false} />
          <div className="h-4 w-px bg-white/10" />
          <div className="text-[11px] font-bold tracking-[0.28em] text-white/75 uppercase">
            Teste de equipamento
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-mono tracking-[0.14em] text-white/50 uppercase">
            {testedCount}/4 verificados
          </div>
          {!hideControls && hasProgress && !allOk && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-3 text-[10px] font-bold tracking-[0.2em] text-white/90 border border-white/15 hover:bg-white/10"
                  title="Começar de novo"
                >
                  <RotateCcw className="w-3 h-3 mr-1.5" />
                  Começar de novo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-wt-bg-secondary border-wt-divider rounded-none">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Zerar todos os testes?</AlertDialogTitle>
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
                'h-9 px-4 rounded-lg text-xs font-black tracking-[0.22em] uppercase transition-all',
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

      {/* ── Big instruction banner ── */}
      <section
        className={cn(
          'px-7 py-4 flex items-center gap-4 border-b shrink-0 transition-colors',
          allOk
            ? 'bg-emerald-500/10 border-emerald-500/25'
            : 'bg-amber-400/[0.06] border-amber-400/20',
        )}
      >
        {allOk ? (
          <>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500 flex items-center justify-center shrink-0">
              <Check className="w-6 h-6 text-emerald-400" strokeWidth={3} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black tracking-[0.3em] text-emerald-400 uppercase">
                Tudo pronto!
              </div>
              <div className="text-lg font-bold text-white mt-0.5 leading-tight">
                Todos os equipamentos estão funcionando. Os atletas podem subir no tatame.
              </div>
            </div>
            <div className="text-[10px] font-mono tracking-[0.12em] text-white/50 uppercase text-right shrink-0">
              Pode prosseguir
              <br />
              para a luta
            </div>
          </>
        ) : focusSlot ? (
          <>
            <div
              className={cn(
                'w-11 h-11 rounded-xl border flex items-center justify-center shrink-0',
                focusSlot.side === 'blue'
                  ? 'bg-blue-500/15 border-blue-500'
                  : 'bg-red-500/15 border-red-500',
              )}
            >
              <div
                className={cn(
                  'text-[22px] font-mono font-black',
                  focusSlot.side === 'blue' ? 'text-blue-400' : 'text-red-400',
                )}
              >
                {focusIdx + 1}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black tracking-[0.3em] text-amber-400 uppercase">
                Passo {focusIdx + 1} de 4
              </div>
              <div className="text-lg font-bold text-white mt-0.5 leading-tight">
                Atleta{' '}
                <strong className={focusSlot.side === 'blue' ? 'text-blue-400' : 'text-red-400'}>
                  {sideName[focusSlot.side]}
                </strong>
                : dê um chutinho no{' '}
                <strong className="text-amber-400">
                  {focusSlot.kind === 'helmet' ? 'capacete' : 'colete'}
                </strong>
                .
              </div>
            </div>
            <div className="text-[9px] font-mono tracking-[0.12em] text-white/50 uppercase text-right shrink-0">
              O equipamento acende
              <br />
              automaticamente na TV
            </div>
          </>
        ) : null}
      </section>

      {/* ── 4 cards side-by-side ── */}
      <div className="flex-1 min-h-0 grid grid-cols-4 gap-3 p-5">
        {EQUIPMENT_ORDER.map((slot, i) => {
          const d = devices[slot.deviceId];
          const isFocus = focusSlot?.deviceId === slot.deviceId;
          const isDim = !isFocus && !d.tested;
          const active = isHit(slot.deviceId);
          const img = EQUIPMENT_IMAGES[slot.kind][slot.side];
          const sideColor = SIDE_COLOR[slot.side];

          const onClickCard = () => {
            if (hideControls || d.tested) return;
            handleHit({
              deviceId: slot.deviceId,
              intensity: 40 + Math.floor(Math.random() * 55),
              ts: Date.now(),
            });
          };

          return (
            <div
              key={slot.deviceId}
              onClick={onClickCard}
              className={cn(
                'relative rounded-2xl p-4 flex flex-col gap-2.5 transition-all duration-300 overflow-hidden border-2',
                !hideControls && !d.tested && 'cursor-pointer',
                d.tested && 'border-emerald-500 bg-gradient-to-b from-emerald-500/10 to-emerald-500/[0.02]',
                !d.tested && isFocus && 'border-amber-400 bg-gradient-to-b from-white/[0.04] to-transparent shadow-[0_0_0_4px_rgba(250,204,21,0.15)]',
                !d.tested && !isFocus && 'border-white/5 bg-white/[0.02]',
                isDim && 'opacity-55',
                active && !d.tested && sideColor.ring,
              )}
            >
              {/* Card header: step + side + type + status dot */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-[26px] h-[26px] rounded-md flex items-center justify-center font-mono text-[13px] font-black',
                      d.tested && 'bg-emerald-500 text-zinc-950',
                      !d.tested && isFocus && 'bg-amber-400 text-zinc-950',
                      !d.tested && !isFocus && 'bg-white/10 text-white/60',
                    )}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div className={cn('text-[9px] font-black tracking-[0.3em] uppercase', sideColor.text)}>
                      {slot.side === 'blue' ? 'Chung' : 'Hong'}
                    </div>
                    <div className="text-sm font-bold text-white tracking-wide">
                      {slot.kind === 'helmet' ? 'CAPACETE' : 'COLETE'}
                    </div>
                  </div>
                </div>
                {d.tested ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />
                  </div>
                ) : (
                  <div
                    className={cn(
                      'w-2.5 h-2.5 rounded-full shrink-0 mt-1.5',
                      isFocus ? 'bg-amber-400 animate-pulse' : 'bg-white/15',
                    )}
                  />
                )}
              </div>

              {/* Equipment image with glow */}
              <div className="flex-1 min-h-0 flex items-center justify-center relative">
                <img
                  src={img}
                  alt={`${slot.kind === 'helmet' ? 'Capacete' : 'Colete'} ${slot.side === 'blue' ? 'azul' : 'vermelho'}`}
                  className={cn(
                    'max-w-[80%] max-h-full object-contain transition-[filter] duration-300',
                    active && 'animate-pulse',
                  )}
                  style={{
                    filter: d.tested
                      ? 'drop-shadow(0 0 18px rgba(16,185,129,0.55))'
                      : isFocus
                      ? `drop-shadow(0 0 18px ${sideColor.glow})`
                      : 'none',
                  }}
                  draggable={false}
                />
                {/* Ripple on verify */}
                {d.tested && (
                  <div
                    key={d.lastHitTs}
                    className="absolute inset-0 pointer-events-none flex items-center justify-center"
                  >
                    <div className="w-[160px] h-[160px] rounded-full border-[3px] border-emerald-500 animate-[spe-ring_1.1s_ease-out_forwards]" />
                  </div>
                )}
                {/* Intensity badge while active */}
                {active && !d.tested && (
                  <div
                    className={cn(
                      'absolute top-0 right-0 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce',
                      sideColor.dot,
                    )}
                  >
                    {d.lastIntensity}
                  </div>
                )}
              </div>

              {/* Card footer: status label */}
              {d.tested ? (
                <div className="text-[11px] font-black tracking-[0.28em] text-emerald-400 text-center py-2 bg-emerald-500/10 rounded-md font-mono">
                  ● Verificado · força {d.lastIntensity}
                </div>
              ) : (
                <div
                  className={cn(
                    'text-[10px] font-bold tracking-[0.25em] text-center py-2 uppercase',
                    isFocus ? 'text-amber-400' : 'text-white/40',
                  )}
                >
                  {isFocus ? 'Aguardando chutinho...' : 'Aguarda'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Progress bar at bottom ── */}
      <footer className="h-[52px] px-7 flex items-center gap-4 bg-[#0F0F18] border-t border-white/5 shrink-0">
        <div className="text-[10px] font-bold tracking-[0.3em] text-white/50 uppercase shrink-0">
          Progresso
        </div>
        <div className="flex-1 flex gap-2 items-center">
          {EQUIPMENT_ORDER.map((slot, i) => {
            const d = devices[slot.deviceId];
            const isFoc = focusSlot?.deviceId === slot.deviceId;
            const prev = i > 0 ? devices[EQUIPMENT_ORDER[i - 1].deviceId] : null;
            return (
              <div key={slot.deviceId} className="flex items-center gap-2 flex-1 last:flex-none">
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={cn(
                      'w-[22px] h-[22px] rounded-full flex items-center justify-center font-mono text-[11px] font-black',
                      d.tested && 'bg-emerald-500 text-zinc-950',
                      !d.tested && isFoc && 'bg-amber-400 text-zinc-950',
                      !d.tested && !isFoc && 'bg-white/10 text-white/45',
                    )}
                  >
                    {d.tested ? '✓' : i + 1}
                  </div>
                  <div
                    className={cn(
                      'text-[9px] font-bold tracking-[0.2em] uppercase',
                      d.tested ? 'text-emerald-400' : isFoc ? 'text-amber-400' : 'text-white/50',
                    )}
                  >
                    {slot.side === 'blue' ? 'Azul' : 'Verm'}{' '}
                    {slot.kind === 'helmet' ? 'Cap' : 'Col'}
                  </div>
                </div>
                {i < EQUIPMENT_ORDER.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 rounded-sm transition-colors',
                      prev && d.tested ? 'bg-emerald-500' : 'bg-white/5',
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
        {!hideControls && (
          <div className="text-[9px] font-mono tracking-[0.12em] text-white/40 uppercase shrink-0">
            Clique ou tecle 1-4
          </div>
        )}
      </footer>
    </div>
  );
}
