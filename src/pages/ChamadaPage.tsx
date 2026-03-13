// Chamada Page — Shows upcoming fights per mat on a large display
// Designed for readability from distance in the warm-up area

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import logoSpe from '@/assets/logo-spe-branca.png';
import { useTournament } from '@/hooks/useTournament';
import type { Tournament, Category, BracketMatch } from '@/types/tournament';
import { TOURNAMENT_STORAGE_KEY } from '@/types/tournament';

interface UpcomingFight {
  matNumber: number;
  category: Category;
  match: BracketMatch;
  isCurrent: boolean;
}

function getUpcomingFights(tournament: Tournament, maxPerMat = 3): UpcomingFight[] {
  const fights: UpcomingFight[] = [];

  const matNumbers = Object.keys(tournament.matAssignments)
    .map(Number)
    .sort((a, b) => a - b);

  for (const matNumber of matNumbers) {
    const catIds = tournament.matAssignments[matNumber] || [];
    let count = 0;

    for (const cat of tournament.categories) {
      if (!catIds.includes(cat.id)) continue;

      const readyMatches = cat.bracket
        .filter(m => m.status === 'READY')
        .sort((a, b) => a.matchNumber - b.matchNumber);

      for (const match of readyMatches) {
        if (count >= maxPerMat) break;
        fights.push({
          matNumber,
          category: cat,
          match,
          isCurrent: count === 0,
        });
        count++;
      }
      if (count >= maxPerMat) break;
    }
  }

  return fights;
}

export default function ChamadaPage() {
  const navigate = useNavigate();
  const { tournament } = useTournament();
  const [fights, setFights] = useState<UpcomingFight[]>([]);

  // Poll localStorage for updates (since BroadcastChannel only syncs match state, not tournament)
  useEffect(() => {
    function refresh() {
      try {
        const stored = localStorage.getItem(TOURNAMENT_STORAGE_KEY);
        if (stored) {
          const t: Tournament = JSON.parse(stored);
          setFights(getUpcomingFights(t));
        }
      } catch { /* ignore */ }
    }

    refresh();
    const interval = setInterval(refresh, 2000); // refresh every 2s
    return () => clearInterval(interval);
  }, []);

  if (!tournament) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center">
        <Megaphone className="h-16 w-16 text-zinc-700 mb-4" />
        <p className="text-zinc-500 text-xl">Nenhum torneio em andamento</p>
        <Button
          variant="ghost"
          onClick={() => navigate('/professional')}
          className="mt-4 text-zinc-400"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  // Group by mat
  const byMat = new Map<number, UpcomingFight[]>();
  for (const f of fights) {
    const list = byMat.get(f.matNumber) || [];
    list.push(f);
    byMat.set(f.matNumber, list);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-8 px-12 py-6 border-b border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/professional')}
          className="text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-7 w-7" />
        </Button>
        <img src={logoSpe} alt="SPE" className="h-12" />
        <h1 className="text-white font-black text-4xl flex-1 tracking-[0.15em]">PRÓXIMAS LUTAS</h1>
        <Megaphone className="h-9 w-9 text-[hsl(var(--sulsport-yellow))]" />
      </header>

      {/* Fight list */}
      <div className="flex-1 overflow-auto px-12 py-8">
        {fights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <p className="text-4xl">Nenhuma luta programada</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Array.from(byMat.entries()).map(([matNumber, matFights]) => (
              <div key={matNumber}>
                <h2 className="text-[hsl(var(--sulsport-yellow))] font-black text-6xl mb-6 tracking-wider">
                  QUADRA {matNumber}
                </h2>
                <div className="space-y-3">
                  {matFights.map((f, i) => (
                    <div
                      key={f.match.id}
                      className={cn(
                        "flex items-center gap-8 rounded-xl px-12 py-7 border transition-all",
                        f.isCurrent
                          ? "bg-[hsl(var(--sulsport-yellow))]/10 border-[hsl(var(--sulsport-yellow))]/30 scale-[1.005]"
                          : "bg-white/5 border-white/10",
                      )}
                    >
                      {/* Status badge */}
                      <span className={cn(
                        "text-xl font-black uppercase px-5 py-2 rounded-full whitespace-nowrap",
                        f.isCurrent
                          ? "bg-[hsl(var(--sulsport-yellow))]/20 text-[hsl(var(--sulsport-yellow))]"
                          : "bg-white/10 text-zinc-400",
                      )}>
                        {f.isCurrent ? 'PRÓXIMA' : `${i + 1}ª`}
                      </span>

                      {/* Category */}
                      <span className="text-zinc-400 text-2xl w-96 truncate">
                        {f.category.name}
                      </span>

                      {/* Athletes — bright colors for TV readability */}
                      <div className="flex-1 flex items-center gap-6 leading-tight">
                        <div className="flex flex-col">
                          <span className="text-red-400 text-[2.5rem] font-black">
                            {f.match.athleteRed?.name || '—'}
                          </span>
                          {f.match.athleteRed?.academy && (
                            <span className="text-zinc-500 text-xl">{f.match.athleteRed.academy}</span>
                          )}
                        </div>
                        <span className="text-zinc-500 text-3xl font-black">VS</span>
                        <div className="flex flex-col">
                          <span className="text-blue-400 text-[2.5rem] font-black">
                            {f.match.athleteBlue?.name || '—'}
                          </span>
                          {f.match.athleteBlue?.academy && (
                            <span className="text-zinc-500 text-xl">{f.match.athleteBlue.academy}</span>
                          )}
                        </div>
                      </div>

                      {/* Match number */}
                      <span className="text-zinc-500 text-2xl">
                        Luta {String(f.match.matchNumber).padStart(3, '0')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
