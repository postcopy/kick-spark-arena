// Chamada Page — próximas lutas por quadra, leitura à distância no aquecimento.
//
// spe-ui-design §P1/§2: retangular, tokens WT, tipografia broadcast. Sem pílulas
// arredondadas, sem yellow genérico — cor do atleta na cor do atleta.

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

  useEffect(() => {
    function refresh() {
      try {
        const stored = localStorage.getItem(TOURNAMENT_STORAGE_KEY);
        if (stored) {
          const t: Tournament = JSON.parse(stored);
          setFights(getUpcomingFights(t));
        }
      } catch {
        /* ignore */
      }
    }

    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!tournament) {
    return (
      <div className="min-h-screen bg-wt-bg flex flex-col items-center justify-center font-display">
        <Megaphone className="h-16 w-16 text-wt-fg-muted mb-4" />
        <p className="text-wt-fg-secondary text-xl uppercase tracking-wider">
          Nenhum torneio em andamento
        </p>
        <Button
          variant="ghost"
          onClick={() => navigate('/professional')}
          className="mt-4 text-wt-fg-muted hover:text-wt-fg-primary uppercase tracking-wider text-xs font-bold"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const byMat = new Map<number, UpcomingFight[]>();
  for (const f of fights) {
    const list = byMat.get(f.matNumber) || [];
    list.push(f);
    byMat.set(f.matNumber, list);
  }

  return (
    <div className="min-h-screen bg-wt-bg flex flex-col font-display select-none">
      {/* Header */}
      <header className="flex items-center gap-8 px-12 py-6 border-b border-wt-divider">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/professional')}
          className="text-wt-fg-muted hover:text-wt-fg-primary rounded-none"
        >
          <ArrowLeft className="h-7 w-7" />
        </Button>
        <img src={logoSpe} alt="SPE" className="h-12" />
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-[0.4em] text-wt-fg-muted font-bold">
            Em aquecimento
          </div>
          <h1 className="text-wt-fg-primary font-black text-4xl tracking-tight">PRÓXIMAS LUTAS</h1>
        </div>
        <Megaphone className="h-9 w-9 text-wt-fg-secondary" />
      </header>

      {/* Fight list */}
      <div className="flex-1 overflow-auto px-12 py-8">
        {fights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-wt-fg-muted">
            <p className="text-3xl uppercase tracking-wider">Nenhuma luta programada</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Array.from(byMat.entries()).map(([matNumber, matFights]) => (
              <section key={matNumber}>
                <div className="flex items-baseline gap-4 mb-5 border-b border-wt-divider pb-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-wt-fg-muted">
                    Quadra
                  </span>
                  <h2 className="text-wt-fg-primary font-black text-6xl tabular-nums leading-none">
                    {String(matNumber).padStart(2, '0')}
                  </h2>
                </div>

                <div className="grid gap-[2px]">
                  {matFights.map((f, i) => (
                    <div
                      key={f.match.id}
                      className={cn(
                        'relative flex items-center gap-8 px-10 py-6 border transition-colors',
                        f.isCurrent
                          ? 'bg-wt-bg-secondary border-wt-fg-primary/30'
                          : 'bg-wt-bg-secondary/40 border-wt-divider',
                      )}
                    >
                      {/* Current indicator — faixa lateral */}
                      {f.isCurrent && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-wt-fg-primary" />
                      )}

                      {/* Order */}
                      <div className="flex flex-col items-center justify-center w-24 shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-wt-fg-muted">
                          {f.isCurrent ? 'Agora' : `${i + 1}ª`}
                        </span>
                        <span
                          className={cn(
                            'text-4xl font-black tabular-nums leading-none mt-1',
                            f.isCurrent ? 'text-wt-fg-primary' : 'text-wt-fg-secondary',
                          )}
                        >
                          {String(f.match.matchNumber).padStart(3, '0')}
                        </span>
                      </div>

                      {/* Category */}
                      <div className="w-80 shrink-0">
                        <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-wt-fg-muted mb-1">
                          Categoria
                        </div>
                        <div className="text-wt-fg-secondary text-xl truncate">
                          {f.category.name}
                        </div>
                      </div>

                      {/* Athletes */}
                      <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-6">
                        <div className="text-right">
                          <div className="text-hong-accent text-[2.25rem] font-black leading-none">
                            {f.match.athleteRed?.name || '—'}
                          </div>
                          {f.match.athleteRed?.academy && (
                            <div className="text-wt-fg-muted text-sm uppercase tracking-wider mt-1 truncate">
                              {f.match.athleteRed.academy}
                            </div>
                          )}
                        </div>
                        <span className="text-wt-fg-muted text-lg font-black tracking-widest">
                          VS
                        </span>
                        <div>
                          <div className="text-chung-accent text-[2.25rem] font-black leading-none">
                            {f.match.athleteBlue?.name || '—'}
                          </div>
                          {f.match.athleteBlue?.academy && (
                            <div className="text-wt-fg-muted text-sm uppercase tracking-wider mt-1 truncate">
                              {f.match.athleteBlue.academy}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
