-- ============================================================================
-- 026: store the vehicle details the customer wizard collects
-- ============================================================================
-- The "offer your vehicle" wizard asks for variant, previous owners, HU/AU,
-- accident history and service book, but submitted_vehicles had no columns for
-- them, so the answers were discarded. Values are the wizard's option values
-- (never translated); labels come from messages `wizard.options.*`.
-- Customers set these on INSERT (the existing insert policy stays as it is);
-- they cannot UPDATE submissions, admins can (policies from migration 023).
-- Idempotent: safe to run more than once. Run it in the Supabase SQL editor.
-- ============================================================================

ALTER TABLE public.submitted_vehicles ADD COLUMN IF NOT EXISTS variant TEXT;
ALTER TABLE public.submitted_vehicles ADD COLUMN IF NOT EXISTS previous_owners TEXT;
ALTER TABLE public.submitted_vehicles ADD COLUMN IF NOT EXISTS hu_au TEXT;
ALTER TABLE public.submitted_vehicles ADD COLUMN IF NOT EXISTS accident_history TEXT;
ALTER TABLE public.submitted_vehicles ADD COLUMN IF NOT EXISTS service_book TEXT;

ALTER TABLE public.submitted_vehicles DROP CONSTRAINT IF EXISTS submitted_vehicles_variant_length;
ALTER TABLE public.submitted_vehicles ADD CONSTRAINT submitted_vehicles_variant_length
  CHECK (variant IS NULL OR char_length(variant) <= 100);

ALTER TABLE public.submitted_vehicles DROP CONSTRAINT IF EXISTS submitted_vehicles_previous_owners_check;
ALTER TABLE public.submitted_vehicles ADD CONSTRAINT submitted_vehicles_previous_owners_check
  CHECK (previous_owners IS NULL OR previous_owners IN ('1', '2', '3', '4+'));

ALTER TABLE public.submitted_vehicles DROP CONSTRAINT IF EXISTS submitted_vehicles_hu_au_check;
ALTER TABLE public.submitted_vehicles ADD CONSTRAINT submitted_vehicles_hu_au_check
  CHECK (hu_au IS NULL OR hu_au IN ('yes', 'no', 'expired'));

ALTER TABLE public.submitted_vehicles DROP CONSTRAINT IF EXISTS submitted_vehicles_accident_history_check;
ALTER TABLE public.submitted_vehicles ADD CONSTRAINT submitted_vehicles_accident_history_check
  CHECK (accident_history IS NULL OR accident_history IN ('no', 'yes', 'unknown'));

ALTER TABLE public.submitted_vehicles DROP CONSTRAINT IF EXISTS submitted_vehicles_service_book_check;
ALTER TABLE public.submitted_vehicles ADD CONSTRAINT submitted_vehicles_service_book_check
  CHECK (service_book IS NULL OR service_book IN ('yes', 'no'));

-- PostgREST caches the schema; make the new columns visible right away.
NOTIFY pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- Verify afterwards:
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'submitted_vehicles'
--     AND column_name IN ('variant', 'previous_owners', 'hu_au', 'accident_history', 'service_book');
-- ----------------------------------------------------------------------------
