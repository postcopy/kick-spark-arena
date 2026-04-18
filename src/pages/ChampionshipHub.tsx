// Championship Hub — tela inicial amigável do modo BÁSICO.
// 3 botões principais (Começar luta / Testar equipamento / Mostrar na TV)
// + "Mais opções" colapsável com ajustes técnicos.

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Zap,
  Stethoscope,
  Monitor,
  Settings,
  Plug,
  HelpCircle,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import logoSpe from '@/assets/logo-spe-branca.png';

export default function ChampionshipHub() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const matId = parseInt(searchParams.get('mat') || '1');
  const mode = searchParams.get('mode') || 'basic';
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const matQuery = `mat=${matId}&mode=${mode}`;

  const startMatch = () => {
    toast.success('Modo básico iniciado. Boa luta!');
    navigate(`/championship/mat?${matQuery}`);
  };

  const openHardwareTest = () => {
    navigate(`/championship/mat?${matQuery}&openHwTest=1`);
  };

  const openTv = () => {
    window.open(`${window.location.origin}/#/championship/tv?mat=${matId}`, '_blank');
  };

  const openConfig = () => {
    navigate(`/championship/mat?${matQuery}&openConfig=1`);
  };

  const goToMatForHardware = () => {
    // Leva pro mat onde o painel de hardware (sidebar) fica visível.
    navigate(`/championship/mat?${matQuery}`);
  };

  const openHelp = () => {
    navigate('/help');
  };

  const todayLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#030305] flex flex-col relative overflow-hidden select-none">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,80,40,0.12),transparent)]" />
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm"
          title="Voltar"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <img src={logoSpe} alt="SPE Sulsport" className="h-6 opacity-90" />
        <div className="w-[72px]" aria-hidden />
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Greeting */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Olá! O que você quer fazer?
          </h1>
          <p className="text-zinc-500 text-sm tracking-wider">
            Mat {matId} · {todayLabel}
          </p>
        </div>

        {/* Main 3 buttons */}
        <div className="w-full max-w-[960px] grid grid-cols-1 md:grid-cols-[1.6fr_1fr_1fr] gap-4 mb-8">
          <HubButton
            onClick={startMatch}
            accent="green"
            icon={<Zap className="w-8 h-8" strokeWidth={2.2} />}
            title="Começar uma luta"
            subtitle="Abre o placar pra começar agora."
            primary
          />
          <HubButton
            onClick={openHardwareTest}
            accent="cyan"
            icon={<Stethoscope className="w-7 h-7" strokeWidth={2.2} />}
            title="Testar equipamento"
            subtitle="Verifica capacete e colete dos dois atletas."
          />
          <HubButton
            onClick={openTv}
            accent="purple"
            icon={<Monitor className="w-7 h-7" strokeWidth={2.2} />}
            title="Mostrar na TV"
            subtitle="Abre o placar grande para o público."
          />
        </div>

        {/* Advanced collapsible */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="w-full max-w-[960px]">
          <CollapsibleTrigger className="w-full flex items-center justify-center gap-2 py-3 text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors">
            <ChevronDown
              className={cn('w-4 h-4 transition-transform', advancedOpen && 'rotate-180')}
            />
            Mais opções (avançado)
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <AdvancedButton
                onClick={openConfig}
                icon={<Settings className="w-4 h-4" />}
                label="Ajustar regras"
              />
              <AdvancedButton
                onClick={goToMatForHardware}
                icon={<Plug className="w-4 h-4" />}
                label="Conectar equipamento"
              />
              <AdvancedButton
                onClick={openHelp}
                icon={<HelpCircle className="w-4 h-4" />}
                label="Ajuda"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </main>

      {/* Tiny footer */}
      <footer className="relative z-10 flex justify-center pb-4">
        <span className="text-zinc-700 text-[10px] tracking-[0.3em] uppercase">
          Modo básico
        </span>
      </footer>
    </div>
  );
}

// ─── Main button (primary grows bigger via `primary` flag) ───

interface HubButtonProps {
  onClick: () => void;
  accent: 'green' | 'cyan' | 'purple';
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  primary?: boolean;
}

const ACCENT_STYLES: Record<HubButtonProps['accent'], { ring: string; iconBg: string; iconColor: string; glow: string }> = {
  green: {
    ring: 'hover:border-emerald-500/60 hover:shadow-[0_0_40px_rgba(16,185,129,0.18)]',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    glow: 'bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_70%)]',
  },
  cyan: {
    ring: 'hover:border-cyan-500/60 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]',
    iconBg: 'bg-cyan-500/15',
    iconColor: 'text-cyan-400',
    glow: 'bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.08),transparent_70%)]',
  },
  purple: {
    ring: 'hover:border-purple-500/60 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]',
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
    glow: 'bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.08),transparent_70%)]',
  },
};

function HubButton({ onClick, accent, icon, title, subtitle, primary }: HubButtonProps) {
  const s = ACCENT_STYLES[accent];
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative bg-[#0c0c12] border border-white/[0.06] rounded-2xl transition-all duration-300 text-left overflow-hidden',
        'hover:scale-[1.015] active:scale-[0.99]',
        s.ring,
        primary ? 'p-7 min-h-[200px]' : 'p-6 min-h-[180px]',
      )}
    >
      <div className={cn('absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500', s.glow)} />
      <div className="relative flex flex-col gap-4 h-full">
        <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center', s.iconBg, s.iconColor)}>
          {icon}
        </div>
        <div className="mt-auto">
          <h2 className={cn('font-bold text-white leading-tight', primary ? 'text-2xl mb-1.5' : 'text-xl mb-1')}>
            {title}
          </h2>
          <p className="text-zinc-500 text-sm leading-snug">{subtitle}</p>
        </div>
      </div>
    </button>
  );
}

// ─── Advanced secondary button ───

function AdvancedButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/[0.05] rounded-lg text-zinc-300 hover:bg-white/[0.04] hover:text-white hover:border-white/10 transition-colors text-sm font-medium"
    >
      <span className="text-zinc-400">{icon}</span>
      {label}
    </button>
  );
}
