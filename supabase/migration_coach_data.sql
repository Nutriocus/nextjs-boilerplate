-- =====================================================================
-- Migration : coach_data table for shared coach-level storage
-- (used for the shared Academy library, shared resources, templates...)
-- Run once in Supabase → SQL Editor.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.coach_data (
  coach_id    uuid NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  key         text NOT NULL,
  data        jsonb DEFAULT '{}'::jsonb,
  updated_at  timestamptz DEFAULT now(),
  PRIMARY KEY (coach_id, key)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.touch_coach_data_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS coach_data_touch_updated_at ON public.coach_data;
CREATE TRIGGER coach_data_touch_updated_at
  BEFORE UPDATE ON public.coach_data
  FOR EACH ROW EXECUTE PROCEDURE public.touch_coach_data_updated_at();

-- Row Level Security
ALTER TABLE public.coach_data ENABLE ROW LEVEL SECURITY;

-- READ : coach reads their own data + athlete reads their coach's data
DROP POLICY IF EXISTS "coach_data_select" ON public.coach_data;
CREATE POLICY "coach_data_select" ON public.coach_data
  FOR SELECT USING (
    coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
    OR coach_id IN (SELECT coach_id FROM public.athletes WHERE user_id = auth.uid())
  );

-- WRITE : only the coach themselves can write
DROP POLICY IF EXISTS "coach_data_write" ON public.coach_data;
CREATE POLICY "coach_data_write" ON public.coach_data
  FOR ALL USING (
    coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
  ) WITH CHECK (
    coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
  );
