
-- Championship matches table
CREATE TABLE public.championship_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL,
  match_number text,
  mat_id integer DEFAULT 1,
  config jsonb,
  status text NOT NULL DEFAULT 'IDLE',
  winner_side text,
  red_athlete_name text,
  blue_athlete_name text,
  red_round_wins integer DEFAULT 0,
  blue_round_wins integer DEFAULT 0,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Championship events table
CREATE TABLE public.championship_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.championship_matches(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  side text,
  points integer DEFAULT 0,
  round integer DEFAULT 1,
  description text,
  ts bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.championship_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.championship_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for championship_matches
CREATE POLICY "Academy can view own matches"
  ON public.championship_matches FOR SELECT
  TO authenticated
  USING (auth.uid() = academy_id);

CREATE POLICY "Academy can insert own matches"
  ON public.championship_matches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = academy_id);

CREATE POLICY "Academy can update own matches"
  ON public.championship_matches FOR UPDATE
  TO authenticated
  USING (auth.uid() = academy_id)
  WITH CHECK (auth.uid() = academy_id);

-- RLS policies for championship_events
CREATE POLICY "Academy can view own match events"
  ON public.championship_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.championship_matches m
      WHERE m.id = match_id AND m.academy_id = auth.uid()
    )
  );

CREATE POLICY "Academy can insert own match events"
  ON public.championship_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.championship_matches m
      WHERE m.id = match_id AND m.academy_id = auth.uid()
    )
  );

-- Index for faster event lookups
CREATE INDEX idx_championship_events_match_id ON public.championship_events(match_id);
CREATE INDEX idx_championship_matches_academy_id ON public.championship_matches(academy_id);
