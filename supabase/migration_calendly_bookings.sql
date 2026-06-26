-- =====================================================================
-- CALENDLY BOOKINGS — stores live bookings sent by Calendly webhook.
-- Used by the BookingSection to count monthly bookings per athlete.
-- =====================================================================

CREATE TABLE IF NOT EXISTS calendly_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  athlete_email TEXT NOT NULL,
  -- Calendly resource URIs — unique to prevent duplicates on webhook retries.
  calendly_event_uri TEXT UNIQUE NOT NULL,
  invitee_uri TEXT UNIQUE NOT NULL,
  event_name TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('booked', 'canceled', 'rescheduled')) DEFAULT 'booked',
  -- utmContent passed from the InlineWidget → contains the athlete UUID.
  -- Used as a fallback when matching by email alone is ambiguous.
  utm_content TEXT,
  raw JSONB,                              -- full webhook payload for debug
  created_at TIMESTAMPTZ DEFAULT NOW(),
  canceled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_calendly_bookings_athlete_month
  ON calendly_bookings(athlete_id, scheduled_at)
  WHERE status = 'booked';

CREATE INDEX IF NOT EXISTS idx_calendly_bookings_email
  ON calendly_bookings(athlete_email);
