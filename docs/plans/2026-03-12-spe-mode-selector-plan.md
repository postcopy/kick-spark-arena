# SPE Sulsport — Mode Selector + Multi-Mat Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a professional home screen to the SPE app where users choose their role (Central, Mat, TV, Chamada), and build the Central organizer page and Chamada call board.

**Architecture:** Single AppChampionship with new route `/` as mode selector. Central page embeds TournamentSetup and adds mat assignment + live overview. Chamada page reads tournament state from localStorage and shows upcoming fights per mat. Mat/TV pages get mat number from URL query param `?mat=N`.

**Tech Stack:** React 18, react-router-dom (HashRouter), TypeScript, Tailwind CSS, Lucide icons, BroadcastChannel API, localStorage.

**Design doc:** `docs/plans/2026-03-12-spe-mode-selector-design.md`

---

### Task 1: Add matAssignments to Tournament type

**Files:**
- Modify: `src/types/tournament.ts`

**Step 1: Add matAssignments field to Tournament interface**

In `src/types/tournament.ts`, add `matAssignments` to the `Tournament` interface (after `globalMatchCounter`):

```typescript
// Inside Tournament interface, add after globalMatchCounter:
  matAssignments: Record<number, string[]>; // mat number → category IDs
```

**Step 2: Update useTournament to initialize matAssignments**

In `src/hooks/useTournament.ts`, in the `createTournament` function, add `matAssignments: {}` to the new tournament object:

```typescript
const t: Tournament = {
  id: crypto.randomUUID(),
  name,
  date,
  location,
  categories: [],
  status: 'SETUP',
  createdAt: Date.now(),
  globalMatchCounter: 1,
  matAssignments: {},
};
```

**Step 3: Add mat assignment functions to useTournament**

Add these functions before the `return` in `useTournament()`:

```typescript
const assignCategoryToMat = useCallback((matNumber: number, categoryId: string) => {
  setTournament(prev => {
    if (!prev) return prev;
    const current = prev.matAssignments[matNumber] || [];
    if (current.includes(categoryId)) return prev;
    return {
      ...prev,
      matAssignments: {
        ...prev.matAssignments,
        [matNumber]: [...current, categoryId],
      },
    };
  });
}, []);

const unassignCategoryFromMat = useCallback((matNumber: number, categoryId: string) => {
  setTournament(prev => {
    if (!prev) return prev;
    const current = prev.matAssignments[matNumber] || [];
    return {
      ...prev,
      matAssignments: {
        ...prev.matAssignments,
        [matNumber]: current.filter(id => id !== categoryId),
      },
    };
  });
}, []);

const getCategoriesForMat = useCallback((matNumber: number): Category[] => {
  if (!tournament) return [];
  const ids = tournament.matAssignments[matNumber] || [];
  return tournament.categories.filter(c => ids.includes(c.id));
}, [tournament]);

const getNextMatchForMat = useCallback((matNumber: number): { category: Category; match: BracketMatch } | null => {
  if (!tournament) return null;
  const ids = tournament.matAssignments[matNumber] || [];
  for (const cat of tournament.categories) {
    if (!ids.includes(cat.id)) continue;
    const match = getNextReadyMatch(cat.bracket);
    if (match) return { category: cat, match };
  }
  return null;
}, [tournament]);
```

Add these to the return object:

```typescript
return {
  // ... existing returns ...
  assignCategoryToMat,
  unassignCategoryFromMat,
  getCategoriesForMat,
  getNextMatchForMat,
};
```

**Step 4: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors (or only pre-existing ones)

---

### Task 2: Create ModeSelectorPage

**Files:**
- Create: `src/pages/ModeSelectorPage.tsx`

**Step 1: Create the mode selector page**

```tsx
// Mode Selector — Home screen for SPE Sulsport championship app

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Swords, Tv, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import logoSpe from '@/assets/logo-spe-branca.png';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

const MODES = [
  {
    id: 'central',
    icon: Monitor,
    title: 'CENTRAL',
    description: 'Organizar torneio e gerenciar quadras',
    route: '/central',
    needsMat: false,
    color: 'from-yellow-500/10 to-yellow-500/5',
    iconColor: 'text-yellow-400',
  },
  {
    id: 'mat',
    icon: Swords,
    title: 'MAT',
    description: 'Operar lutas na quadra',
    route: '/championship/mat',
    needsMat: true,
    color: 'from-red-500/10 to-red-500/5',
    iconColor: 'text-red-400',
  },
  {
    id: 'tv',
    icon: Tv,
    title: 'TV',
    description: 'Placar e chaves no telão',
    route: '/championship/tv',
    needsMat: true,
    color: 'from-blue-500/10 to-blue-500/5',
    iconColor: 'text-blue-400',
  },
  {
    id: 'chamada',
    icon: Megaphone,
    title: 'CHAMADA',
    description: 'Próximas lutas no aquecimento',
    route: '/chamada',
    needsMat: false,
    color: 'from-green-500/10 to-green-500/5',
    iconColor: 'text-green-400',
  },
] as const;

const MAT_NUMBERS = [1, 2, 3, 4, 5, 6, 7];

export default function ModeSelectorPage() {
  const navigate = useNavigate();
  const [matDialogOpen, setMatDialogOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<typeof MODES[number] | null>(null);

  function handleModeClick(mode: typeof MODES[number]) {
    if (mode.needsMat) {
      setSelectedMode(mode);
      setMatDialogOpen(true);
    } else {
      navigate(mode.route);
    }
  }

  function handleMatSelect(matNumber: number) {
    if (!selectedMode) return;
    setMatDialogOpen(false);
    navigate(`${selectedMode.route}?mat=${matNumber}`);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center p-8">
      {/* Logo */}
      <img
        src={logoSpe}
        alt="SPE Sulsport"
        className="h-20 mb-2 object-contain"
      />
      <p className="text-zinc-500 text-sm mb-12 tracking-widest uppercase">
        Sistema Profissional de Eventos
      </p>

      {/* Mode Cards */}
      <div className="grid grid-cols-2 gap-6 max-w-2xl w-full">
        {MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => handleModeClick(mode)}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-4 p-8 rounded-2xl",
              "border border-white/10 bg-gradient-to-b transition-all duration-300",
              "hover:border-[hsl(var(--sulsport-yellow))]/50 hover:scale-[1.02]",
              "active:scale-[0.98]",
              mode.color,
            )}
          >
            <mode.icon className={cn("h-12 w-12", mode.iconColor)} />
            <div className="text-center">
              <h2 className="text-xl font-black text-white tracking-wider">
                {mode.title}
              </h2>
              <p className="text-sm text-zinc-400 mt-1">{mode.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Version */}
      <p className="mt-12 text-zinc-700 text-xs">v1.0.0</p>

      {/* Mat Number Dialog */}
      <AlertDialog open={matDialogOpen} onOpenChange={setMatDialogOpen}>
        <AlertDialogContent className="bg-[#141420] border-[#1E1E2E]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Selecione a Quadra
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Escolha o número da quadra (mat) para {selectedMode?.title}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-4 gap-3 py-4">
            {MAT_NUMBERS.map(n => (
              <Button
                key={n}
                variant="outline"
                onClick={() => handleMatSelect(n)}
                className="h-16 text-2xl font-black border-zinc-700 hover:bg-[hsl(var(--sulsport-yellow))]/20 hover:border-[hsl(var(--sulsport-yellow))]/50 hover:text-[hsl(var(--sulsport-yellow))]"
              >
                {n}
              </Button>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-zinc-300">
              Cancelar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

**Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

---

### Task 3: Update AppChampionship routes + Mat matId from URL

**Files:**
- Modify: `src/AppChampionship.tsx`
- Modify: `src/pages/ChampionshipMat.tsx` (line ~58, change hardcoded `matId = 1`)

**Step 1: Update AppChampionship routes**

Replace the full content of `src/AppChampionship.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SoundProvider } from "@/contexts/SoundContext";
import { SerialPortProvider } from "@/contexts/SerialPortContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import ModeSelectorPage from "./pages/ModeSelectorPage";
import ChampionshipMat from "./pages/ChampionshipMat";
import ChampionshipTV from "./pages/ChampionshipTV";
import TournamentSetup from "./pages/TournamentSetup";
import CentralPage from "./pages/CentralPage";
import ChamadaPage from "./pages/ChamadaPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 60 * 24,
      retry: false,
    },
  },
});

const AppChampionship = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SoundProvider>
        <SerialPortProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <HashRouter>
              <Routes>
                <Route path="/" element={<ModeSelectorPage />} />
                <Route path="/central" element={<CentralPage />} />
                <Route path="/championship/mat" element={<ChampionshipMat />} />
                <Route path="/championship/tv" element={<ChampionshipTV />} />
                <Route path="/championship/tournament" element={<TournamentSetup />} />
                <Route path="/chamada" element={<ChamadaPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </HashRouter>
          </TooltipProvider>
        </SerialPortProvider>
      </SoundProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default AppChampionship;
```

**Step 2: Make ChampionshipMat read matId from URL**

In `src/pages/ChampionshipMat.tsx`, find the line:

```typescript
const matId = 1;
```

Replace with:

```typescript
import { useSearchParams } from 'react-router-dom';
```

Add at top of imports (if not already present), then inside the component function replace `const matId = 1;` with:

```typescript
const [searchParams] = useSearchParams();
const matId = parseInt(searchParams.get('mat') || '1');
```

Note: `useSearchParams` may already be imported — check first. The TV page already reads matId from URL this way.

**Step 3: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: Errors for missing CentralPage and ChamadaPage (expected — we create them next)

---

### Task 4: Create CentralPage — Tournament Organizer Command Center

**Files:**
- Create: `src/pages/CentralPage.tsx`

**Step 1: Create the Central page**

This page has 3 tabs: Tournament Setup (reuses existing), Mat Assignment, and Live Overview.

```tsx
// Central Page — Tournament organizer command center

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Layout, Users, Radio, Edit, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
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
import { BracketView } from '@/components/championship/BracketView';
import { getNextReadyMatch } from '@/hooks/useBracketGenerator';
import type { Category, BracketMatch } from '@/types/tournament';

type Tab = 'setup' | 'mats' | 'live';

const MAT_NUMBERS = [1, 2, 3, 4, 5, 6, 7];

export default function CentralPage() {
  const navigate = useNavigate();
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
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-3 border-b border-white/10 bg-[#0A0A0F]">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
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
```

**Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: Error only for missing ChamadaPage

---

### Task 5: Create ChamadaPage — Call Board for Warm-Up Area

**Files:**
- Create: `src/pages/ChamadaPage.tsx`

**Step 1: Create the Chamada page**

```tsx
// Chamada Page — Shows upcoming fights per mat on a large display
// Designed for readability from distance in the warm-up area

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import logoSpe from '@/assets/logo-spe-branca.png';
import { useTournament } from '@/hooks/useTournament';
import { getNextReadyMatch } from '@/hooks/useBracketGenerator';
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
          onClick={() => navigate('/')}
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
      <header className="flex items-center gap-4 px-8 py-4 border-b border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <img src={logoSpe} alt="SPE" className="h-8" />
        <h1 className="text-white font-bold text-xl flex-1">PRÓXIMAS LUTAS</h1>
        <Megaphone className="h-6 w-6 text-[hsl(var(--sulsport-yellow))]" />
      </header>

      {/* Fight list */}
      <div className="flex-1 overflow-auto p-8">
        {fights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <p className="text-2xl">Nenhuma luta programada</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(byMat.entries()).map(([matNumber, matFights]) => (
              <div key={matNumber}>
                <h2 className="text-[hsl(var(--sulsport-yellow))] font-black text-3xl mb-4 tracking-wider">
                  QUADRA {matNumber}
                </h2>
                <div className="space-y-2">
                  {matFights.map((f, i) => (
                    <div
                      key={f.match.id}
                      className={cn(
                        "flex items-center gap-6 rounded-xl px-8 py-5 border transition-all",
                        f.isCurrent
                          ? "bg-[hsl(var(--sulsport-yellow))]/10 border-[hsl(var(--sulsport-yellow))]/30 scale-[1.01]"
                          : "bg-white/5 border-white/10",
                      )}
                    >
                      {/* Status badge */}
                      <span className={cn(
                        "text-xs font-black uppercase px-3 py-1 rounded-full whitespace-nowrap",
                        f.isCurrent
                          ? "bg-[hsl(var(--sulsport-yellow))]/20 text-[hsl(var(--sulsport-yellow))]"
                          : "bg-white/10 text-zinc-400",
                      )}>
                        {f.isCurrent ? 'PRÓXIMA' : `${i + 1}ª`}
                      </span>

                      {/* Category */}
                      <span className="text-zinc-400 text-lg w-64 truncate">
                        {f.category.name}
                      </span>

                      {/* Athletes */}
                      <div className="flex-1 flex items-center gap-4 text-2xl font-black">
                        <span className="text-[hsl(var(--sulsport-red))]">
                          {f.match.athleteRed?.name || '—'}
                        </span>
                        <span className="text-zinc-600 text-lg">VS</span>
                        <span className="text-[hsl(var(--sulsport-blue))]">
                          {f.match.athleteBlue?.name || '—'}
                        </span>
                      </div>

                      {/* Match number */}
                      <span className="text-zinc-500 text-sm">
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
```

**Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

---

### Task 6: Full Build Verification

**Step 1: Type check**

Run: `npx tsc --noEmit --pretty`
Expected: No errors

**Step 2: Build championship**

Run: `npm run build:championship`
Expected: Build succeeds

**Step 3: Build installer**

Run: `npm run electron:build:championship`
Expected: `release-championship/SPE-Sulsport-Setup-*.exe` created

**Step 4: Dev smoke test**

Run: `npm run electron:dev:championship`
Expected:
- App opens to mode selector with 4 cards
- Click "CENTRAL" → goes to tournament organizer page
- Click "MAT" → asks for mat number → goes to fight operator
- Click "TV" → asks for mat number → goes to scoreboard
- Click "CHAMADA" → shows upcoming fights board
