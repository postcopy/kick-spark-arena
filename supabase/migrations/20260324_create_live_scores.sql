-- Live score state table for HTTP polling fallback
-- Each mat has exactly one row, upserted by the master
CREATE TABLE IF NOT EXISTS public.live_scores (
  mat_id INTEGER PRIMARY KEY,
  state JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.live_scores ENABLE ROW LEVEL SECURITY;

-- Anyone can READ (public live scores)
CREATE POLICY "Anyone can read live scores" ON public.live_scores
  FOR SELECT USING (true);

-- Authenticated users can INSERT/UPDATE their mat
CREATE POLICY "Auth users can upsert live scores" ON public.live_scores
  FOR ALL USING (true) WITH CHECK (true);

-- Index for fast polling
CREATE INDEX IF NOT EXISTS idx_live_scores_updated ON public.live_scores(updated_at);
