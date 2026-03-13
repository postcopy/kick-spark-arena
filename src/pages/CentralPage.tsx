// Central Page — Tournament organizer command center

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Layout, Users, Radio, Edit, Trophy, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import logoSpe from '@/assets/logo-spe-branca.png';
import { useTournament } from '@/hooks/useTournament';
import { useAuth } from '@/contexts/AuthContext';
import RegistrationsPanel from '@/components/registration/RegistrationsPanel';
import { getNextReadyMatch } from '@/hooks/useBracketGenerator';
import type { Category, BracketMatch } from '@/types/tournament';

type Tab = 'setup' | 'mats' | 'live' | 'inscricoes';

const MAT_NUMBERS = [1, 2, 3, 4, 5, 6, 7];

export default function CentralPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const tournamentHook = useTournament();
  const { tournament } = tournamentHook;
  const [activeTab, setActiveTab] = useState<Tab>(tournament?.status === 'IN_PROGRESS' ? 'live' : 'setup');

  // If no tournament, redirect to tournament setup
  useEffect(() => {
    if (!tournament) {
      navigate('/championship/tournament');
    }
  }, [tournament, navigate]);

  if (!tournament) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'setup', label: 'Torneio', icon: <Layout className="h-4 w-4" /> },
    { id: 'mats', label: 'Quadras', icon: <Users className="h-4 w-4" /> },
    { id: 'live', label: 'Ao Vivo', icon: <Radio className="h-4 w-4" /> },
    { id: 'inscricoes', label: 'Inscrições', icon: <ClipboardList className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-3 border-b border-white/10 bg-[#0A0A0F]">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/professional')}
          className="text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <img src={logoSpe} alt="SPE" className="h-8" />
        <div className="flex-1">
          <h1 className="text-white font-bold">{tournament.name}</h1>
          <p className="text-zinc-500 text-xs">{tournament.date}</p>
        </div>
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-bold uppercase",
          tournament.status === 'SETUP' && "bg-yellow-500/20 text-yellow-400",
          tournament.status === 'IN_PROGRESS' && "bg-green-500/20 text-green-400",
          tournament.status === 'FINISHED' && "bg-zinc-500/20 text-zinc-400",
        )}>
          {tournament.status === 'SETUP' ? 'Configuração' :
           tournament.status === 'IN_PROGRESS' ? 'Em Andamento' : 'Encerrado'}
        </span>
      </header>

      {/* Tabs */}
      <nav className="flex gap-1 px-6 pt-3 border-b border-white/10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-t-lg transition-colors",
              activeTab === tab.id
                ? "bg-white/10 text-white border-b-2 border-[hsl(var(--sulsport-yellow))]"
                : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'setup' && (
          <SetupTab tournament={tournament} onGoToSetup={() => navigate('/championship/tournament')} />
        )}
        {activeTab === 'mats' && (
          <MatAssignmentTab
            tournament={tournament}
            assignCategory={tournamentHook.assignCategoryToMat}
            unassignCategory={tournamentHook.unassignCategoryFromMat}
          />
        )}
        {activeTab === 'live' && (
          <LiveOverviewTab
            tournament={tournament}
            recordResult={tournamentHook.recordMatchResult}
          />
        )}
        {activeTab === 'inscricoes' && user && (
          <RegistrationsPanel userId={user.id} />
        )}
      </div>
    </div>
  );
}

// ─── Setup Tab ───

function SetupTab({ tournament, onGoToSetup }: {
  tournament: NonNullable<ReturnType<typeof useTournament>['tournament']>;
  onGoToSetup: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Resumo do Torneio</h2>
        <Button onClick={onGoToSetup} variant="outline" className="border-zinc-700 text-zinc-300">
          <Edit className="h-4 w-4 mr-2" />
          Editar Torneio
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-zinc-500 text-sm">Categorias</p>
          <p className="text-3xl font-black text-white">{tournament.categories.length}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-zinc-500 text-sm">Atletas</p>
          <p className="text-3xl font-black text-white">
            {tournament.categories.reduce((s, c) => s + c.athletes.length, 0)}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-zinc-500 text-sm">Lutas</p>
          <p className="text-3xl font-black text-white">
            {tournament.categories.reduce((s, c) => s + c.bracket.filter(m => m.status !== 'BYE').length, 0)}
          </p>
        </div>
      </div>

      {/* Categories list */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-zinc-400 uppercase">Categorias</h3>
        {tournament.categories.map(cat => (
          <div key={cat.id} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/10">
            <div>
              <span className="text-white font-bold">{cat.name}</span>
              <span className="text-zinc-500 text-sm ml-3">{cat.athletes.length} atletas</span>
            </div>
            <span className={cn(
              "text-xs font-bold px-2 py-1 rounded",
              cat.status === 'PENDING' && "bg-zinc-500/20 text-zinc-400",
              cat.status === 'IN_PROGRESS' && "bg-green-500/20 text-green-400",
              cat.status === 'FINISHED' && "bg-yellow-500/20 text-yellow-400",
            )}>
              {cat.status === 'PENDING' ? 'Pendente' :
               cat.status === 'IN_PROGRESS' ? 'Em Andamento' : 'Finalizada'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mat Assignment Tab ───

function MatAssignmentTab({ tournament, assignCategory, unassignCategory }: {
  tournament: NonNullable<ReturnType<typeof useTournament>['tournament']>;
  assignCategory: (matNumber: number, categoryId: string) => void;
  unassignCategory: (matNumber: number, categoryId: string) => void;
}) {
  // Find which mat each category is assigned to
  function getMatForCategory(categoryId: string): number | null {
    for (const [mat, ids] of Object.entries(tournament.matAssignments)) {
      if (ids.includes(categoryId)) return parseInt(mat);
    }
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Distribuição de Quadras</h2>
        <p className="text-zinc-500 text-sm">Defina em qual quadra cada categoria será disputada</p>
      </div>

      <div className="space-y-2">
        {tournament.categories.map(cat => {
          const currentMat = getMatForCategory(cat.id);
          return (
            <div key={cat.id} className="flex items-center gap-4 bg-white/5 rounded-lg px-4 py-3 border border-white/10">
              <div className="flex-1">
                <span className="text-white font-bold">{cat.name}</span>
                <span className="text-zinc-500 text-sm ml-3">
                  {cat.athletes.length} atletas · {cat.bracket.filter(m => m.status !== 'BYE').length} lutas
                </span>
              </div>
              <Select
                value={currentMat?.toString() || ''}
                onValueChange={(val) => {
                  // Unassign from old mat
                  if (currentMat) unassignCategory(currentMat, cat.id);
                  // Assign to new mat
                  if (val) assignCategory(parseInt(val), cat.id);
                }}
              >
                <SelectTrigger className="w-32 bg-transparent border-zinc-700 text-white">
                  <SelectValue placeholder="Quadra..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1E1E2E] border-zinc-700">
                  {MAT_NUMBERS.map(n => (
                    <SelectItem key={n} value={n.toString()} className="text-white">
                      Quadra {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      {/* Summary per mat */}
      <div>
        <h3 className="text-sm font-bold text-zinc-400 uppercase mb-3">Resumo por Quadra</h3>
        <div className="grid grid-cols-2 gap-3">
          {MAT_NUMBERS.filter(n => (tournament.matAssignments[n] || []).length > 0).map(n => {
            const catIds = tournament.matAssignments[n] || [];
            const cats = tournament.categories.filter(c => catIds.includes(c.id));
            const totalFights = cats.reduce((s, c) => s + c.bracket.filter(m => m.status !== 'BYE').length, 0);
            return (
              <div key={n} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-[hsl(var(--sulsport-yellow))] font-black text-lg">QUADRA {n}</h4>
                <p className="text-zinc-400 text-sm">{cats.length} categorias · {totalFights} lutas</p>
                <ul className="mt-2 space-y-1">
                  {cats.map(c => (
                    <li key={c.id} className="text-zinc-300 text-xs">{c.name}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Live Overview Tab ───

function LiveOverviewTab({ tournament, recordResult }: {
  tournament: NonNullable<ReturnType<typeof useTournament>['tournament']>;
  recordResult: (categoryId: string, matchId: string, winnerSide: 'RED' | 'BLUE') => void;
}) {
  const [expandedMat, setExpandedMat] = useState<number | null>(null);

  const activeMats = MAT_NUMBERS.filter(n => (tournament.matAssignments[n] || []).length > 0);

  if (activeMats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
        <Users className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg">Nenhuma quadra configurada</p>
        <p className="text-sm">Vá na aba "Quadras" para distribuir as categorias</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Visão Geral</h2>

      {activeMats.map(matNumber => {
        const catIds = tournament.matAssignments[matNumber] || [];
        const cats = tournament.categories.filter(c => catIds.includes(c.id));
        const totalFights = cats.reduce((s, c) => s + c.bracket.filter(m => m.status !== 'BYE').length, 0);
        const finishedFights = cats.reduce((s, c) => s + c.bracket.filter(m => m.status === 'FINISHED').length, 0);

        // Find current/next ready match for this mat
        let nextMatch: BracketMatch | undefined;
        let nextCat: Category | undefined;
        for (const cat of cats) {
          const m = getNextReadyMatch(cat.bracket);
          if (m) { nextMatch = m; nextCat = cat; break; }
        }

        const isExpanded = expandedMat === matNumber;

        return (
          <div key={matNumber} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            {/* Mat header */}
            <button
              onClick={() => setExpandedMat(isExpanded ? null : matNumber)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl font-black text-[hsl(var(--sulsport-yellow))]">
                  MAT {matNumber}
                </span>
                <span className="text-zinc-400 text-sm">
                  {finishedFights}/{totalFights} lutas
                </span>
                {/* Progress bar */}
                <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[hsl(var(--sulsport-yellow))] rounded-full transition-all"
                    style={{ width: totalFights > 0 ? `${(finishedFights / totalFights) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                {nextMatch && nextCat && (
                  <span className="text-sm text-zinc-400">
                    Próxima: <span className="text-white font-bold">{nextMatch.athleteRed?.name}</span>
                    {' vs '}
                    <span className="text-white font-bold">{nextMatch.athleteBlue?.name}</span>
                  </span>
                )}
                {isExpanded ? <ChevronUp className="h-5 w-5 text-zinc-500" /> : <ChevronDown className="h-5 w-5 text-zinc-500" />}
              </div>
            </button>

            {/* Expanded: show categories, matches, manual result entry */}
            {isExpanded && (
              <div className="border-t border-white/10 p-6 space-y-4">
                {cats.map(cat => (
                  <div key={cat.id}>
                    <h4 className="text-sm font-bold text-zinc-400 uppercase mb-2">{cat.name}</h4>
                    <div className="space-y-1">
                      {cat.bracket
                        .filter(m => m.status !== 'BYE')
                        .sort((a, b) => a.matchNumber - b.matchNumber)
                        .map(match => (
                          <div key={match.id} className="flex items-center gap-3 bg-white/5 rounded px-3 py-2 text-sm">
                            <span className="text-zinc-500 w-16">
                              Luta {String(match.matchNumber).padStart(3, '0')}
                            </span>
                            <span className={cn("font-bold", match.winnerSide === 'RED' ? "text-red-400" : "text-white/70")}>
                              {match.athleteRed?.name || '—'}
                            </span>
                            <span className="text-zinc-600">vs</span>
                            <span className={cn("font-bold", match.winnerSide === 'BLUE' ? "text-blue-400" : "text-white/70")}>
                              {match.athleteBlue?.name || '—'}
                            </span>
                            <span className="flex-1" />
                            {match.status === 'FINISHED' && (
                              <span className="text-green-400 text-xs font-bold">
                                <Trophy className="h-3 w-3 inline mr-1" />
                                {match.winnerSide === 'RED' ? match.athleteRed?.name : match.athleteBlue?.name}
                              </span>
                            )}
                            {match.status === 'READY' && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => recordResult(cat.id, match.id, 'RED')}
                                  className="h-7 text-xs border-red-800 text-red-400 hover:bg-red-500/20"
                                >
                                  Verm. Vence
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => recordResult(cat.id, match.id, 'BLUE')}
                                  className="h-7 text-xs border-blue-800 text-blue-400 hover:bg-blue-500/20"
                                >
                                  Azul Vence
                                </Button>
                              </div>
                            )}
                            {match.status === 'PENDING' && (
                              <span className="text-zinc-600 text-xs">Aguardando</span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
