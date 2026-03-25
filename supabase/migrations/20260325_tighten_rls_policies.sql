-- ============================================================
-- Migration: Tighten RLS policies across registration & live-score tables
-- Date: 2025-03-25
-- Purpose: Fix overly permissive RLS policies that allow anonymous
--          users to UPDATE records they should not be able to modify,
--          and scope live_scores writes to the owning academy.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. academy_coaches
--    SELECT/INSERT: public (needed for registration form)
--    UPDATE: authenticated users only (organizers/admins)
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view coaches"       ON public.academy_coaches;
DROP POLICY IF EXISTS "Anyone can register as coach"   ON public.academy_coaches;
DROP POLICY IF EXISTS "Anyone can update coach info"   ON public.academy_coaches;

-- Public can view the coach list (needed by registration dropdowns)
CREATE POLICY "Anyone can view coaches"
  ON public.academy_coaches FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public can self-register as a coach via the registration form
CREATE POLICY "Anyone can register as coach"
  ON public.academy_coaches FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users (organizers) can update coach records.
-- Anonymous users must NOT be able to tamper with existing coach data.
CREATE POLICY "Only authenticated users can update coaches"
  ON public.academy_coaches FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ============================================================
-- 2. academy_athletes
--    SELECT/INSERT: public (needed for registration form)
--    UPDATE: authenticated users only (organizers)
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view athletes"   ON public.academy_athletes;
DROP POLICY IF EXISTS "Anyone can insert athletes" ON public.academy_athletes;
DROP POLICY IF EXISTS "Anyone can update athletes" ON public.academy_athletes;

-- Public can view athlete list (registration form lookups)
CREATE POLICY "Anyone can view athletes"
  ON public.academy_athletes FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public can register new athletes via the registration form
CREATE POLICY "Anyone can insert athletes"
  ON public.academy_athletes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users (organizers) can modify existing athlete records.
-- This prevents anonymous users from altering athlete data after submission.
CREATE POLICY "Only authenticated users can update athletes"
  ON public.academy_athletes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ============================================================
-- 3. registration_athletes
--    SELECT/INSERT: public (needed for registration form)
--    UPDATE: authenticated users only (organizers manage registrations)
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view registration athletes"   ON public.registration_athletes;
DROP POLICY IF EXISTS "Anyone can insert registration athletes" ON public.registration_athletes;
DROP POLICY IF EXISTS "Anyone can update registration athletes" ON public.registration_athletes;

-- Public can view registration athlete entries
CREATE POLICY "Anyone can view registration athletes"
  ON public.registration_athletes FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public can submit athletes as part of a tournament registration
CREATE POLICY "Anyone can insert registration athletes"
  ON public.registration_athletes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users (organizers) can update registration athlete records.
-- This prevents anonymous tampering with weights, categories, or review flags.
CREATE POLICY "Only authenticated users can update registration athletes"
  ON public.registration_athletes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ============================================================
-- 4. live_scores
--    The existing table has no academy_id column, so we add one
--    to scope writes. Reads remain public.
-- ============================================================

-- Add academy_id column so we can scope write access per academy
ALTER TABLE public.live_scores
  ADD COLUMN IF NOT EXISTS academy_id TEXT;

DROP POLICY IF EXISTS "Anyone can read live scores"      ON public.live_scores;
DROP POLICY IF EXISTS "Auth users can upsert live scores" ON public.live_scores;

-- Anyone can read live scores (public live-score viewing)
CREATE POLICY "Anyone can read live scores"
  ON public.live_scores FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated users can only INSERT a row if they own it (academy_id matches their uid).
-- This prevents one academy from writing scores for another academy's mat.
CREATE POLICY "Auth users can insert own live scores"
  ON public.live_scores FOR INSERT
  TO authenticated
  WITH CHECK (academy_id = auth.uid()::text);

-- Authenticated users can only UPDATE rows belonging to their academy.
CREATE POLICY "Auth users can update own live scores"
  ON public.live_scores FOR UPDATE
  TO authenticated
  USING (academy_id = auth.uid()::text)
  WITH CHECK (academy_id = auth.uid()::text);


-- ============================================================
-- 5. tournament_registrations
--    SELECT: public (already correct)
--    INSERT: only when the referenced tournament exists and is open
--    UPDATE: already scoped to organizer (no change needed)
-- ============================================================

DROP POLICY IF EXISTS "Anyone can submit a registration" ON public.tournament_registrations;

-- Registrations can only be submitted for tournaments that exist
-- and are currently open. This prevents inserting registrations
-- for closed or non-existent tournaments.
CREATE POLICY "Can submit registration for open tournaments only"
  ON public.tournament_registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.open_tournaments t
      WHERE t.id = tournament_id
        AND t.status = 'open'
    )
  );

COMMIT;
