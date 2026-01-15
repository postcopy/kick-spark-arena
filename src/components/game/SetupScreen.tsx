import { useState, useEffect } from 'react';
import { Timer, Play, ChevronLeft, Users, User, Search, Plus, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AddAthleteDialog } from './AddAthleteDialog';
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
  { value: 30, label: '30s' },
  { value: 60, label: '1 min' },
  { value: 90, label: '1:30' },
  { value: 120, label: '2 min' },
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
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Fetch athletes when variant changes to individual
  useEffect(() => {
    if (variant === 'individual' && user) {
      fetchAthletes();
    }
  }, [variant, user]);

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Timer className="w-10 h-10 text-game-yellow" />
          <h1 className="text-5xl font-bold text-foreground">TIME ATTACK</h1>
        </div>
        <p className="text-xl text-muted-foreground">
          Configure a partida
        </p>
      </div>

      {/* Variant Toggle */}
      {onVariantChange && (
        <div className="flex gap-2 mb-8 p-1 bg-game-surface rounded-lg border border-border">
          <button
            onClick={() => onVariantChange('duo')}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-md font-semibold transition-all',
              variant === 'duo'
                ? 'bg-game-yellow text-background'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Users className="w-5 h-5" />
            DUPLA
          </button>
          <button
            onClick={() => onVariantChange('individual')}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-md font-semibold transition-all',
              variant === 'individual'
                ? 'bg-game-gold text-background'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <User className="w-5 h-5" />
            INDIVIDUAL
          </button>
        </div>
      )}

      {/* Individual Mode - Athlete Selection */}
      {variant === 'individual' && onAthleteChange && (
        <div className="w-full max-w-md mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-game-gold" />
            <span className="text-lg font-semibold text-foreground">Selecionar Atleta</span>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar atleta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Athletes List */}
          <div className="max-h-48 overflow-y-auto space-y-2 mb-4 bg-game-surface rounded-lg border border-border p-2">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Carregando...</div>
            ) : filteredAthletes.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {athletes.length === 0 ? 'Nenhum atleta cadastrado' : 'Nenhum resultado'}
              </div>
            ) : (
              filteredAthletes.map((athlete) => (
                <button
                  key={athlete.id}
                  onClick={() => onAthleteChange(athlete)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left',
                    selectedAthlete?.id === athlete.id
                      ? 'bg-game-gold/20 border border-game-gold'
                      : 'hover:bg-white/5 border border-transparent'
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-game-gold/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-game-gold" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{athlete.name}</div>
                    {athlete.nickname && (
                      <div className="text-sm text-muted-foreground">"{athlete.nickname}"</div>
                    )}
                  </div>
                  {athlete.belt && (
                    <span className="text-xs text-muted-foreground uppercase">{athlete.belt}</span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Add Athlete Button */}
          <Button
            variant="outline"
            onClick={() => setShowAddDialog(true)}
            className="w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Atleta
          </Button>
        </div>
      )}

      {/* Duration Selection */}
      <div className="mb-8">
        <div className="text-center mb-4">
          <span className="text-sm text-muted-foreground uppercase tracking-wider">Duração</span>
        </div>
        <div className="flex gap-4">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onDurationChange(option.value)}
              className={cn(
                'px-8 py-6 text-2xl font-bold rounded-lg border-2 transition-all',
                duration === option.value
                  ? 'bg-game-yellow/20 border-game-yellow text-game-yellow'
                  : 'bg-game-surface border-border text-foreground hover:border-game-yellow/50'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="w-full max-w-4xl h-48 bg-game-surface rounded-lg border border-border mb-8 flex overflow-hidden">
        {variant === 'duo' ? (
          <>
            <div className="flex-1 flex items-center justify-center bg-game-red/10 border-l-4 border-game-red">
              <span className="text-6xl font-bold text-game-red">RED</span>
            </div>
            <div className="w-px bg-border" />
            <div className="flex-1 flex items-center justify-center bg-game-blue/10 border-r-4 border-game-blue">
              <span className="text-6xl font-bold text-game-blue">BLUE</span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-game-gold/10 border-4 border-game-gold">
            {selectedAthlete ? (
              <>
                <span className="text-4xl font-bold text-game-gold">{selectedAthlete.name}</span>
                {selectedAthlete.nickname && (
                  <span className="text-xl text-game-gold/70">"{selectedAthlete.nickname}"</span>
                )}
              </>
            ) : (
              <span className="text-2xl text-muted-foreground">Selecione um atleta</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          className="text-xl px-8 py-6"
        >
          <ChevronLeft className="mr-2 h-6 w-6" />
          Voltar
        </Button>
        <Button
          size="lg"
          onClick={onStart}
          disabled={!canStart}
          className={cn(
            'text-xl px-12 py-6 font-bold',
            variant === 'individual'
              ? 'bg-game-gold hover:bg-game-gold/90 text-background'
              : 'bg-game-yellow hover:bg-game-yellow-glow text-background'
          )}
        >
          <Play className="mr-2 h-6 w-6" />
          COMEÇAR
        </Button>
      </div>

      {/* Keyboard hint */}
      <p className="mt-8 text-muted-foreground">
        Pressione <kbd className="px-2 py-1 bg-secondary rounded text-sm font-mono">SPACE</kbd> para iniciar
      </p>

      {/* Add Athlete Dialog */}
      <AddAthleteDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAthleteAdded={(athlete) => {
          setAthletes(prev => [...prev, athlete]);
          onAthleteChange?.(athlete);
          setShowAddDialog(false);
        }}
      />
    </div>
  );
}
