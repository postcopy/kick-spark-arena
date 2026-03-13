-- ============================================================
-- Academy Registration System tables
-- ============================================================

-- 1. open_tournaments — tournaments open for public registration
CREATE TABLE public.open_tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date NOT NULL,
  location text,
  registration_deadline timestamptz,
  fee_amount numeric(10,2),
  fee_instructions text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_open_tournaments_created_by ON public.open_tournaments(created_by);
CREATE INDEX idx_open_tournaments_status ON public.open_tournaments(status);

ALTER TABLE public.open_tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open tournaments"
  ON public.open_tournaments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Creator can do everything with own tournaments"
  ON public.open_tournaments FOR ALL
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- 2. academy_coaches — coaches identified by phone
CREATE TABLE public.academy_coaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_name text NOT NULL,
  coach_name text NOT NULL,
  phone text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_academy_coaches_phone ON public.academy_coaches(phone);

ALTER TABLE public.academy_coaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view coaches"
  ON public.academy_coaches FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can register as coach"
  ON public.academy_coaches FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update coach info"
  ON public.academy_coaches FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 3. academy_athletes — persistent athletes belonging to a coach
CREATE TABLE public.academy_athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.academy_coaches(id) ON DELETE CASCADE,
  name text NOT NULL,
  birth_date date NOT NULL,
  gender text NOT NULL CHECK (gender IN ('M', 'F')),
  belt text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_academy_athletes_coach_id ON public.academy_athletes(coach_id);

ALTER TABLE public.academy_athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view athletes"
  ON public.academy_athletes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert athletes"
  ON public.academy_athletes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update athletes"
  ON public.academy_athletes FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 4. tournament_registrations — one per academy per tournament
CREATE TABLE public.tournament_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.open_tournaments(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.academy_coaches(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE (tournament_id, coach_id)
);

CREATE INDEX idx_tournament_registrations_tournament_id ON public.tournament_registrations(tournament_id);
CREATE INDEX idx_tournament_registrations_coach_id ON public.tournament_registrations(coach_id);
CREATE INDEX idx_tournament_registrations_status ON public.tournament_registrations(status);

ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view registrations"
  ON public.tournament_registrations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can submit a registration"
  ON public.tournament_registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Only organizer can update registrations"
  ON public.tournament_registrations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.open_tournaments t
      WHERE t.id = tournament_id AND t.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.open_tournaments t
      WHERE t.id = tournament_id AND t.created_by = auth.uid()
    )
  );

-- 5. registration_athletes — athletes in a specific registration
CREATE TABLE public.registration_athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.academy_athletes(id) ON DELETE CASCADE,
  weight numeric(5,2) NOT NULL,
  belt text NOT NULL,
  category text,
  reviewed_by_coach boolean DEFAULT false
);

CREATE INDEX idx_registration_athletes_registration_id ON public.registration_athletes(registration_id);
CREATE INDEX idx_registration_athletes_athlete_id ON public.registration_athletes(athlete_id);

ALTER TABLE public.registration_athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view registration athletes"
  ON public.registration_athletes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert registration athletes"
  ON public.registration_athletes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update registration athletes"
  ON public.registration_athletes FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
