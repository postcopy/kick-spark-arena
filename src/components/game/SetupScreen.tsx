import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSound } from '@/contexts/SoundContext';
import { AddAthleteDialog } from './AddAthleteDialog';
import { RankingPreview, AthleteStats } from './RankingPreview';
import type { Athlete } from '@/types/game';
import bgMenuModos from '@/assets/menu-modos.jpg';

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
  { value: 15, label: '15s', sublabel: 'Kids 4-6', ageGroup: 'kids' },
  { value: 30, label: '30s', sublabel: 'Kids 7-9', ageGroup: 'kids' },
  { value: 45, label: '45s', sublabel: 'Juvenil', ageGroup: 'youth' },
  { value: 60, label: '1 min', sublabel: 'Adulto', recommended: true, ageGroup: 'adult' },
  { value: 90, label: '1:30', sublabel: 'Avançado', ageGroup: 'adult' },
];

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
  const [step, setStep] = useState<'players' | 'athlete' | 'duration'>('players');

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
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#0b1120] relative">
      {/* Background overlay */}
      <img src={bgMenuModos} className="absolute inset-0 w-full h-full object-cover opacity-[0.03] pointer-events-none" alt="" />

      {/* Progress Indicator — flat bars */}
      <div className="flex items-center justify-center gap-2 pt-6 pb-2 relative z-10">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-8 h-1 transition-all',
              i + 1 <= currentStep ? 'bg-[#FFD700]' : 'bg-white/20'
            )}
          />
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center px-4 md:px-6 relative z-10">
        <div className="w-full max-w-6xl">

          {/* Step 1: How many players? */}
          {step === 'players' && (
            <div className="animate-fade-in flex flex-col">
              <h1 className="font-mono font-black uppercase tracking-tighter text-white text-2xl md:text-3xl mb-6">
                MODO DE JOGO
              </h1>

              <div className="flex flex-col gap-2 w-full max-w-3xl">
                {/* Duo */}
                <button
                  onClick={() => handleVariantSelect('duo')}
                  className={cn(
                    "flex items-center justify-between px-6 h-14 md:h-16 transition-all duration-200 active:scale-[0.98]",
                    variant === 'duo'
                      ? "bg-[#FFD700] text-black border border-transparent"
                      : "bg-transparent border border-white/5 text-white/20 hover:bg-white/5 hover:text-white/40 hover:border-white/10"
                  )}
                >
                  <span className="text-2xl md:text-3xl font-black uppercase tracking-tighter">DUPLA</span>
                  <span className={cn("font-mono text-lg", variant === 'duo' ? "text-black/60" : "text-white/20")}>2 PLAYERS</span>
                </button>

                {/* Individual */}
                <button
                  onClick={() => handleVariantSelect('individual')}
                  className={cn(
                    "flex items-center justify-between px-6 h-14 md:h-16 transition-all duration-200 active:scale-[0.98]",
                    variant === 'individual'
                      ? "bg-[#FFD700] text-black border border-transparent"
                      : "bg-transparent border border-white/5 text-white/20 hover:bg-white/5 hover:text-white/40 hover:border-white/10"
                  )}
                >
                  <span className="text-2xl md:text-3xl font-black uppercase tracking-tighter">SOZINHO</span>
                  <span className={cn("font-mono text-lg", variant === 'individual' ? "text-black/60" : "text-white/20")}>RANKING</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Select Athlete (Individual only) */}
          {step === 'athlete' && (
            <div className="animate-fade-in flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h1 className="font-mono font-black uppercase tracking-tighter text-white text-2xl md:text-3xl">
                  SELECIONAR ATLETA
                </h1>
                <button
                  onClick={() => setShowRanking(true)}
                  className="font-mono text-xs uppercase tracking-widest text-[#FFD700]/60 hover:text-[#FFD700] transition-colors"
                >
                  RANKING →
                </button>
              </div>

              <div className="w-full max-w-4xl">
                {/* Search */}
                <div className="mb-4">
                  <Input
                    placeholder="Buscar atleta..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 text-base bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono rounded-none"
                  />
                </div>

                {/* Athletes Grid */}
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[40vh] overflow-y-auto mb-4 p-1">
                  {isLoading ? (
                    <div className="col-span-full text-center py-8 text-white/40 font-mono text-sm">
                      Carregando...
                    </div>
                  ) : filteredAthletes.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-white/40 font-mono text-sm">
                      {athletes.length === 0 ? 'Nenhum atleta cadastrado' : 'Nenhum resultado'}
                    </div>
                  ) : (
                    filteredAthletes.map((athlete) => (
                      <button
                        key={athlete.id}
                        onClick={() => handleAthleteSelect(athlete)}
                        className={cn(
                          'flex flex-col items-center p-3 transition-all active:scale-[0.98]',
                          selectedAthlete?.id === athlete.id
                            ? 'bg-[#FFD700] text-black'
                            : 'bg-white/5 border border-white/5 hover:bg-white/10'
                        )}
                      >
                        <div className={cn(
                          'w-12 h-12 flex items-center justify-center mb-2 font-black text-lg',
                          selectedAthlete?.id === athlete.id ? 'bg-black/20 text-black' : 'bg-white/10 text-white/60'
                        )}>
                          {athlete.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={cn(
                          "font-semibold text-center truncate w-full text-sm",
                          selectedAthlete?.id === athlete.id ? 'text-black' : 'text-white'
                        )}>
                          {athlete.name.split(' ')[0]}
                        </span>
                        {athlete.belt && (
                          <span className={cn(
                            "text-xs",
                            selectedAthlete?.id === athlete.id ? 'text-black/60' : 'text-white/40'
                          )}>{athlete.belt}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>

                {/* Add Athlete Button */}
                <button
                  onClick={() => setShowAddDialog(true)}
                  className="w-full h-12 font-mono text-sm uppercase tracking-widest bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                >
                  + NOVO ATLETA
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Duration */}
          {step === 'duration' && (
            <div className="animate-fade-in">
              <h1 className="font-mono font-black uppercase tracking-tighter text-white text-2xl md:text-3xl mb-6">
                TEMPO DO DESAFIO
              </h1>

              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                {/* Left column: Duration options */}
                <div className="flex-1 flex flex-col gap-2">
                  {DURATION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onDurationChange(option.value)}
                      className={cn(
                        'relative flex items-center justify-between px-6 h-14 md:h-16 transition-all duration-200 active:scale-[0.98]',
                        duration === option.value
                          ? 'bg-[#FFD700] text-black border border-transparent'
                          : 'bg-transparent border border-white/5 text-white/20 hover:bg-white/5 hover:text-white/40 hover:border-white/10'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl md:text-3xl font-black">
                          {option.label}
                        </span>
                        {option.recommended && (
                          <span className={cn(
                            "font-mono text-[0.65rem] uppercase tracking-widest px-2 py-0.5",
                            duration === option.value ? "bg-black/20 text-black" : "bg-white/10 text-white/30"
                          )}>
                            REC
                          </span>
                        )}
                      </div>
                      <span className={cn(
                        "font-mono text-lg",
                        duration === option.value ? "text-black/60" : "text-white/20"
                      )}>
                        {option.sublabel}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Right column: Preview + Athlete Stats + Start */}
                <div className="flex-1 flex flex-col gap-4 lg:justify-center">
                  {/* Athlete Stats (Individual mode only) */}
                  {variant === 'individual' && selectedAthlete && (
                    <AthleteStats 
                      athleteId={selectedAthlete.id} 
                      athleteName={selectedAthlete.name} 
                    />
                  )}

                  {/* Preview */}
                  <div className="w-full h-20 bg-white/5 border border-white/10 flex overflow-hidden">
                    {variant === 'duo' ? (
                      <>
                        <div className="flex-1 flex items-center justify-center bg-game-red/10 border-l-4 border-game-red">
                          <span className="text-2xl font-black text-game-red font-mono">RED</span>
                        </div>
                        <div className="w-px bg-white/10" />
                        <div className="flex-1 flex items-center justify-center bg-game-blue/10 border-r-4 border-game-blue">
                          <span className="text-2xl font-black text-game-blue font-mono">BLUE</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center bg-[#FFD700]/10 border-2 border-[#FFD700]">
                        <span className="text-xl font-black text-[#FFD700] font-mono">
                          {selectedAthlete?.name || 'ATLETA'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Start Button — chamfered */}
                  <button
                    onClick={handleStart}
                    disabled={!canStart}
                    className={cn(
                      'w-full h-14 font-black uppercase tracking-widest text-lg transition-all flex items-center justify-center',
                      canStart
                        ? 'bg-[#FFD700] text-black hover:brightness-110'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    )}
                    style={canStart ? { clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' } : undefined}
                  >
                    JOGAR!
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

      {/* Footer: Back button */}
      <div className="flex items-center justify-center py-4 relative z-10">
        <button
          onClick={handleBack}
          className="font-mono text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          ← VOLTAR
        </button>
      </div>

      {/* Add Athlete Dialog */}
      <AddAthleteDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAthleteAdded={(athlete) => {
          setAthletes(prev => [...prev, athlete]);
          handleAthleteSelect(athlete);
          setShowAddDialog(false);
        }}
      />
    </div>
  );
}
