import { useState, useEffect, useRef, useCallback } from 'react';
import { X, RotateCcw, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

// ─── Equipment Image Components ───

const EQUIPMENT_IMAGES = {
  helmet: { blue: imgCapaceteAzul, red: imgCapaceteVermelho },
  vest: { blue: imgColeteAzul, red: imgColeteVermelho },
} as const;

function EquipmentImage({ type, side, isHit, tested }: { type: 'helmet' | 'vest'; side: 'blue' | 'red'; isHit: boolean; tested: boolean }) {
  const img = EQUIPMENT_IMAGES[type][side];
  const glowColor = side === 'blue' ? 'rgba(59,130,246,0.5)' : 'rgba(239,68,68,0.5)';
  const maxW = type === 'helmet' ? 'max-w-[180px]' : 'max-w-[200px]';

  return (
    <div className="relative">
      <img
        src={img}
        alt={`${type === 'helmet' ? 'Capacete' : 'Colete'} ${side === 'blue' ? 'Azul' : 'Vermelho'}`}
        className={cn(
          "w-full h-auto object-contain transition-all duration-200",
          maxW,
          isHit && "animate-pulse brightness-125"
        )}
        style={isHit ? { filter: `drop-shadow(0 0 20px ${glowColor}) drop-shadow(0 0 40px ${glowColor}) brightness(1.25)` } : undefined}
        draggable={false}
      />
      {/* Tested checkmark */}
      {tested && (
        <div className="absolute top-0 right-0 bg-green-500 rounded-full w-7 h-7 flex items-center justify-center shadow-lg">
          <Check className="w-4 h-4 text-white" strokeWidth={3} />
        </div>
      )}
    </div>
  );
}

// ─── Impact Indicator Dots ───

function ImpactDots({ hits, maxDots = 5 }: { hits: number; maxDots?: number }) {
  return (
    <div className="flex gap-1.5 justify-center my-2">
      {Array.from({ length: maxDots }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-4 h-4 rounded-full transition-all duration-300",
            i < hits
              ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"
              : "bg-zinc-700"
          )}
        />
      ))}
    </div>
  );
}

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
      // Process only new hits
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

  const handleReset = () => {
    setDevices({
      1: { lastHitTs: 0, lastIntensity: 0, hitCount: 0, tested: false },
      2: { lastHitTs: 0, lastIntensity: 0, hitCount: 0, tested: false },
      3: { lastHitTs: 0, lastIntensity: 0, hitCount: 0, tested: false },
      4: { lastHitTs: 0, lastIntensity: 0, hitCount: 0, tested: false },
    });
    processedCountRef.current = 0;
    onReset?.();
  };

  const now = Date.now();
  const isHit = (deviceId: number) => now - devices[deviceId].lastHitTs < 1200;
  const testedCount = Object.values(devices).filter(d => d.tested).length;
  const allTested = testedCount >= 4;

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a14] flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <header className="h-16 bg-[hsl(var(--sulsport-dark))] border-b border-zinc-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <img src={logoSpe} alt="SPE" className="h-7 w-auto" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-[0.15em] uppercase">
          TESTE HARDWARE
        </h1>
        <div className="flex items-center gap-3">
          {/* Status badge */}
          <div className={cn(
            "px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider",
            allTested
              ? "bg-green-500/20 text-green-400 border border-green-500/40"
              : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
          )}>
            {allTested ? (
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> PRONTO</span>
            ) : (
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4" /> {testedCount}/4</span>
            )}
          </div>
          {!hideControls && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Fechar (ESC)"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-[1200px] grid grid-cols-[1fr_auto_1fr] gap-6 items-center">
          {/* ── BLUE Side ── */}
          <div className="flex flex-col items-center gap-4">
            {/* Athlete Name */}
            <div className="text-center">
              <span className="text-lg font-bold text-blue-400 uppercase tracking-wider">
                {athleteBlue || 'CHUNG (AZUL)'}
              </span>
            </div>

            {/* Helmet Blue (ID 4 — helmets are inverted in EngFlex hardware) */}
            <div className={cn(
              "relative p-2 rounded-2xl transition-all duration-300",
              isHit(4) && "bg-blue-500/10 shadow-[0_0_40px_rgba(59,130,246,0.3)]"
            )}>
              <EquipmentImage type="helmet" side="blue" isHit={isHit(4)} tested={devices[4].tested} />
              <ImpactDots hits={Math.min(devices[4].hitCount, 5)} />
              {isHit(4) && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
                  {devices[4].lastIntensity}
                </div>
              )}
              <div className="text-center text-xs text-zinc-500 font-bold uppercase">Capacete</div>
            </div>

            {/* Vest Blue (ID 1) */}
            <div className={cn(
              "relative p-2 rounded-2xl transition-all duration-300",
              isHit(1) && "bg-blue-500/10 shadow-[0_0_40px_rgba(59,130,246,0.3)]"
            )}>
              <EquipmentImage type="vest" side="blue" isHit={isHit(1)} tested={devices[1].tested} />
              <ImpactDots hits={Math.min(devices[1].hitCount, 5)} />
              {isHit(1) && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
                  {devices[1].lastIntensity}
                </div>
              )}
              <div className="text-center text-xs text-zinc-500 font-bold uppercase">Protetor de Tronco</div>
            </div>
          </div>

          {/* ── CENTER Divider ── */}
          <div className="flex flex-col items-center gap-6 self-center">
            <div className="w-px h-20 bg-gradient-to-b from-transparent via-zinc-600 to-transparent" />
            <span className="text-zinc-600 text-sm font-bold tracking-widest uppercase">VS</span>
            <div className="w-px h-20 bg-gradient-to-b from-transparent via-zinc-600 to-transparent" />
          </div>

          {/* ── RED Side ── */}
          <div className="flex flex-col items-center gap-4">
            {/* Athlete Name */}
            <div className="text-center">
              <span className="text-lg font-bold text-red-400 uppercase tracking-wider">
                {athleteRed || 'HONG (VERMELHO)'}
              </span>
            </div>

            {/* Helmet Red (ID 3 — helmets are inverted in EngFlex hardware) */}
            <div className={cn(
              "relative p-2 rounded-2xl transition-all duration-300",
              isHit(3) && "bg-red-500/10 shadow-[0_0_40px_rgba(239,68,68,0.3)]"
            )}>
              <EquipmentImage type="helmet" side="red" isHit={isHit(3)} tested={devices[3].tested} />
              <ImpactDots hits={Math.min(devices[3].hitCount, 5)} />
              {isHit(3) && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
                  {devices[3].lastIntensity}
                </div>
              )}
              <div className="text-center text-xs text-zinc-500 font-bold uppercase">Capacete</div>
            </div>

            {/* Vest Red (ID 2) */}
            <div className={cn(
              "relative p-2 rounded-2xl transition-all duration-300",
              isHit(2) && "bg-red-500/10 shadow-[0_0_40px_rgba(239,68,68,0.3)]"
            )}>
              <EquipmentImage type="vest" side="red" isHit={isHit(2)} tested={devices[2].tested} />
              <ImpactDots hits={Math.min(devices[2].hitCount, 5)} />
              {isHit(2) && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
                  {devices[2].lastIntensity}
                </div>
              )}
              <div className="text-center text-xs text-zinc-500 font-bold uppercase">Protetor de Tronco</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with reset */}
      {!hideControls && (
        <footer className="h-16 bg-[hsl(var(--sulsport-dark))] border-t border-zinc-800 flex items-center justify-center gap-4 px-6 shrink-0">
          <Button
            onClick={handleReset}
            className="h-10 px-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-bold uppercase text-sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            RESETAR
          </Button>
          <Button
            onClick={onClose}
            className="h-10 px-8 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold uppercase text-sm"
          >
            <Check className="w-4 h-4 mr-2" />
            CONCLUIR TESTE
          </Button>
        </footer>
      )}
    </div>
  );
}
