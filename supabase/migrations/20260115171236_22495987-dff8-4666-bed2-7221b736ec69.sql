-- Create athletes table for academy members
CREATE TABLE public.athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nickname TEXT,
  belt TEXT,
  category TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_athletes_academy ON public.athletes(academy_id);
CREATE INDEX idx_athletes_name ON public.athletes(name);
CREATE INDEX idx_athletes_active ON public.athletes(academy_id, is_active);

-- RLS Policies for athletes
CREATE POLICY "Academy can view own athletes"
  ON public.athletes FOR SELECT
  USING (auth.uid() = academy_id);

CREATE POLICY "Academy can insert own athletes"
  ON public.athletes FOR INSERT
  WITH CHECK (auth.uid() = academy_id);

CREATE POLICY "Academy can update own athletes"
  ON public.athletes FOR UPDATE
  USING (auth.uid() = academy_id)
  WITH CHECK (auth.uid() = academy_id);

CREATE POLICY "Academy can delete own athletes"
  ON public.athletes FOR DELETE
  USING (auth.uid() = academy_id);

-- Create solo_results table for individual time attack scores
CREATE TABLE public.solo_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kicks INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds IN (30, 45, 60)),
  kicks_per_second DECIMAL(5,2) GENERATED ALWAYS AS (kicks::decimal / duration_seconds) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.solo_results ENABLE ROW LEVEL SECURITY;

-- Indexes for ranking queries
CREATE INDEX idx_solo_results_academy ON public.solo_results(academy_id);
CREATE INDEX idx_solo_results_athlete ON public.solo_results(athlete_id);
CREATE INDEX idx_solo_results_kicks ON public.solo_results(kicks DESC);
CREATE INDEX idx_solo_results_date ON public.solo_results(created_at DESC);
CREATE INDEX idx_solo_results_duration ON public.solo_results(duration_seconds);

-- RLS Policies for solo_results
CREATE POLICY "Academy can view own solo results"
  ON public.solo_results FOR SELECT
  USING (auth.uid() = academy_id);

CREATE POLICY "Academy can insert own solo results"
  ON public.solo_results FOR INSERT
  WITH CHECK (auth.uid() = academy_id);

-- Trigger to update athletes.updated_at
CREATE OR REPLACE FUNCTION public.update_athlete_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_athletes_updated_at
  BEFORE UPDATE ON public.athletes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_athlete_updated_at();