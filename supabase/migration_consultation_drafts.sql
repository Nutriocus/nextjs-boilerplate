-- =====================================================================
-- CONSULTATION DRAFTS — AI-generated CRs awaiting coach review.
-- Pipeline: Sembly/Gemini email → /api/inbound/consultation → Claude
--           → draft row here → coach reviews on /coach/drafts → publish
--           → real consultation written into athletes.data.consultations.
-- =====================================================================

CREATE TABLE IF NOT EXISTS consultation_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Athlete matching (nullable in case the matcher couldn't identify them;
  -- the coach can manually pick the athlete from the review UI).
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  athlete_match_confidence NUMERIC(3, 2),  -- 0.00 to 1.00
  athlete_match_method TEXT,               -- 'email' | 'name_exact' | 'name_fuzzy' | 'manual'

  -- Source email metadata.
  source TEXT NOT NULL CHECK (source IN ('sembly', 'gemini', 'manual', 'unknown')),
  source_sender TEXT,                      -- e.g. "gemini-notes@google.com"
  source_subject TEXT,
  source_received_at TIMESTAMPTZ DEFAULT NOW(),

  -- Raw inputs (kept for debug + manual re-processing).
  raw_email JSONB,                         -- full inbound payload
  transcript_raw TEXT,                     -- extracted transcript / notes
  replay_url TEXT,                         -- video URL if detected

  -- AI-generated outputs.
  cr_title TEXT,                           -- short title, e.g. "Préparation 30 km"
  cr_html TEXT,                            -- TipTap-compatible HTML
  ai_model TEXT,                           -- e.g. "claude-sonnet-4-6"
  ai_tokens_input INTEGER,
  ai_tokens_output INTEGER,
  ai_error TEXT,                           -- populated if AI generation failed

  -- Lifecycle.
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'published', 'discarded', 'error')),
  published_consultation_id TEXT,          -- id inside athletes.data.consultations[]
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultation_drafts_status
  ON consultation_drafts(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_consultation_drafts_athlete
  ON consultation_drafts(athlete_id);

-- RLS: only coaches can read/write drafts. Service role bypasses.
ALTER TABLE consultation_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaches_read_drafts"
ON consultation_drafts FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM coaches WHERE user_id = auth.uid()));

CREATE POLICY "coaches_update_drafts"
ON consultation_drafts FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM coaches WHERE user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM coaches WHERE user_id = auth.uid()));

CREATE POLICY "coaches_delete_drafts"
ON consultation_drafts FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM coaches WHERE user_id = auth.uid()));
