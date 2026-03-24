-- Create athletes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nickname TEXT,
  belt TEXT,
  category TEXT,
  avatar_url TEXT,
  birth_date DATE,
  weight_kg DECIMAL(5,1),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;

-- Indexes (IF NOT EXISTS not supported for indexes, use DO block)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_athletes_academy') THEN
    CREATE INDEX idx_athletes_academy ON public.athletes(academy_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_athletes_name') THEN
    CREATE INDEX idx_athletes_name ON public.athletes(name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_athletes_active') THEN
    CREATE INDEX idx_athletes_active ON public.athletes(academy_id, is_active);
  END IF;
END $$;

-- RLS Policies (drop if exist, then create)
DROP POLICY IF EXISTS "Academy can view own athletes" ON public.athletes;
CREATE POLICY "Academy can view own athletes"
  ON public.athletes FOR SELECT
  USING (auth.uid() = academy_id);

DROP POLICY IF EXISTS "Academy can insert own athletes" ON public.athletes;
CREATE POLICY "Academy can insert own athletes"
  ON public.athletes FOR INSERT
  WITH CHECK (auth.uid() = academy_id);

DROP POLICY IF EXISTS "Academy can update own athletes" ON public.athletes;
CREATE POLICY "Academy can update own athletes"
  ON public.athletes FOR UPDATE
  USING (auth.uid() = academy_id)
  WITH CHECK (auth.uid() = academy_id);

DROP POLICY IF EXISTS "Academy can delete own athletes" ON public.athletes;
CREATE POLICY "Academy can delete own athletes"
  ON public.athletes FOR DELETE
  USING (auth.uid() = academy_id);

-- Create solo_results table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.solo_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kicks INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  kicks_per_second DECIMAL(5,2) GENERATED ALWAYS AS (kicks::decimal / NULLIF(duration_seconds, 0)) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.solo_results ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_solo_results_academy') THEN
    CREATE INDEX idx_solo_results_academy ON public.solo_results(academy_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_solo_results_athlete') THEN
    CREATE INDEX idx_solo_results_athlete ON public.solo_results(athlete_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_solo_results_kicks') THEN
    CREATE INDEX idx_solo_results_kicks ON public.solo_results(kicks DESC);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_solo_results_date') THEN
    CREATE INDEX idx_solo_results_date ON public.solo_results(created_at DESC);
  END IF;
END $$;

DROP POLICY IF EXISTS "Academy can view own solo results" ON public.solo_results;
CREATE POLICY "Academy can view own solo results"
  ON public.solo_results FOR SELECT
  USING (auth.uid() = academy_id);

DROP POLICY IF EXISTS "Academy can insert own solo results" ON public.solo_results;
CREATE POLICY "Academy can insert own solo results"
  ON public.solo_results FOR INSERT
  WITH CHECK (auth.uid() = academy_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_athlete_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_athletes_updated_at ON public.athletes;
CREATE TRIGGER update_athletes_updated_at
  BEFORE UPDATE ON public.athletes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_athlete_updated_at();

-- Training sessions table
CREATE TABLE IF NOT EXISTS public.training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  avg_score DECIMAL(8,2),
  best_score DECIMAL(8,2),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Academy can view own sessions" ON public.training_sessions;
CREATE POLICY "Academy can view own sessions"
  ON public.training_sessions FOR SELECT
  USING (auth.uid() = academy_id);

DROP POLICY IF EXISTS "Academy can insert own sessions" ON public.training_sessions;
CREATE POLICY "Academy can insert own sessions"
  ON public.training_sessions FOR INSERT
  WITH CHECK (auth.uid() = academy_id);
