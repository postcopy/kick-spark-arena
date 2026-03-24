-- Fix missing foreign key on championship_matches.academy_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_championship_matches_academy'
  ) THEN
    ALTER TABLE public.championship_matches
      ADD CONSTRAINT fk_championship_matches_academy
      FOREIGN KEY (academy_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix missing foreign key on training_sessions.academy_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_training_sessions_academy'
  ) THEN
    ALTER TABLE public.training_sessions
      ADD CONSTRAINT fk_training_sessions_academy
      FOREIGN KEY (academy_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add CHECK constraint for championship_matches.status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'chk_championship_matches_status'
  ) THEN
    ALTER TABLE public.championship_matches
      ADD CONSTRAINT chk_championship_matches_status
      CHECK (status IN ('IDLE', 'RUNNING', 'PAUSED', 'ROUND_END', 'MATCH_END'));
  END IF;
END $$;
