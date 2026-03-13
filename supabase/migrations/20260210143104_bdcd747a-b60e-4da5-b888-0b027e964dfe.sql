
-- Add new columns to athletes
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS weight_kg numeric;

-- Create training_sessions table
CREATE TABLE public.training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  academy_id uuid NOT NULL,
  mode text NOT NULL,
  avg_score numeric,
  best_score numeric,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Academy can view own sessions"
  ON public.training_sessions FOR SELECT
  USING (auth.uid() = academy_id);

CREATE POLICY "Academy can insert own sessions"
  ON public.training_sessions FOR INSERT
  WITH CHECK (auth.uid() = academy_id);

CREATE POLICY "Academy can delete own sessions"
  ON public.training_sessions FOR DELETE
  USING (auth.uid() = academy_id);

-- Performance index
CREATE INDEX idx_training_sessions_athlete_date
  ON public.training_sessions(athlete_id, created_at DESC);
