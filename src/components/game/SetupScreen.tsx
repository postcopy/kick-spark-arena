import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSound } from '@/contexts/SoundContext';
import { ChevronRight, HelpCircle, Timer, Users, User, Flag, Gauge } from 'lucide-react';
import { AddAthleteDialog } from './AddAthleteDialog';
import { RankingPreview, AthleteStats } from './RankingPreview';
import { MissionBriefing } from './MissionBriefing';
import { SetupTutorialDialog } from './SetupTutorialDialog';
import { useIdleAttention } from '@/hooks/useIdleAttention';
import type { Athlete } from '@/types/game';

type TimeAttackVariant = 'duo' | 'individual';

interface SetupScreenProps {
  onStart: () => void;
  onBack: () => void;
  duration: number;
  onDurationChange: (duration: number) => void;
  variant?: TimeAttackVariant;
  onVariantChange?: (variant: TimeAttackVariant) => void;
  selectedAthlete?: Athlete | null;
  onAthleteChange?: (athlete: Athlete | null) => void;
}

const DURATION_OPTIONS = [
  { value: 15, label: '15s', sublabel: 'Kids 4-6', ageGroup: 'kids', icon: '1' },
  { value: 30, label: '30s', sublabel: 'Kids 7-9', ageGroup: 'kids', icon: '2' },
  { value: 45, label: '45s', sublabel: 'Juvenil', ageGroup: 'youth', icon: '3' },
  { value: 60, label: '1 min', sublabel: 'Adulto', recommended: true, ageGroup: 'adult', icon: '4' },
  { value: 90, label: '1:30', sublabel: 'Avan\u00e7ado', ageGroup: 'adult', icon: '5' },
];

const VARIANT_BRIEFINGS: Record<TimeAttackVariant, string> = {
  duo: 'CORRIDA EM DUPLA: Dois pilotos na pista. Quem marcar mais chutes vence a corrida.',
  individual: 'CONTRA-REL\u00d3GIO: Corra sozinho e registre seu melhor tempo no ranking.',
};

const DURATION_BRIEFINGS: Record<number, string> = {
  15: 'SPRINT KIDS: Largada rel\u00e2mpago para os pequenos pilotos. Velocidade pura!',
  30: 'KIDS AVAN\u00c7ADO: Dist\u00e2ncia ideal para crian\u00e7as de 7 a 9 anos acelerarem.',
  45: 'JUVENIL: Meia-dist\u00e2ncia. Equil\u00edbrio entre velocidade e resist\u00eancia.',
  60: 'DIST\u00c2NCIA PADR\u00c3O: A corrida cl\u00e1ssica. Recomendado para todos os pilotos.',
  90: 'ENDURANCE: Prova de resist\u00eancia. S\u00f3 para os mais preparados.',
};

export function SetupScreen({
  onStart,
  onBack,
  duration,
  onDurationChange,
  variant = 'duo',
  onVariantChange,
  selectedAthlete,
  onAthleteChange,
}: SetupScreenProps) {
  const { user } = useAuth();
  const { unlockAudio, initFullPreload } = useSound();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [step, setStep] = useState<'players' | 'athlete' | 'duration'>('players');
  const isIdle = useIdleAttention(5000);

  // Fetch athletes when variant changes to individual
  useEffect(() => {
    if (variant === 'individual' && user) {
      fetchAthletes();
    }
  }, [variant, user]);

  useEffect(() => {
    if (step === 'players' && variant === 'duo') {
      // If duo selected, skip to duration
    }
  }, [variant, step]);

  const fetchAthletes = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('athletes')
        .select('*')
        .eq('academy_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAthletes(data.map(a => ({
        id: a.id,
        name: a.name,
        nickname: a.nickname || undefined,
        belt: a.belt || undefined,
        category: a.category || undefined,
        avatarUrl: a.avatar_url || undefined,
        isActive: a.is_active ?? true,
      })));
    } catch (err) {
      console.error('Error fetching athletes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAthletes = athletes.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.nickname && a.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const canStart = variant === 'duo' || (variant === 'individual' && selectedAthlete);

  const handleVariantSelect = (v: TimeAttackVariant) => {
    unlockAudio();
    initFullPreload();
    onVariantChange?.(v);
    if (v === 'duo') {
      setStep('duration');
    } else {
      setStep('athlete');
    }
  };

  const handleAthleteSelect = (athlete: Athlete) => {
    unlockAudio();
    initFullPreload();
    onAthleteChange?.(athlete);
    setStep('duration');
  };

  const handleStart = () => {
    unlockAudio();
    initFullPreload();
    onStart();
  };

  const handleBack = () => {
    if (step === 'duration') {
      if (variant === 'individual') {
        setStep('athlete');
      } else {
        setStep('players');
      }
    } else if (step === 'athlete') {
      setStep('players');
    } else {
      onBack();
    }
  };

  const totalSteps = variant === 'individual' ? 3 : 2;
  const currentStep = step === 'players' ? 1 : step === 'athlete' ? 2 : variant === 'individual' ? 3 : 2;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#0A0A0F] relative">
      {/* Subtle orange ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      {/* Header with progress + help */}
      <div className="flex items-center justify-between px-4 md:px-6 pt-4 pb-3 relative z-10">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-orange-500/60" />
          <span className="font-mono text-[10px] text-orange-500/40 uppercase tracking-[0.3em]">
            Contra o Tempo
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i + 1 <= currentStep
                    ? 'w-6 bg-orange-500'
                    : 'w-1.5 bg-white/10'
                )}
              />
            ))}
          </div>
          <button
            onClick={() => setShowTutorial(true)}
            className="text-white/20 hover:text-white/40 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center px-4 md:px-6 relative z-10">
        <div className="w-full max-w-5xl">

          {/* Step 1: Mode Selection */}
          {step === 'players' && (
            <div className="animate-fade-in">
              <h1 className="font-display font-black text-white text-3xl md:text-4xl mb-1 tracking-tight">
                Modo de Corrida
              </h1>
              <p className="text-white/25 text-sm mb-6">Escolha como quer competir</p>

              <div className="flex flex-col gap-3 max-w-2xl">
                {/* Duo option */}
                <button
                  onClick={() => handleVariantSelect('duo')}
                  className={cn(
                    "group relative flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-200 active:scale-[0.99]",
                    variant === 'duo'
                      ? "bg-orange-500/10 border-orange-500/30"
                      : "bg-white/[0.02] border-white/[0.06] hover:border-white/10 hover:bg-white/[0.04]"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
                    variant === 'duo' ? "bg-orange-500/20" : "bg-white/5"
                  )}>
                    <Users className={cn("w-6 h-6", variant === 'duo' ? "text-orange-400" : "text-white/30")} />
                  </div>
                  <div className="flex-1 text-left">
                    <span className={cn(
                      "block font-display font-bold text-xl",
                      variant === 'duo' ? "text-orange-400" : "text-white/60"
                    )}>DUPLA</span>
                    <span className="block text-xs text-white/30">Dois pilotos na pista</span>
                  </div>
                  <ChevronRight className={cn(
                    "w-5 h-5 transition-all",
                    variant === 'duo' ? "text-orange-400" : "text-white/15 group-hover:text-white/30 group-hover:translate-x-1"
                  )} />
                </button>

                {/* Solo option */}
                <button
                  onClick={() => handleVariantSelect('individual')}
                  className={cn(
                    "group relative flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-200 active:scale-[0.99]",
                    variant === 'individual'
                      ? "bg-orange-500/10 border-orange-500/30"
                      : "bg-white/[0.02] border-white/[0.06] hover:border-white/10 hover:bg-white/[0.04]"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
                    variant === 'individual' ? "bg-orange-500/20" : "bg-white/5"
                  )}>
                    <User className={cn("w-6 h-6", variant === 'individual' ? "text-orange-400" : "text-white/30")} />
                  </div>
                  <div className="flex-1 text-left">
                    <span className={cn(
                      "block font-display font-bold text-xl",
                      variant === 'individual' ? "text-orange-400" : "text-white/60"
                    )}>SOLO</span>
                    <span className="block text-xs text-white/30">Contra-rel\u00f3gio + Ranking</span>
                  </div>
                  <ChevronRight className={cn(
                    "w-5 h-5 transition-all",
                    variant === 'individual' ? "text-orange-400" : "text-white/15 group-hover:text-white/30 group-hover:translate-x-1"
                  )} />
                </button>
              </div>

              <div className="mt-5 max-w-2xl">
                <MissionBriefing text={VARIANT_BRIEFINGS[variant] || ''} />
              </div>
            </div>
          )}

          {/* Step 2: Select Athlete */}
          {step === 'athlete' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="font-display font-black text-white text-3xl md:text-4xl tracking-tight">
                    Selecionar Piloto
                  </h1>
                  <p className="text-white/25 text-sm mt-1">Escolha quem vai correr</p>
                </div>
                <button
                  onClick={() => setShowRanking(true)}
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-orange-500/50 hover:text-orange-400 transition-colors px-3 py-1.5 border border-orange-500/20 rounded-lg hover:border-orange-500/40"
                >
                  RANKING
                </button>
              </div>

              <div className="w-full max-w-4xl">
                <Input
                  placeholder="Buscar atleta..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 text-sm bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 font-mono rounded-lg mb-4 focus:border-orange-500/30"
                />

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[40vh] overflow-y-auto mb-4 p-1">
                  {isLoading ? (
                    <div className="col-span-full text-center py-8 text-white/30 font-mono text-sm">
                      Carregando...
                    </div>
                  ) : filteredAthletes.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-white/30 font-mono text-sm">
                      {athletes.length === 0 ? 'Nenhum atleta cadastrado' : 'Nenhum resultado'}
                    </div>
                  ) : (
                    filteredAthletes.map((athlete) => (
                      <button
                        key={athlete.id}
                        onClick={() => handleAthleteSelect(athlete)}
                        className={cn(
                          'flex flex-col items-center p-3 rounded-lg transition-all active:scale-[0.97]',
                          selectedAthlete?.id === athlete.id
                            ? 'bg-orange-500/15 border border-orange-500/30 ring-1 ring-orange-500/20'
                            : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/10'
                        )}
                      >
                        <div className={cn(
                          'w-11 h-11 rounded-lg flex items-center justify-center mb-2 font-bold text-base',
                          selectedAthlete?.id === athlete.id
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-white/5 text-white/40'
                        )}>
                          {athlete.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={cn(
                          "font-medium text-center truncate w-full text-sm",
                          selectedAthlete?.id === athlete.id ? 'text-orange-400' : 'text-white/70'
                        )}>
                          {athlete.name.split(' ')[0]}
                        </span>
                        {athlete.belt && (
                          <span className="text-[10px] text-white/25 mt-0.5">{athlete.belt}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>

                <button
                  onClick={() => setShowAddDialog(true)}
                  className="w-full h-11 font-mono text-xs uppercase tracking-[0.15em] bg-white/[0.03] border border-dashed border-white/10 text-white/40 hover:bg-white/[0.06] hover:text-white/60 hover:border-white/20 rounded-lg transition-all"
                >
                  + Novo Atleta
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Duration */}
          {step === 'duration' && (
            <div className="animate-fade-in">
              <h1 className="font-display font-black text-white text-3xl md:text-4xl mb-1 tracking-tight">
                Dist\u00e2ncia
              </h1>
              <p className="text-white/25 text-sm mb-6">Escolha o tempo da corrida</p>

              <div className="flex flex-col lg:flex-row gap-6">
                {/* Duration options */}
                <div className="flex-1 flex flex-col gap-2">
                  {DURATION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onDurationChange(option.value)}
                      className={cn(
                        'group relative flex items-center gap-4 px-5 py-3.5 rounded-xl border transition-all duration-200 active:scale-[0.99]',
                        duration === option.value
                          ? 'bg-orange-500/10 border-orange-500/30'
                          : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10 hover:bg-white/[0.04]'
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm",
                        duration === option.value ? "bg-orange-500/20 text-orange-400" : "bg-white/5 text-white/20"
                      )}>
                        {option.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <span className={cn(
                          "block font-display font-bold text-xl",
                          duration === option.value ? "text-orange-400" : "text-white/60"
                        )}>
                          {option.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-mono text-sm",
                          duration === option.value ? "text-orange-400/60" : "text-white/20"
                        )}>
                          {option.sublabel}
                        </span>
                        {option.recommended && (
                          <span className={cn(
                            "font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded",
                            duration === option.value ? "bg-orange-500/20 text-orange-400" : "bg-white/5 text-white/20"
                          )}>
                            REC
                          </span>
                        )}
                      </div>
                    </button>
                  ))}

                  <div className="mt-3">
                    <MissionBriefing text={DURATION_BRIEFINGS[duration] || ''} />
                  </div>
                </div>

                {/* Right panel - preview + start */}
                <div className="flex-1 flex flex-col gap-4 lg:justify-center">
                  {variant === 'individual' && selectedAthlete && (
                    <AthleteStats
                      athleteId={selectedAthlete.id}
                      athleteName={selectedAthlete.name}
                    />
                  )}

                  {/* Match preview */}
                  <div className="w-full rounded-xl overflow-hidden border border-white/[0.06]">
                    {variant === 'duo' ? (
                      <div className="flex h-20">
                        <div className="flex-1 flex items-center justify-center bg-red-500/5 border-l-2 border-red-500/40">
                          <span className="text-lg font-bold text-red-400/70 font-mono">RED</span>
                        </div>
                        <div className="w-px bg-white/5" />
                        <div className="flex-1 flex items-center justify-center bg-blue-500/5 border-r-2 border-blue-500/40">
                          <span className="text-lg font-bold text-blue-400/70 font-mono">BLUE</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-20 bg-orange-500/5 border-l-2 border-orange-500/40">
                        <Gauge className="w-5 h-5 text-orange-400/50 mr-2" />
                        <span className="text-lg font-bold text-orange-400/70 font-mono">
                          {selectedAthlete?.name || 'PILOTO'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sensor tip */}
                  <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] px-4 py-3">
                    <p className="text-white/30 text-xs leading-relaxed">
                      <span className="text-orange-400 font-bold">SENSOR:</span>{" "}
                      Detecta apenas impactos limpos. Chute {"\u2192"} Recolha {"\u2192"} Chute.
                    </p>
                  </div>

                  {/* Start button */}
                  <button
                    onClick={handleStart}
                    disabled={!canStart}
                    className={cn(
                      'btn-juice w-full h-14 rounded-xl font-display font-bold uppercase tracking-wider text-lg transition-all flex items-center justify-center gap-3',
                      canStart
                        ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-500 hover:to-orange-400 shadow-[0_0_30px_rgba(249,115,22,0.2)]'
                        : 'bg-white/5 text-white/20 cursor-not-allowed',
                      canStart && isIdle && 'animate-pulse'
                    )}
                  >
                    <Flag className="w-5 h-5" />
                    LARGADA!
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ranking Preview Modal */}
        {showRanking && (
          <RankingPreview onClose={() => setShowRanking(false)} />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center py-3 relative z-10">
        <button
          onClick={handleBack}
          className="font-mono text-[10px] text-white/20 hover:text-white/40 transition-colors tracking-wider"
        >
          \u2190 VOLTAR
        </button>
      </div>

      {/* Dialogs */}
      <AddAthleteDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAthleteAdded={(athlete) => {
          setAthletes(prev => [...prev, athlete]);
          handleAthleteSelect(athlete);
          setShowAddDialog(false);
        }}
      />
      <SetupTutorialDialog open={showTutorial} onOpenChange={setShowTutorial} accentColor="bg-orange-500" />
    </div>
  );
}
