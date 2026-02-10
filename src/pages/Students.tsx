import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { StudentAvatar } from '@/components/game/StudentAvatar';
import { AddAthleteDialog } from '@/components/game/AddAthleteDialog';
import type { Athlete } from '@/types/game';

const BELT_TAG_COLORS: Record<string, string> = {
  branca: 'bg-white text-zinc-800 border border-zinc-300',
  amarela: 'bg-yellow-400 text-yellow-950',
  laranja: 'bg-orange-500 text-white',
  verde: 'bg-green-500 text-white',
  roxa: 'bg-purple-500 text-white',
  marrom: 'bg-amber-800 text-white',
  preta: 'bg-zinc-900 text-white border border-zinc-600',
  vermelha: 'bg-red-500 text-white',
};

export default function Students() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('athletes')
      .select('*')
      .eq('academy_id', user.id)
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
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
      });
  }, [user]);

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-background">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-3 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Users className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Meus Alunos</h1>
        <span className="text-sm text-muted-foreground ml-auto">{athletes.length} atletas</span>
      </header>

      {/* Main */}
      <main className="flex-1 min-h-0 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : athletes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <Users className="w-16 h-16 text-muted-foreground/40" />
            <p className="text-lg text-muted-foreground">Nenhum aluno cadastrado</p>
            <Button onClick={() => setShowAdd(true)} className="gap-2 bg-primary text-primary-foreground">
              <Plus className="w-4 h-4" />
              Cadastrar Primeiro Aluno
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {athletes.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(`/students/${a.id}`)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all active:scale-[0.97]"
              >
                <StudentAvatar name={a.name} avatarUrl={a.avatarUrl} belt={a.belt} size="lg" />
                <p className="font-semibold text-foreground text-sm truncate w-full text-center">
                  {a.nickname || a.name.split(' ')[0]}
                </p>
                {a.belt && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${BELT_TAG_COLORS[a.belt] || ''}`}
                  >
                    {a.belt}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      {athletes.length > 0 && (
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform active:scale-95 z-40"
          aria-label="Adicionar aluno"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <AddAthleteDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onAthleteAdded={(athlete) => {
          setAthletes((prev) => [...prev, athlete].sort((a, b) => a.name.localeCompare(b.name)));
          setShowAdd(false);
        }}
      />
    </div>
  );
}
