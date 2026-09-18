-- Add offer workflow columns to submitted_vehicles
-- Allows admin to send formal offers to customers

ALTER TABLE submitted_vehicles ADD COLUMN IF NOT EXISTS offered_price DECIMAL(10, 2);
ALTER TABLE submitted_vehicles ADD COLUMN IF NOT EXISTS offered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE submitted_vehicles ADD COLUMN IF NOT EXISTS offer_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE submitted_vehicles ADD COLUMN IF NOT EXISTS offer_rejected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE submitted_vehicles ADD COLUMN IF NOT EXISTS offer_terms TEXT; -- Payment terms, conditions, etc.
ALTER TABLE submitted_vehicles ADD COLUMN IF NOT EXISTS rejection_reason TEXT; -- Keep existing, use for rejected offers too

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_submitted_vehicles_offered_at ON submitted_vehicles(offered_at DESC);
CREATE INDEX IF NOT EXISTS idx_submitted_vehicles_offer_accepted_at ON submitted_vehicles(offer_accepted_at);

-- Update status check constraint to include 'akzeptiert' (accepted)
ALTER TABLE submitted_vehicles DROP CONSTRAINT IF EXISTS submitted_vehicles_status_check;

ALTER TABLE submitted_vehicles ADD CONSTRAINT submitted_vehicles_status_check
  CHECK (status IN ('draft', 'eingereicht', 'in_bearbeitung', 'angebot_gesendet', 'akzeptiert', 'abgelehnt'));

-- Add new status for "In Bearbeitung" if not exists in migrations
-- This status means admin is working on reviewing/preparing offer
