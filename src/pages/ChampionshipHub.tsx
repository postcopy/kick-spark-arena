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
    <div className="min-h-screen bg-wt-bg flex flex-col relative overflow-hidden select-none font-display">
      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-wt-divider">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-wt-fg-muted hover:text-white transition-colors text-sm font-medium"
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
        <div className="text-center mb-12">
          <div className="text-xs font-bold uppercase tracking-[0.4em] text-wt-fg-muted mb-3">
            Mat {matId} · {todayLabel}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            O que você quer fazer?
          </h1>
        </div>

        {/* Main 3 buttons */}
        <div className="w-full max-w-[1040px] grid grid-cols-1 md:grid-cols-[1.8fr_1fr_1fr] gap-3 mb-10">
          <HubButton
            onClick={startMatch}
            variant="primary"
            icon={<Zap className="w-8 h-8" strokeWidth={2.2} />}
            title="Começar uma luta"
            subtitle="Abre o placar para iniciar agora."
          />
          <HubButton
            onClick={openHardwareTest}
            variant="secondary"
            icon={<Stethoscope className="w-7 h-7" strokeWidth={2.2} />}
            title="Testar equipamento"
            subtitle="Verifica capacete e colete dos dois atletas."
          />
          <HubButton
            onClick={openTv}
            variant="secondary"
            icon={<Monitor className="w-7 h-7" strokeWidth={2.2} />}
            title="Mostrar na TV"
            subtitle="Abre o placar grande para o público."
          />
        </div>

        {/* Advanced collapsible */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="w-full max-w-[1040px]">
          <CollapsibleTrigger className="w-full flex items-center justify-center gap-2 py-3 text-wt-fg-muted hover:text-white text-xs font-bold uppercase tracking-[0.25em] transition-colors">
            <ChevronDown
              className={cn('w-4 h-4 transition-transform', advancedOpen && 'rotate-180')}
            />
            Mais opções
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[2px]">
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
      <footer className="relative z-10 flex justify-center pb-4 border-t border-wt-divider pt-3">
        <span className="text-wt-fg-muted text-[10px] tracking-[0.4em] uppercase font-semibold">
          Modo básico
        </span>
      </footer>
    </div>
  );
}

// ─── Main button — retangular, sem glow, hierarquia via size/contraste ───

interface HubButtonProps {
  onClick: () => void;
  variant: 'primary' | 'secondary';
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

function HubButton({ onClick, variant, icon, title, subtitle }: HubButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative border transition-all duration-200 text-left overflow-hidden',
        'active:scale-[0.99]',
        isPrimary
          ? 'bg-chung hover:bg-chung-accent border-chung p-8 min-h-[220px]'
          : 'bg-wt-bg-secondary hover:bg-wt-bg-tertiary border-wt-divider hover:border-wt-fg-muted p-6 min-h-[200px]',
      )}
    >
      <div className="relative flex flex-col gap-5 h-full">
        <div className={cn(
          'w-14 h-14 flex items-center justify-center border',
          isPrimary ? 'border-white/30 text-white' : 'border-wt-divider text-wt-fg-secondary',
        )}>
          {icon}
        </div>
        <div className="mt-auto">
          <h2 className={cn(
            'font-black text-white leading-tight uppercase tracking-tight',
            isPrimary ? 'text-3xl mb-2' : 'text-xl mb-1.5',
          )}>
            {title}
          </h2>
          <p className={cn(
            'text-sm leading-snug',
            isPrimary ? 'text-white/75' : 'text-wt-fg-muted',
          )}>
            {subtitle}
          </p>
        </div>
      </div>
    </button>
  );
}

// ─── Advanced secondary button — retangular ───

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
      className="flex items-center gap-3 px-4 py-3 bg-wt-bg-secondary border border-wt-divider text-wt-fg-secondary hover:bg-wt-bg-tertiary hover:text-white hover:border-wt-fg-muted transition-colors text-sm font-semibold uppercase tracking-wider"
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}
