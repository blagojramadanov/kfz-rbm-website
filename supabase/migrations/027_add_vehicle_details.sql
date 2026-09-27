-- ============================================================================
-- 027: carry the customer's vehicle details over to the inventory vehicle
-- ============================================================================
-- Migration 026 stores variant, previous owners, HU/AU, accident history and
-- service book on submitted_vehicles, but `vehicles` had no matching columns, so
-- publishSubmittedVehicle could not copy them. Same names, same allowed values
-- (the wizard's option values, never translated) as in 026, so one label helper
-- (lib/submission-details.ts) serves both tables.
-- All columns are nullable; vehicles created by hand simply leave them empty.
-- Grants on `vehicles` are table-level (migrations 010/011), and the public
-- read policy is row-based, so no grant or policy changes are needed.
-- Idempotent: safe to run more than once. Run it in the Supabase SQL editor.
-- ============================================================================

ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS variant TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS previous_owners TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS hu_au TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS accident_history TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS service_book TEXT;

ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_variant_length;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_variant_length
  CHECK (variant IS NULL OR char_length(variant) <= 100);

ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_previous_owners_check;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_previous_owners_check
  CHECK (previous_owners IS NULL OR previous_owners IN ('1', '2', '3', '4+'));

ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_hu_au_check;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_hu_au_check
  CHECK (hu_au IS NULL OR hu_au IN ('yes', 'no', 'expired'));

ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_accident_history_check;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_accident_history_check
  CHECK (accident_history IS NULL OR accident_history IN ('no', 'yes', 'unknown'));

ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_service_book_check;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_service_book_check
  CHECK (service_book IS NULL OR service_book IN ('yes', 'no'));

-- PostgREST caches the schema; make the new columns visible right away.
NOTIFY pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- Verify afterwards:
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'vehicles'
--     AND column_name IN ('variant', 'previous_owners', 'hu_au', 'accident_history', 'service_book');
-- ----------------------------------------------------------------------------
