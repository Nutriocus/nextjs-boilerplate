-- =====================================================================
-- STRIPE INTEGRATION — adds subscription fields to athletes table
-- Run this once in the Supabase SQL editor.
-- =====================================================================

-- Stripe identifiers
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Subscription state machine
-- trialing   = free trial period
-- active     = paying customer, full access
-- past_due   = payment failed but still in dunning retries
-- canceled   = user cancelled, access until subscription_ends_at
-- expired    = period ended, no access anymore
-- incomplete = first checkout pending / failed
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS subscription_status TEXT
  CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'expired', 'incomplete'))
  DEFAULT 'active';

-- When the currently paid period ends (for canceled subs).
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- Which offer / tier the athlete subscribed to.
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS subscription_tier TEXT;

-- When the subscription effectively expired (used for the 90-day data retention countdown).
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ;

-- Index used by the cleanup cron to find expired athletes due for purge.
CREATE INDEX IF NOT EXISTS idx_athletes_expired_at ON athletes(expired_at) WHERE expired_at IS NOT NULL;

-- Index used by Stripe webhook lookups.
CREATE INDEX IF NOT EXISTS idx_athletes_stripe_customer_id ON athletes(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
