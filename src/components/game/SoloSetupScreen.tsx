import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Plus, User, Search, Trophy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Athlete } from '@/types/game';
import { AddAthleteDialog } from './AddAthleteDialog';

const DURATION_OPTIONS = [
  { value: 30, label: '30s' },
  { value: 45, label: '45s' },
  { value: 60, label: '60s' },
];

interface SoloSetupScreenProps {
  onStart: () => void;
  onBack: () => void;
  duration: number;
  onDurationChange: (duration: number) => void;
  selectedAthlete: Athlete | null;
  onAthleteChange: (athlete: Athlete | null) => void;
}

export function SoloSetupScreen({
  onStart,
  onBack,
  duration,
  onDurationChange,
  selectedAthlete,
  onAthleteChange,
}: SoloSetupScreenProps) {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Fetch athletes
  useEffect(() => {
    if (!user) return;

    const fetchAthletes = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('athletes')
        .select('*')
        .eq('academy_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        setAthletes(data.map(a => ({
          id: a.id,
          academyId: a.academy_id,
          name: a.name,
          nickname: a.nickname || undefined,
          belt: a.belt || undefined,
          category: a.category || undefined,
          avatarUrl: a.avatar_url || undefined,
          isActive: a.is_active,
          createdAt: new Date(a.created_at),
          updatedAt: new Date(a.updated_at),
        })));
      }
      setIsLoading(false);
    };

    fetchAthletes();
  }, [user]);

  const filteredAthletes = athletes.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.nickname && a.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAthleteAdded = (newAthlete: Athlete) => {
    setAthletes(prev => [...prev, newAthlete].sort((a, b) => a.name.localeCompare(b.name)));
    onAthleteChange(newAthlete);
    setShowAddDialog(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Trophy className="w-8 h-8 text-game-yellow" />
              SOLO CHALLENGE
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Modo individual com ranking
            </p>
          </div>
        </div>

        {/* Athlete Selection */}
        <div className="mb-6">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Selecionar Atleta
          </label>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar atleta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Athletes List */}
          <div className="bg-game-surface rounded-lg border border-border max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAthletes.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                {searchQuery ? 'Nenhum atleta encontrado' : 'Nenhum atleta cadastrado'}
              </div>
            ) : (
              filteredAthletes.map((athlete) => (
                <button
                  key={athlete.id}
                  onClick={() => onAthleteChange(athlete)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 hover:bg-game-surface-elevated transition-colors text-left border-b border-border last:border-0",
                    selectedAthlete?.id === athlete.id && "bg-game-yellow/10 border-game-yellow/30"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    {athlete.avatarUrl ? (
                      <img src={athlete.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {athlete.name}
                    </div>
                    {(athlete.belt || athlete.category) && (
                      <div className="text-xs text-muted-foreground">
                        {[athlete.belt, athlete.category].filter(Boolean).join(' • ')}
                      </div>
                    )}
                  </div>
                  {selectedAthlete?.id === athlete.id && (
                    <div className="w-2 h-2 rounded-full bg-game-yellow" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Add Athlete Button */}
          <Button
            variant="outline"
            className="w-full mt-3 gap-2"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-4 h-4" />
            Novo Atleta
          </Button>
        </div>

        {/* Duration Selection */}
        <div className="mb-8">
          <label className="text-sm font-medium text-foreground mb-3 block">
            Duração
          </label>
          <div className="grid grid-cols-3 gap-3">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onDurationChange(option.value)}
                className={cn(
                  "py-4 px-6 rounded-lg border-2 font-bold text-xl transition-all",
                  duration === option.value
                    ? "border-game-yellow bg-game-yellow/10 text-game-yellow"
                    : "border-border bg-game-surface text-muted-foreground hover:border-game-yellow/50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Athlete Preview */}
        {selectedAthlete && (
          <div className="mb-6 p-4 bg-game-surface-elevated rounded-lg border border-game-yellow/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                {selectedAthlete.avatarUrl ? (
                  <img src={selectedAthlete.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg text-foreground">{selectedAthlete.name}</div>
                <div className="text-sm text-game-yellow">{duration}s Challenge</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Voltar
          </Button>
          <Button
            onClick={onStart}
            disabled={!selectedAthlete}
            className="flex-1 gap-2 bg-game-yellow text-game-yellow-foreground hover:bg-game-yellow/90"
          >
            <Play className="w-5 h-5" />
            Iniciar
          </Button>
        </div>
      </div>

      {/* Add Athlete Dialog */}
      <AddAthleteDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAthleteAdded={handleAthleteAdded}
      />
    </div>
  );
}
