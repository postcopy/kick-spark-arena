# Academy Registration System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a public web page where coaches register athletes for tournaments via a shared link, with organizer approval in Central.

**Architecture:** New Supabase tables with public RLS for coach-facing pages (no auth required) and authenticated RLS for organizer pages. Public registration is a new set of routes in the existing championship app (`AppChampionship.tsx`). Coaches identified by phone number, athletes persisted in cloud for reuse.

**Tech Stack:** React 18 + TypeScript + Tailwind CSS + Supabase (Postgres + RLS) + Vite + HashRouter

---

## Task 1: Supabase Migration — New Tables

**Files:**
- Create: `supabase/migrations/20260312200000_academy_registration_tables.sql`

**Step 1: Write the migration SQL**

```sql
-- ============================================================
-- Academy Registration System — 5 new tables
-- ============================================================

-- 1. open_tournaments: tournaments open for public registration
CREATE TABLE public.open_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  registration_deadline TIMESTAMPTZ,
  fee_amount NUMERIC(10,2),
  fee_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_open_tournaments_created_by ON public.open_tournaments(created_by);
CREATE INDEX idx_open_tournaments_status ON public.open_tournaments(status);

ALTER TABLE public.open_tournaments ENABLE ROW LEVEL SECURITY;

-- Anyone can read open tournaments (public registration page)
CREATE POLICY "Anyone can view open tournaments"
  ON public.open_tournaments FOR SELECT
  USING (true);

-- Only creator can insert/update/delete
CREATE POLICY "Creator can manage own tournaments"
  ON public.open_tournaments FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- 2. academy_coaches: coach/academy identified by phone
CREATE TABLE public.academy_coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_name TEXT NOT NULL,
  coach_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_academy_coaches_phone ON public.academy_coaches(phone);

ALTER TABLE public.academy_coaches ENABLE ROW LEVEL SECURITY;

-- Public access: anyone can read/insert/update (no auth required)
CREATE POLICY "Public read academy_coaches"
  ON public.academy_coaches FOR SELECT
  USING (true);

CREATE POLICY "Public insert academy_coaches"
  ON public.academy_coaches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update academy_coaches"
  ON public.academy_coaches FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 3. academy_athletes: persistent athletes belonging to a coach
CREATE TABLE public.academy_athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.academy_coaches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('M', 'F')),
  belt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_academy_athletes_coach ON public.academy_athletes(coach_id);

ALTER TABLE public.academy_athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read academy_athletes"
  ON public.academy_athletes FOR SELECT
  USING (true);

CREATE POLICY "Public insert academy_athletes"
  ON public.academy_athletes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update academy_athletes"
  ON public.academy_athletes FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 4. tournament_registrations: one per academy per tournament
CREATE TABLE public.tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.open_tournaments(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.academy_coaches(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(tournament_id, coach_id)
);

CREATE INDEX idx_tournament_registrations_tournament ON public.tournament_registrations(tournament_id);
CREATE INDEX idx_tournament_registrations_coach ON public.tournament_registrations(coach_id);
CREATE INDEX idx_tournament_registrations_status ON public.tournament_registrations(status);

ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tournament_registrations"
  ON public.tournament_registrations FOR SELECT
  USING (true);

CREATE POLICY "Public insert tournament_registrations"
  ON public.tournament_registrations FOR INSERT
  WITH CHECK (true);

-- Only organizer (tournament creator) can update status
CREATE POLICY "Organizer can update registrations"
  ON public.tournament_registrations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.open_tournaments t
      WHERE t.id = tournament_id AND t.created_by = auth.uid()
    )
  );

-- 5. registration_athletes: athletes in a specific registration
CREATE TABLE public.registration_athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.academy_athletes(id) ON DELETE CASCADE,
  weight NUMERIC(5,2) NOT NULL,
  belt TEXT NOT NULL,
  category TEXT,
  reviewed_by_coach BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_registration_athletes_registration ON public.registration_athletes(registration_id);
CREATE INDEX idx_registration_athletes_athlete ON public.registration_athletes(athlete_id);

ALTER TABLE public.registration_athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read registration_athletes"
  ON public.registration_athletes FOR SELECT
  USING (true);

CREATE POLICY "Public insert registration_athletes"
  ON public.registration_athletes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update registration_athletes"
  ON public.registration_athletes FOR UPDATE
  USING (true)
  WITH CHECK (true);
```

**Step 2: Apply the migration**

Run: `npx supabase db push` (or apply via Supabase dashboard)
Expected: All 5 tables created with RLS policies

**Step 3: Regenerate Supabase types**

Run: `npx supabase gen types typescript --project-id <PROJECT_ID> > src/integrations/supabase/types.ts`
Expected: New tables appear in `Database["public"]["Tables"]`

> **Note:** If Supabase CLI is not configured locally, apply migration via SQL Editor in Supabase dashboard and manually update types file.

**Step 4: Commit**

```bash
git add supabase/migrations/ src/integrations/supabase/types.ts
git commit -m "feat: add 5 registration tables with RLS policies"
```

---

## Task 2: TypeScript Types for Registration

**Files:**
- Create: `src/types/registration.ts`

**Step 1: Create the types file**

```typescript
// src/types/registration.ts

export interface OpenTournament {
  id: string;
  name: string;
  date: string;
  location: string | null;
  registration_deadline: string | null;
  fee_amount: number | null;
  fee_instructions: string | null;
  status: 'open' | 'closed';
  created_by: string;
  created_at: string;
}

export interface AcademyCoach {
  id: string;
  academy_name: string;
  coach_name: string;
  phone: string;
  created_at: string;
}

export interface AcademyAthlete {
  id: string;
  coach_id: string;
  name: string;
  birth_date: string;
  gender: 'M' | 'F';
  belt: string;
  created_at: string;
}

export interface TournamentRegistration {
  id: string;
  tournament_id: string;
  coach_id: string;
  status: 'pending' | 'approved' | 'rejected';
  payment_status: 'pending' | 'paid';
  submitted_at: string;
  reviewed_at: string | null;
}

export interface RegistrationAthlete {
  id: string;
  registration_id: string;
  athlete_id: string;
  weight: number;
  belt: string;
  category: string | null;
  reviewed_by_coach: boolean;
}

// Category calculation
export const BELT_ORDER = [
  'branca', 'amarela', 'verde', 'azul', 'vermelha', 'preta'
] as const;

export const AGE_CATEGORIES = [
  { name: 'Mirim', minAge: 4, maxAge: 6 },
  { name: 'Infantil', minAge: 7, maxAge: 10 },
  { name: 'Infanto-Juvenil', minAge: 11, maxAge: 14 },
  { name: 'Juvenil', minAge: 15, maxAge: 17 },
  { name: 'Adulto', minAge: 18, maxAge: 34 },
  { name: 'Master', minAge: 35, maxAge: 99 },
] as const;

export function calculateAge(birthDate: string, referenceDate: string): number {
  const birth = new Date(birthDate);
  const ref = new Date(referenceDate);
  let age = ref.getFullYear() - birth.getFullYear();
  const monthDiff = ref.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function calculateCategory(
  birthDate: string,
  gender: 'M' | 'F',
  belt: string,
  weight: number,
  tournamentDate: string
): string {
  const age = calculateAge(birthDate, tournamentDate);
  const ageCategory = AGE_CATEGORIES.find(c => age >= c.minAge && age <= c.maxAge);
  const ageName = ageCategory?.name || 'Adulto';
  const genderLabel = gender === 'M' ? 'Masculino' : 'Feminino';
  return `${ageName} / ${genderLabel} / ${belt} / ${weight}kg`;
}

// Registration flow step
export type RegistrationStep = 'identification' | 'athletes' | 'review' | 'confirmation';
```

**Step 2: Commit**

```bash
git add src/types/registration.ts
git commit -m "feat: add registration types and category calculation"
```

---

## Task 3: Supabase Hook for Registration Data

**Files:**
- Create: `src/hooks/useRegistration.ts`

**Step 1: Create the hook**

```typescript
// src/hooks/useRegistration.ts
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  AcademyCoach,
  AcademyAthlete,
  OpenTournament,
  RegistrationAthlete,
} from '@/types/registration';
import { calculateCategory } from '@/types/registration';

interface UseRegistrationReturn {
  // State
  tournament: OpenTournament | null;
  coach: AcademyCoach | null;
  savedAthletes: AcademyAthlete[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTournament: (tournamentId: string) => Promise<boolean>;
  identifyCoach: (phone: string, academyName: string, coachName: string) => Promise<AcademyCoach | null>;
  loadAthletes: (coachId: string) => Promise<void>;
  addAthlete: (athlete: Omit<AcademyAthlete, 'id' | 'coach_id' | 'created_at'>, coachId: string) => Promise<AcademyAthlete | null>;
  updateAthlete: (athleteId: string, updates: Partial<Pick<AcademyAthlete, 'name' | 'birth_date' | 'gender' | 'belt'>>) => Promise<boolean>;
  submitRegistration: (
    tournamentId: string,
    coachId: string,
    athletes: { athleteId: string; weight: number; belt: string; category: string }[]
  ) => Promise<string | null>; // returns registration ID
}

export function useRegistration(): UseRegistrationReturn {
  const [tournament, setTournament] = useState<OpenTournament | null>(null);
  const [coach, setCoach] = useState<AcademyCoach | null>(null);
  const [savedAthletes, setSavedAthletes] = useState<AcademyAthlete[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTournament = useCallback(async (tournamentId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('open_tournaments')
        .select('*')
        .eq('id', tournamentId)
        .eq('status', 'open')
        .single();

      if (err || !data) {
        setError('Torneio não encontrado ou inscrições encerradas.');
        return false;
      }
      setTournament(data as unknown as OpenTournament);
      return true;
    } catch {
      setError('Erro ao carregar torneio.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const identifyCoach = useCallback(async (
    phone: string,
    academyName: string,
    coachName: string
  ): Promise<AcademyCoach | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // Try to find existing coach by phone
      const { data: existing } = await supabase
        .from('academy_coaches')
        .select('*')
        .eq('phone', phone)
        .single();

      if (existing) {
        const c = existing as unknown as AcademyCoach;
        setCoach(c);
        return c;
      }

      // Create new coach
      const { data: created, error: err } = await supabase
        .from('academy_coaches')
        .insert({ phone, academy_name: academyName, coach_name: coachName })
        .select()
        .single();

      if (err || !created) {
        setError('Erro ao criar cadastro. Tente novamente.');
        return null;
      }

      const c = created as unknown as AcademyCoach;
      setCoach(c);
      return c;
    } catch {
      setError('Erro de conexão.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAthletes = useCallback(async (coachId: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('academy_athletes')
        .select('*')
        .eq('coach_id', coachId)
        .order('name');

      setSavedAthletes((data || []) as unknown as AcademyAthlete[]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addAthlete = useCallback(async (
    athlete: Omit<AcademyAthlete, 'id' | 'coach_id' | 'created_at'>,
    coachId: string
  ): Promise<AcademyAthlete | null> => {
    setIsLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('academy_athletes')
        .insert({ ...athlete, coach_id: coachId })
        .select()
        .single();

      if (err || !data) {
        setError('Erro ao adicionar atleta.');
        return null;
      }

      const a = data as unknown as AcademyAthlete;
      setSavedAthletes(prev => [...prev, a].sort((x, y) => x.name.localeCompare(y.name)));
      return a;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateAthlete = useCallback(async (
    athleteId: string,
    updates: Partial<Pick<AcademyAthlete, 'name' | 'birth_date' | 'gender' | 'belt'>>
  ): Promise<boolean> => {
    const { error: err } = await supabase
      .from('academy_athletes')
      .update(updates)
      .eq('id', athleteId);

    if (!err) {
      setSavedAthletes(prev =>
        prev.map(a => a.id === athleteId ? { ...a, ...updates } : a)
      );
    }
    return !err;
  }, []);

  const submitRegistration = useCallback(async (
    tournamentId: string,
    coachId: string,
    athletes: { athleteId: string; weight: number; belt: string; category: string }[]
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // Create registration
      const { data: reg, error: regErr } = await supabase
        .from('tournament_registrations')
        .insert({ tournament_id: tournamentId, coach_id: coachId })
        .select()
        .single();

      if (regErr || !reg) {
        if (regErr?.code === '23505') {
          setError('Sua academia já está inscrita neste torneio.');
        } else {
          setError('Erro ao enviar inscrição.');
        }
        return null;
      }

      // Insert registration athletes
      const regAthletes = athletes.map(a => ({
        registration_id: reg.id,
        athlete_id: a.athleteId,
        weight: a.weight,
        belt: a.belt,
        category: a.category,
        reviewed_by_coach: true,
      }));

      const { error: athErr } = await supabase
        .from('registration_athletes')
        .insert(regAthletes);

      if (athErr) {
        setError('Erro ao registrar atletas.');
        return null;
      }

      return reg.id;
    } catch {
      setError('Erro de conexão.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    tournament, coach, savedAthletes, isLoading, error,
    loadTournament, identifyCoach, loadAthletes, addAthlete, updateAthlete, submitRegistration,
  };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useRegistration.ts
git commit -m "feat: add useRegistration hook for Supabase CRUD"
```

---

## Task 4: Registration Page — 4-Screen Flow

**Files:**
- Create: `src/pages/PublicRegistration.tsx`

**Step 1: Create the full registration page**

This is a large component with 4 internal steps. Create the file with all 4 screens:

```typescript
// src/pages/PublicRegistration.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRegistration } from '@/hooks/useRegistration';
import {
  calculateCategory,
  type AcademyAthlete,
  type RegistrationStep,
} from '@/types/registration';
import {
  UserCircle, Users, ClipboardCheck, CheckCircle2,
  Plus, Pencil, Loader2, AlertTriangle, ArrowLeft, ArrowRight,
} from 'lucide-react';

// ─── Selected athlete with weight for this tournament ───
interface SelectedAthlete {
  athlete: AcademyAthlete;
  weight: number;
  belt: string;
  category: string;
  reviewed: boolean;
}

export default function PublicRegistration() {
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get('t');

  const {
    tournament, coach, savedAthletes, isLoading, error,
    loadTournament, identifyCoach, loadAthletes, addAthlete, updateAthlete, submitRegistration,
  } = useRegistration();

  const [step, setStep] = useState<RegistrationStep>('identification');
  const [registrationId, setRegistrationId] = useState<string | null>(null);

  // Step 1: Identification form
  const [phone, setPhone] = useState('');
  const [academyName, setAcademyName] = useState('');
  const [coachName, setCoachName] = useState('');

  // Step 2: Athletes selection
  const [selectedAthletes, setSelectedAthletes] = useState<SelectedAthlete[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // New athlete form
  const [newName, setNewName] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [newGender, setNewGender] = useState<'M' | 'F'>('M');
  const [newBelt, setNewBelt] = useState('branca');
  const [newWeight, setNewWeight] = useState('');

  // Load tournament on mount
  useEffect(() => {
    if (tournamentId) {
      loadTournament(tournamentId);
    }
  }, [tournamentId, loadTournament]);

  // ─── Handlers ───

  const handleIdentify = async () => {
    if (!phone.trim() || !academyName.trim() || !coachName.trim()) return;
    const c = await identifyCoach(phone.trim(), academyName.trim(), coachName.trim());
    if (c) {
      // Pre-fill form if returning coach
      setAcademyName(c.academy_name);
      setCoachName(c.coach_name);
      await loadAthletes(c.id);
      setStep('athletes');
    }
  };

  const toggleAthlete = (athlete: AcademyAthlete, weight: number) => {
    const exists = selectedAthletes.find(s => s.athlete.id === athlete.id);
    if (exists) {
      setSelectedAthletes(prev => prev.filter(s => s.athlete.id !== athlete.id));
    } else {
      const category = tournament
        ? calculateCategory(athlete.birth_date, athlete.gender, athlete.belt, weight, tournament.date)
        : '';
      setSelectedAthletes(prev => [...prev, {
        athlete,
        weight,
        belt: athlete.belt,
        category,
        reviewed: false,
      }]);
    }
  };

  const handleAddAthlete = async () => {
    if (!coach || !newName.trim() || !newBirthDate || !newWeight) return;
    const created = await addAthlete({
      name: newName.trim(),
      birth_date: newBirthDate,
      gender: newGender,
      belt: newBelt,
    }, coach.id);

    if (created) {
      // Auto-select the newly created athlete
      const weight = parseFloat(newWeight);
      const category = tournament
        ? calculateCategory(created.birth_date, created.gender, created.belt, weight, tournament.date)
        : '';
      setSelectedAthletes(prev => [...prev, {
        athlete: created,
        weight,
        belt: created.belt,
        category,
        reviewed: false,
      }]);
      // Reset form
      setNewName('');
      setNewBirthDate('');
      setNewGender('M');
      setNewBelt('branca');
      setNewWeight('');
      setShowAddModal(false);
    }
  };

  const toggleReviewed = (athleteId: string) => {
    setSelectedAthletes(prev =>
      prev.map(s => s.athlete.id === athleteId ? { ...s, reviewed: !s.reviewed } : s)
    );
  };

  const allReviewed = selectedAthletes.length > 0 && selectedAthletes.every(s => s.reviewed);

  const handleSubmit = async () => {
    if (!tournament || !coach || !allReviewed) return;
    const athletes = selectedAthletes.map(s => ({
      athleteId: s.athlete.id,
      weight: s.weight,
      belt: s.belt,
      category: s.category,
    }));
    const regId = await submitRegistration(tournament.id, coach.id, athletes);
    if (regId) {
      setRegistrationId(regId);
      setStep('confirmation');
    }
  };

  // ─── No tournament ID ───
  if (!tournamentId) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
        <div className="text-center text-white">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Link Inválido</h1>
          <p className="text-zinc-400">Este link de inscrição não é válido. Solicite um novo link ao organizador.</p>
        </div>
      </div>
    );
  }

  // ─── Loading tournament ───
  if (!tournament && isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
      </div>
    );
  }

  // ─── Tournament not found ───
  if (!tournament && !isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
        <div className="text-center text-white">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Torneio Não Encontrado</h1>
          <p className="text-zinc-400">{error || 'Este torneio não existe ou as inscrições foram encerradas.'}</p>
        </div>
      </div>
    );
  }

  // ─── Step indicator ───
  const steps: { key: RegistrationStep; label: string; icon: React.ElementType }[] = [
    { key: 'identification', label: 'Identificação', icon: UserCircle },
    { key: 'athletes', label: 'Atletas', icon: Users },
    { key: 'review', label: 'Revisão', icon: ClipboardCheck },
    { key: 'confirmation', label: 'Confirmação', icon: CheckCircle2 },
  ];

  const stepIndex = steps.findIndex(s => s.key === step);

  const BELTS = ['branca', 'amarela', 'verde', 'azul', 'vermelha', 'preta'];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      <div className="bg-[#141420] border-b border-[#1E1E2E] px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <img src="/logo-sfighter.png" alt="S-FIGHT" className="h-8" />
            <h1 className="text-xl font-bold">Inscrição — {tournament?.name}</h1>
          </div>
          <p className="text-zinc-500 text-sm">
            {tournament?.date && new Date(tournament.date).toLocaleDateString('pt-BR')}
            {tournament?.location && ` • ${tournament.location}`}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="max-w-3xl mx-auto px-6 py-4">
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === stepIndex;
            const isDone = i < stepIndex;
            return (
              <div key={s.key} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-red-500/20 text-red-400' :
                  isDone ? 'bg-green-500/10 text-green-400' :
                  'bg-[#1E1E2E] text-zinc-500'
                }`}>
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px ${isDone ? 'bg-green-500/30' : 'bg-[#1E1E2E]'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-6 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* STEP 1: IDENTIFICATION                      */}
        {/* ════════════════════════════════════════════ */}
        {step === 'identification' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-1">Identificação da Academia</h2>
              <p className="text-zinc-500 text-sm">Informe seus dados. Se já se inscreveu antes, seus atletas serão carregados automaticamente.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Telefone (WhatsApp) *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(51) 99999-9999"
                  className="w-full bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:border-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Nome da Academia *</label>
                <input
                  type="text"
                  value={academyName}
                  onChange={e => setAcademyName(e.target.value)}
                  placeholder="Ex: Academia Tiger TKD"
                  className="w-full bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:border-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Nome do Responsável *</label>
                <input
                  type="text"
                  value={coachName}
                  onChange={e => setCoachName(e.target.value)}
                  placeholder="Ex: Mestre João Silva"
                  className="w-full bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleIdentify}
              disabled={isLoading || !phone.trim() || !academyName.trim() || !coachName.trim()}
              className="w-full bg-gradient-to-r from-[#E11D48] to-[#9F1239] hover:from-[#C81840] hover:to-[#8F1035] disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              Continuar
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* STEP 2: ATHLETES                            */}
        {/* ════════════════════════════════════════════ */}
        {step === 'athletes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold mb-1">Selecionar Atletas</h2>
                <p className="text-zinc-500 text-sm">
                  {coach?.academy_name} • {selectedAthletes.length} selecionado(s)
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[#1E1E2E] hover:bg-[#2E2E3E] border border-[#2E2E3E] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Novo Atleta
              </button>
            </div>

            {/* Athlete list */}
            <div className="space-y-2">
              {savedAthletes.length === 0 && (
                <div className="text-center py-12 text-zinc-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum atleta cadastrado. Clique em "Novo Atleta" para adicionar.</p>
                </div>
              )}
              {savedAthletes.map(athlete => {
                const selected = selectedAthletes.find(s => s.athlete.id === athlete.id);
                return (
                  <div
                    key={athlete.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-[#141420] border-[#1E1E2E] hover:border-[#2E2E3E]'
                    }`}
                    onClick={() => {
                      if (!selected) {
                        // Need weight input — for now use a prompt
                        const w = prompt(`Peso de ${athlete.name} (kg):`, '50');
                        if (w) toggleAthlete(athlete, parseFloat(w));
                      } else {
                        toggleAthlete(athlete, 0);
                      }
                    }}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selected ? 'bg-red-500 border-red-500' : 'border-zinc-600'
                    }`}>
                      {selected && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{athlete.name}</p>
                      <p className="text-zinc-500 text-sm">
                        {athlete.gender === 'M' ? 'Masculino' : 'Feminino'} • {athlete.belt}
                        {selected && ` • ${selected.weight}kg`}
                      </p>
                    </div>
                    {selected && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                        {selected.category}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('identification')}
                className="flex-1 bg-[#1E1E2E] hover:bg-[#2E2E3E] text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" /> Voltar
              </button>
              <button
                onClick={() => setStep('review')}
                disabled={selectedAthletes.length === 0}
                className="flex-1 bg-gradient-to-r from-[#E11D48] to-[#9F1239] hover:from-[#C81840] hover:to-[#8F1035] disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                Revisar <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* ─── Add Athlete Modal ─── */}
            {showAddModal && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-[#141420] border border-[#1E1E2E] rounded-xl p-6 w-full max-w-md space-y-4">
                  <h3 className="text-lg font-bold">Novo Atleta</h3>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Nome Completo *</label>
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                      className="w-full bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Data de Nascimento *</label>
                    <input type="date" value={newBirthDate} onChange={e => setNewBirthDate(e.target.value)}
                      className="w-full bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Gênero *</label>
                      <select value={newGender} onChange={e => setNewGender(e.target.value as 'M' | 'F')}
                        className="w-full bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none">
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Faixa *</label>
                      <select value={newBelt} onChange={e => setNewBelt(e.target.value)}
                        className="w-full bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none">
                        {BELTS.map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Peso (kg) *</label>
                    <input type="number" step="0.1" value={newWeight} onChange={e => setNewWeight(e.target.value)}
                      placeholder="Ex: 52.5"
                      className="w-full bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none" />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowAddModal(false)}
                      className="flex-1 bg-[#1E1E2E] hover:bg-[#2E2E3E] text-white py-2 rounded-lg">
                      Cancelar
                    </button>
                    <button onClick={handleAddAthlete}
                      disabled={!newName.trim() || !newBirthDate || !newWeight || isLoading}
                      className="flex-1 bg-gradient-to-r from-[#E11D48] to-[#9F1239] disabled:opacity-50 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2">
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* STEP 3: REVIEW                              */}
        {/* ════════════════════════════════════════════ */}
        {step === 'review' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-1">Revisão Obrigatória</h2>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 text-yellow-400 text-sm flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Confira todos os dados de cada atleta. Erros podem gerar lutas com categorias incorretas. Marque cada atleta como revisado para continuar.</span>
              </div>
            </div>

            <div className="space-y-3">
              {selectedAthletes.map(s => (
                <div
                  key={s.athlete.id}
                  onClick={() => toggleReviewed(s.athlete.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    s.reviewed
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-[#141420] border-[#1E1E2E] hover:border-yellow-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      s.reviewed ? 'bg-green-500 border-green-500' : 'border-zinc-600'
                    }`}>
                      {s.reviewed && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{s.athlete.name}</p>
                      <p className="text-zinc-400 text-sm">
                        {s.athlete.gender === 'M' ? 'Masc' : 'Fem'} • {s.belt} • {s.weight}kg
                      </p>
                    </div>
                    <span className="text-xs bg-[#1E1E2E] text-zinc-300 px-3 py-1 rounded-full">
                      {s.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-zinc-500">
              {selectedAthletes.filter(s => s.reviewed).length} de {selectedAthletes.length} revisado(s)
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('athletes')}
                className="flex-1 bg-[#1E1E2E] hover:bg-[#2E2E3E] text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" /> Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!allReviewed || isLoading}
                className="flex-1 bg-gradient-to-r from-[#E11D48] to-[#9F1239] hover:from-[#C81840] hover:to-[#8F1035] disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Enviar Inscrição
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* STEP 4: CONFIRMATION                        */}
        {/* ════════════════════════════════════════════ */}
        {step === 'confirmation' && (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Inscrição Enviada!</h2>
              <p className="text-zinc-400">
                {coach?.academy_name} — {selectedAthletes.length} atleta(s)
              </p>
            </div>

            {registrationId && (
              <div className="bg-[#141420] border border-[#1E1E2E] rounded-lg p-4 text-sm">
                <p className="text-zinc-500 mb-1">Protocolo</p>
                <p className="font-mono text-lg text-white">{registrationId.slice(0, 8).toUpperCase()}</p>
              </div>
            )}

            {tournament?.fee_amount && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-left">
                <p className="text-yellow-400 font-bold mb-1">
                  Valor da inscrição: R$ {tournament.fee_amount.toFixed(2)}
                </p>
                {tournament.fee_instructions && (
                  <p className="text-zinc-300 text-sm whitespace-pre-wrap">{tournament.fee_instructions}</p>
                )}
              </div>
            )}

            <div className="bg-[#141420] border border-[#1E1E2E] rounded-lg p-4 text-sm text-zinc-400">
              Aguarde a aprovação do organizador. Você será notificado pelo WhatsApp quando sua inscrição for confirmada.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/pages/PublicRegistration.tsx
git commit -m "feat: add public registration page with 4-step flow"
```

---

## Task 5: Organizer — Create/Manage Open Tournaments

**Files:**
- Create: `src/hooks/useOpenTournaments.ts`

**Step 1: Create the hook for organizer tournament management**

```typescript
// src/hooks/useOpenTournaments.ts
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { OpenTournament, TournamentRegistration, AcademyCoach, RegistrationAthlete, AcademyAthlete } from '@/types/registration';

interface RegistrationWithDetails extends TournamentRegistration {
  coach: AcademyCoach;
  athletes: (RegistrationAthlete & { athlete: AcademyAthlete })[];
}

export function useOpenTournaments(userId: string | undefined) {
  const [tournaments, setTournaments] = useState<OpenTournament[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTournaments = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('open_tournaments')
        .select('*')
        .eq('created_by', userId)
        .order('date', { ascending: false });
      setTournaments((data || []) as unknown as OpenTournament[]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const createTournament = useCallback(async (
    tournament: Pick<OpenTournament, 'name' | 'date' | 'location' | 'registration_deadline' | 'fee_amount' | 'fee_instructions'>
  ): Promise<OpenTournament | null> => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('open_tournaments')
      .insert({ ...tournament, created_by: userId })
      .select()
      .single();
    if (error || !data) return null;
    const t = data as unknown as OpenTournament;
    setTournaments(prev => [t, ...prev]);
    return t;
  }, [userId]);

  const closeTournament = useCallback(async (tournamentId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('open_tournaments')
      .update({ status: 'closed' })
      .eq('id', tournamentId);
    if (!error) {
      setTournaments(prev => prev.map(t => t.id === tournamentId ? { ...t, status: 'closed' } : t));
    }
    return !error;
  }, []);

  const loadRegistrations = useCallback(async (tournamentId: string) => {
    setIsLoading(true);
    try {
      // Load registrations with coach details
      const { data: regs } = await supabase
        .from('tournament_registrations')
        .select('*, academy_coaches(*)')
        .eq('tournament_id', tournamentId)
        .order('submitted_at', { ascending: false });

      if (!regs) { setRegistrations([]); return; }

      // Load athletes for each registration
      const regIds = regs.map((r: any) => r.id);
      const { data: regAthletes } = await supabase
        .from('registration_athletes')
        .select('*, academy_athletes(*)')
        .in('registration_id', regIds);

      const mapped = regs.map((r: any) => ({
        ...r,
        coach: r.academy_coaches,
        athletes: (regAthletes || [])
          .filter((a: any) => a.registration_id === r.id)
          .map((a: any) => ({ ...a, athlete: a.academy_athletes })),
      }));

      setRegistrations(mapped as unknown as RegistrationWithDetails[]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateRegistrationStatus = useCallback(async (
    registrationId: string,
    status: 'approved' | 'rejected'
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('tournament_registrations')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', registrationId);
    if (!error) {
      setRegistrations(prev =>
        prev.map(r => r.id === registrationId ? { ...r, status, reviewed_at: new Date().toISOString() } : r)
      );
    }
    return !error;
  }, []);

  const updatePaymentStatus = useCallback(async (
    registrationId: string,
    paymentStatus: 'pending' | 'paid'
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('tournament_registrations')
      .update({ payment_status: paymentStatus })
      .eq('id', registrationId);
    if (!error) {
      setRegistrations(prev =>
        prev.map(r => r.id === registrationId ? { ...r, payment_status: paymentStatus } : r)
      );
    }
    return !error;
  }, []);

  const getRegistrationLink = useCallback((tournamentId: string): string => {
    // For Electron app, use the web-hosted version URL
    // For now, use the current origin with hash routing
    const base = window.location.origin + window.location.pathname;
    return `${base}#/register?t=${tournamentId}`;
  }, []);

  return {
    tournaments, registrations, isLoading,
    loadTournaments, createTournament, closeTournament,
    loadRegistrations, updateRegistrationStatus, updatePaymentStatus,
    getRegistrationLink,
  };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useOpenTournaments.ts
git commit -m "feat: add useOpenTournaments hook for organizer management"
```

---

## Task 6: Organizer UI — Registrations Panel in Central

**Files:**
- Create: `src/components/registration/RegistrationsPanel.tsx`

**Step 1: Create the registrations management panel**

```typescript
// src/components/registration/RegistrationsPanel.tsx
import { useState, useEffect } from 'react';
import { useOpenTournaments } from '@/hooks/useOpenTournaments';
import type { OpenTournament } from '@/types/registration';
import {
  Plus, Link2, Copy, Check, X, Clock, DollarSign,
  ChevronDown, ChevronUp, Users, Loader2, CheckCircle2,
  XCircle, AlertTriangle,
} from 'lucide-react';

interface Props {
  userId: string;
}

export default function RegistrationsPanel({ userId }: Props) {
  const {
    tournaments, registrations, isLoading,
    loadTournaments, createTournament, closeTournament,
    loadRegistrations, updateRegistrationStatus, updatePaymentStatus,
    getRegistrationLink,
  } = useOpenTournaments(userId);

  const [selectedTournament, setSelectedTournament] = useState<OpenTournament | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [expandedReg, setExpandedReg] = useState<string | null>(null);

  // Create form state
  const [formName, setFormName] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formFee, setFormFee] = useState('');
  const [formFeeInstructions, setFormFeeInstructions] = useState('');

  useEffect(() => { loadTournaments(); }, [loadTournaments]);

  useEffect(() => {
    if (selectedTournament) {
      loadRegistrations(selectedTournament.id);
    }
  }, [selectedTournament, loadRegistrations]);

  const handleCreate = async () => {
    if (!formName.trim() || !formDate) return;
    const t = await createTournament({
      name: formName.trim(),
      date: formDate,
      location: formLocation.trim() || null,
      registration_deadline: formDeadline || null,
      fee_amount: formFee ? parseFloat(formFee) : null,
      fee_instructions: formFeeInstructions.trim() || null,
    });
    if (t) {
      setShowCreateForm(false);
      setFormName(''); setFormDate(''); setFormLocation('');
      setFormDeadline(''); setFormFee(''); setFormFeeInstructions('');
      setSelectedTournament(t);
    }
  };

  const handleCopyLink = async (tournamentId: string) => {
    const link = getRegistrationLink(tournamentId);
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const pendingCount = registrations.filter(r => r.status === 'pending').length;
  const approvedCount = registrations.filter(r => r.status === 'approved').length;
  const totalAthletes = registrations
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.athletes.length, 0);

  return (
    <div className="space-y-6">
      {/* Tournament selector */}
      <div className="flex items-center gap-3">
        <select
          value={selectedTournament?.id || ''}
          onChange={e => {
            const t = tournaments.find(t => t.id === e.target.value);
            setSelectedTournament(t || null);
          }}
          className="flex-1 bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg px-4 py-2 text-white"
        >
          <option value="">Selecione um torneio...</option>
          {tournaments.map(t => (
            <option key={t.id} value={t.id}>
              {t.name} — {new Date(t.date).toLocaleDateString('pt-BR')}
              {t.status === 'closed' ? ' (Encerrado)' : ''}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Novo Torneio
        </button>
      </div>

      {/* Create form modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141420] border border-[#1E1E2E] rounded-xl p-6 w-full max-w-lg space-y-4">
            <h3 className="text-lg font-bold text-white">Abrir Torneio para Inscrições</h3>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Nome do Torneio *</label>
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                className="w-full bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Data *</label>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                  className="w-full bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Prazo de Inscrição</label>
                <input type="datetime-local" value={formDeadline} onChange={e => setFormDeadline(e.target.value)}
                  className="w-full bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Local</label>
              <input type="text" value={formLocation} onChange={e => setFormLocation(e.target.value)}
                className="w-full bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Valor da Inscrição (R$)</label>
                <input type="number" step="0.01" value={formFee} onChange={e => setFormFee(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Instruções de Pagamento</label>
              <textarea value={formFeeInstructions} onChange={e => setFormFeeInstructions(e.target.value)}
                placeholder="Ex: Pix para (51) 99999-9999 — Banco X — Nome do responsável"
                rows={3}
                className="w-full bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none resize-none" />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowCreateForm(false)}
                className="flex-1 bg-[#1E1E2E] hover:bg-[#2E2E3E] text-white py-2 rounded-lg">
                Cancelar
              </button>
              <button onClick={handleCreate}
                disabled={!formName.trim() || !formDate}
                className="flex-1 bg-gradient-to-r from-[#E11D48] to-[#9F1239] disabled:opacity-50 text-white font-bold py-2 rounded-lg">
                Criar Torneio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected tournament details */}
      {selectedTournament && (
        <>
          {/* Actions bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => handleCopyLink(selectedTournament.id)}
              className="bg-[#1E1E2E] hover:bg-[#2E2E3E] border border-[#2E2E3E] text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? 'Link Copiado!' : 'Copiar Link de Inscrição'}
            </button>

            {selectedTournament.status === 'open' && (
              <button
                onClick={() => closeTournament(selectedTournament.id)}
                className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Encerrar Inscrições
              </button>
            )}

            <div className="ml-auto flex items-center gap-4 text-sm text-zinc-400">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {pendingCount} pendente(s)</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-400" /> {approvedCount} aprovada(s)</span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {totalAthletes} atleta(s)</span>
            </div>
          </div>

          {/* Registrations list */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
          )}

          {!isLoading && registrations.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <Link2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma inscrição ainda. Compartilhe o link com as academias.</p>
            </div>
          )}

          <div className="space-y-3">
            {registrations.map(reg => (
              <div key={reg.id} className="bg-[#141420] border border-[#1E1E2E] rounded-lg overflow-hidden">
                {/* Header */}
                <div
                  className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-[#1A1A2A]"
                  onClick={() => setExpandedReg(expandedReg === reg.id ? null : reg.id)}
                >
                  {/* Status icon */}
                  {reg.status === 'pending' && <Clock className="w-5 h-5 text-yellow-400" />}
                  {reg.status === 'approved' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                  {reg.status === 'rejected' && <XCircle className="w-5 h-5 text-red-400" />}

                  <div className="flex-1">
                    <p className="font-bold text-white">{reg.coach.academy_name}</p>
                    <p className="text-zinc-500 text-sm">
                      {reg.coach.coach_name} • {reg.coach.phone} • {reg.athletes.length} atleta(s)
                    </p>
                  </div>

                  {/* Payment badge */}
                  <span className={`text-xs px-2 py-1 rounded ${
                    reg.payment_status === 'paid'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-zinc-500/20 text-zinc-400'
                  }`}>
                    {reg.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                  </span>

                  {expandedReg === reg.id ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                </div>

                {/* Expanded content */}
                {expandedReg === reg.id && (
                  <div className="border-t border-[#1E1E2E] px-4 py-3 space-y-3">
                    {/* Athletes table */}
                    <div className="space-y-1">
                      {reg.athletes.map(a => (
                        <div key={a.id} className="flex items-center gap-3 px-3 py-2 bg-[#0A0A0F] rounded text-sm">
                          <span className="flex-1 text-white">{a.athlete.name}</span>
                          <span className="text-zinc-400">{a.belt}</span>
                          <span className="text-zinc-400">{a.weight}kg</span>
                          <span className="text-zinc-500">{a.category}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {reg.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateRegistrationStatus(reg.id, 'approved')}
                            className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" /> Aprovar
                          </button>
                          <button
                            onClick={() => updateRegistrationStatus(reg.id, 'rejected')}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                          >
                            <X className="w-4 h-4" /> Rejeitar
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => updatePaymentStatus(reg.id, reg.payment_status === 'paid' ? 'pending' : 'paid')}
                        className="bg-[#1E1E2E] hover:bg-[#2E2E3E] text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                      >
                        <DollarSign className="w-4 h-4" />
                        {reg.payment_status === 'paid' ? 'Marcar Pendente' : 'Marcar Pago'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/registration/RegistrationsPanel.tsx
git commit -m "feat: add RegistrationsPanel for organizer approval workflow"
```

---

## Task 7: Wire Routes and Navigation

**Files:**
- Modify: `src/AppChampionship.tsx` — Add `/register` route and import
- Modify: `src/pages/CentralPage.tsx` — Add "Inscrições" tab with RegistrationsPanel

**Step 1: Add public registration route to AppChampionship.tsx**

Read `src/AppChampionship.tsx` and add:

```typescript
// Add import at top
import PublicRegistration from '@/pages/PublicRegistration';

// Add route inside <Routes> — PUBLIC route, no ProtectedRoute wrapper
<Route path="/register" element={<PublicRegistration />} />
```

**Step 2: Add Inscricoes tab to CentralPage.tsx**

Read `src/pages/CentralPage.tsx` and add:

```typescript
// Add import at top
import RegistrationsPanel from '@/components/registration/RegistrationsPanel';

// In the tab buttons section, add a new tab:
// "Inscrições" tab button

// In the tab content section, add:
// When tab === 'inscricoes', render <RegistrationsPanel userId={user.id} />
```

The exact modifications depend on the current tab structure in CentralPage. Read the file first, then add the tab following the existing pattern.

**Step 3: Commit**

```bash
git add src/AppChampionship.tsx src/pages/CentralPage.tsx
git commit -m "feat: wire registration route and add Inscricoes tab to Central"
```

---

## Task 8: Update Supabase Types (Manual)

**Files:**
- Modify: `src/integrations/supabase/types.ts`

Since the new tables may not be auto-generated yet (depends on Supabase CLI setup), manually add the type definitions for the 5 new tables to the `Database` type. This ensures TypeScript recognizes the new tables when using `supabase.from('table_name')`.

Add these to `Database["public"]["Tables"]`:

- `open_tournaments`: Row/Insert/Update types matching the migration
- `academy_coaches`: Row/Insert/Update types
- `academy_athletes`: Row/Insert/Update types
- `tournament_registrations`: Row/Insert/Update types
- `registration_athletes`: Row/Insert/Update types

**Step 1: Read current types file and extend it**

Read `src/integrations/supabase/types.ts` and add the new table type blocks following the exact same pattern as existing tables (e.g., `athletes`).

**Step 2: Commit**

```bash
git add src/integrations/supabase/types.ts
git commit -m "feat: add Supabase types for 5 registration tables"
```

---

## Task 9: Verify Build

**Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 2: Vite build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Fix any errors**

If there are type errors or import issues, fix them before proceeding.

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build errors for registration system"
```

---

## Task 10: Manual Testing Checklist

**Step 1: Start dev server**

Run: `npm run dev` (or the championship Vite config on port 8081)

**Step 2: Test organizer flow**

1. Log in as a user
2. Go to Central page
3. Click "Inscrições" tab
4. Create a new open tournament (fill all fields)
5. Copy the registration link
6. Verify link is in clipboard

**Step 3: Test coach flow**

1. Open the registration link in a browser
2. Verify tournament info shows correctly
3. Fill identification form (phone, academy, coach name)
4. Add 2-3 athletes with different ages/belts/weights
5. Select athletes for registration
6. Verify category auto-calculation
7. Review step: mark all as reviewed
8. Submit registration
9. Verify confirmation screen with protocol number

**Step 4: Test approval flow**

1. Go back to Central → Inscrições tab
2. Verify the new registration appears as "Pendente"
3. Expand it, see athlete details
4. Approve the registration
5. Toggle payment status

**Step 5: Test returning coach**

1. Open registration link again
2. Enter same phone number
3. Verify athletes load from cloud
4. Submit a new registration for a different tournament

---

## Summary

| Task | Component | Files |
|------|-----------|-------|
| 1 | DB Migration | `supabase/migrations/...sql` |
| 2 | TypeScript Types | `src/types/registration.ts` |
| 3 | Registration Hook | `src/hooks/useRegistration.ts` |
| 4 | Public Registration Page | `src/pages/PublicRegistration.tsx` |
| 5 | Organizer Hook | `src/hooks/useOpenTournaments.ts` |
| 6 | Registrations Panel | `src/components/registration/RegistrationsPanel.tsx` |
| 7 | Route Wiring | `AppChampionship.tsx`, `CentralPage.tsx` |
| 8 | Supabase Types Update | `src/integrations/supabase/types.ts` |
| 9 | Build Verification | — |
| 10 | Manual Testing | — |
