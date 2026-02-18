import { useState, useEffect } from 'react';
import { ChevronLeft, Users, User, Search, Plus, Play, Check, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSound } from '@/contexts/SoundContext';
import { AddAthleteDialog } from './AddAthleteDialog';
import { RankingPreview, AthleteStats } from './RankingPreview';
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
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 pt-6 pb-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-3 h-3 rounded-full transition-all',
              i + 1 <= currentStep ? 'bg-game-yellow' : 'bg-white/20'
            )}
          />
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center px-6 md:px-8">
        <div className="w-full max-w-6xl">

          {/* Step 1: How many players? */}
          {step === 'players' && (
            <div className="animate-fade-in flex flex-col items-center">
              <h1 className="text-3xl md:text-4xl font-bold text-center text-white mb-2">
                Quantos vão jogar?
              </h1>
              <p className="text-lg text-white/50 text-center mb-10">
                Escolha o modo de jogo
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-3xl">
                {/* Duo */}
                <button
                  onClick={() => handleVariantSelect('duo')}
                  className={cn(
                    'group relative w-full p-8 md:p-10 rounded-2xl border-2 transition-all active:scale-[0.98]',
                    variant === 'duo'
                      ? 'bg-game-yellow/10 border-game-yellow'
                      : 'bg-white/5 border-white/10 hover:border-game-yellow/50'
                  )}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className={cn(
                      'p-5 rounded-xl transition-colors',
                      variant === 'duo' ? 'bg-game-yellow/20' : 'bg-white/10'
                    )}>
                      <Users className={cn(
                        'w-14 h-14',
                        variant === 'duo' ? 'text-game-yellow' : 'text-white/60'
                      )} />
                    </div>
                    <div className="text-center">
                      <h2 className="text-2xl md:text-3xl font-bold text-white">DUPLA</h2>
                      <p className="text-base text-white/50 mt-1">2 pessoas, quem chuta mais</p>
                    </div>
                  </div>
                </button>

                {/* Individual */}
                <button
                  onClick={() => handleVariantSelect('individual')}
                  className={cn(
                    'group relative w-full p-8 md:p-10 rounded-2xl border-2 transition-all active:scale-[0.98]',
                    variant === 'individual'
                      ? 'bg-game-gold/10 border-game-gold'
                      : 'bg-white/5 border-white/10 hover:border-game-gold/50'
                  )}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className={cn(
                      'p-5 rounded-xl transition-colors',
                      variant === 'individual' ? 'bg-game-gold/20' : 'bg-white/10'
                    )}>
                      <User className={cn(
                        'w-14 h-14',
                        variant === 'individual' ? 'text-game-gold' : 'text-white/60'
                      )} />
                    </div>
                    <div className="text-center">
                      <h2 className="text-2xl md:text-3xl font-bold text-white">SOZINHO</h2>
                      <p className="text-base text-white/50 mt-1">Ranking e recordes pessoais</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Select Athlete (Individual only) */}
          {step === 'athlete' && (
            <div className="animate-fade-in flex flex-col items-center">
              <h1 className="text-3xl md:text-4xl font-bold text-center text-white mb-2">
                Quem vai jogar?
              </h1>
              <p className="text-lg text-white/50 text-center mb-6">
                Selecione o atleta
              </p>

              <div className="w-full max-w-4xl">
                {/* Ranking Button */}
                <button
                  onClick={() => setShowRanking(true)}
                  className="w-full mb-4 p-4 rounded-xl bg-game-gold/10 border-2 border-game-gold/30 hover:border-game-gold/60 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <Trophy className="w-6 h-6 text-game-gold" />
                  <span className="text-lg font-semibold text-game-gold">Ver Ranking</span>
                </button>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <Input
                    placeholder="Buscar atleta..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 text-lg rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>

                {/* Athletes Grid */}
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[40vh] overflow-y-auto mb-4 p-1">
                  {isLoading ? (
                    <div className="col-span-full text-center py-8 text-white/40">
                      Carregando...
                    </div>
                  ) : filteredAthletes.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-white/40">
                      {athletes.length === 0 ? 'Nenhum atleta cadastrado' : 'Nenhum resultado'}
                    </div>
                  ) : (
                    filteredAthletes.map((athlete) => (
                      <button
                        key={athlete.id}
                        onClick={() => handleAthleteSelect(athlete)}
                        className={cn(
                          'flex flex-col items-center p-4 rounded-xl transition-all active:scale-[0.98]',
                          selectedAthlete?.id === athlete.id
                            ? 'bg-game-gold/20 border-2 border-game-gold'
                            : 'bg-white/5 border-2 border-transparent hover:border-game-gold/30'
                        )}
                      >
                        <div className={cn(
                          'w-14 h-14 rounded-full flex items-center justify-center mb-2',
                          selectedAthlete?.id === athlete.id ? 'bg-game-gold/30' : 'bg-white/10'
                        )}>
                          <User className={cn(
                            'w-7 h-7',
                            selectedAthlete?.id === athlete.id ? 'text-game-gold' : 'text-white/60'
                          )} />
                        </div>
                        <span className="font-semibold text-white text-center truncate w-full">
                          {athlete.name.split(' ')[0]}
                        </span>
                        {athlete.belt && (
                          <span className="text-xs text-white/40">{athlete.belt}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>

                {/* Add Athlete Button */}
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(true)}
                  className="w-full h-14 gap-2 text-lg rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
                >
                  <Plus className="w-5 h-5" />
                  Novo Atleta
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Duration */}
          {step === 'duration' && (
            <div className="animate-fade-in">
              <h1 className="text-3xl md:text-4xl font-bold text-center text-white mb-2">
                Quanto tempo?
              </h1>
              <p className="text-lg text-white/50 text-center mb-6">
                Escolha a duração do desafio
              </p>

              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                {/* Left column: Duration options */}
                <div className="flex-1 flex flex-col gap-2">
                  {DURATION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onDurationChange(option.value)}
                      className={cn(
                        'relative w-full p-4 md:p-5 rounded-xl border-2 transition-all active:scale-[0.98]',
                        duration === option.value
                          ? 'bg-game-yellow/10 border-game-yellow'
                          : 'bg-white/5 border-white/10 hover:border-game-yellow/50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className={cn(
                            'text-2xl md:text-3xl font-bold',
                            duration === option.value ? 'text-game-yellow' : 'text-white'
                          )}>
                            {option.label}
                          </span>
                          <span className="text-base text-white/40">{option.sublabel}</span>
                        </div>
                        
                        {duration === option.value && (
                          <div className="w-7 h-7 rounded-full bg-game-yellow flex items-center justify-center">
                            <Check className="w-4 h-4 text-[#0b1120]" />
                          </div>
                        )}
                      </div>

                      {option.recommended && (
                        <span className="absolute -top-2.5 right-4 px-3 py-0.5 bg-game-yellow text-[#0b1120] text-xs font-bold rounded-full">
                          RECOMENDADO
                        </span>
                      )}
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
                  <div className="w-full h-20 bg-white/5 rounded-xl border border-white/10 flex overflow-hidden">
                    {variant === 'duo' ? (
                      <>
                        <div className="flex-1 flex items-center justify-center bg-game-red/10 border-l-4 border-game-red">
                          <span className="text-2xl font-bold text-game-red">RED</span>
                        </div>
                        <div className="w-px bg-white/10" />
                        <div className="flex-1 flex items-center justify-center bg-game-blue/10 border-r-4 border-game-blue">
                          <span className="text-2xl font-bold text-game-blue">BLUE</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center bg-game-gold/10 border-2 border-game-gold rounded-xl">
                        <span className="text-xl font-bold text-game-gold">
                          {selectedAthlete?.name || 'Atleta'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Start Button */}
                  <Button
                    size="lg"
                    onClick={handleStart}
                    disabled={!canStart}
                    className={cn(
                      'w-full h-16 text-2xl font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]',
                      variant === 'individual'
                        ? 'bg-game-gold hover:bg-game-gold/90 text-[#0b1120]'
                        : 'bg-game-yellow hover:bg-game-yellow/90 text-[#0b1120]'
                    )}
                  >
                    <Play className="mr-3 h-7 w-7" />
                    JOGAR!
                  </Button>
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
      <div className="flex items-center justify-center py-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
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
