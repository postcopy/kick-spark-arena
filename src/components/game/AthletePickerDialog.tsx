import { useState, useEffect } from 'react';
import { UserX, Plus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { StudentAvatar } from './StudentAvatar';
import { AddAthleteDialog } from './AddAthleteDialog';
import type { Athlete } from '@/types/game';

interface AthletePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (athlete: Athlete | null, isGuest: boolean) => void;
}

export function AthletePickerDialog({ open, onOpenChange, onSelect }: AthletePickerDialogProps) {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (open && user) {
      setLoading(true);
      supabase
        .from('athletes')
        .select('*')
        .eq('academy_id', user.id)
        .eq('is_active', true)
        .order('name')
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching athletes:', error);
            import('sonner').then(({ toast }) => toast.error('Erro ao carregar atletas: ' + error.message));
          }
          setAthletes(
            (data || []).map((a) => ({
              id: a.id,
              name: a.name,
              nickname: a.nickname || undefined,
              belt: a.belt || undefined,
              category: a.category || undefined,
              avatarUrl: a.avatar_url || undefined,
              isActive: a.is_active ?? true,
            })),
          );
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching athletes:', err);
          setLoading(false);
        });
    }
  }, [open, user]);

  const handleGuest = () => {
    onSelect(null, true);
    onOpenChange(false);
  };

  const handlePickAthlete = (a: Athlete) => {
    onSelect(a, false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Selecionar Atleta</DialogTitle>
            <DialogDescription>Escolha quem vai treinar agora</DialogDescription>
          </DialogHeader>

          {/* Guest option */}
          <button
            onClick={handleGuest}
            className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-muted-foreground/40 hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <UserX className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">Visitante</p>
              <p className="text-xs text-muted-foreground">Treinar sem salvar resultados</p>
            </div>
          </button>

          {/* Athlete list */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : athletes.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">
                Nenhum atleta cadastrado ainda.
              </p>
            ) : (
              athletes.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handlePickAthlete(a)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                >
                  <StudentAvatar name={a.name} avatarUrl={a.avatarUrl} belt={a.belt} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{a.name}</p>
                    {a.belt && (
                      <p className="text-xs text-muted-foreground capitalize">{a.belt}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Add new athlete */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="w-4 h-4" />
            Cadastrar Novo Atleta
          </Button>
        </DialogContent>
      </Dialog>

      <AddAthleteDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onAthleteAdded={(athlete) => {
          setAthletes((prev) => [...prev, athlete].sort((a, b) => a.name.localeCompare(b.name)));
          setShowAdd(false);
        }}
      />
    </>
  );
}
