-- ============================================================================
-- 024: customers must never be able to delete their submitted vehicles
-- ============================================================================
-- Only admins may DELETE from submitted_vehicles / submitted_vehicle_images.
-- Migration 023 already creates admin-only policies (and drops every earlier one), but
-- migration 021 re-allowed the 'draft' status and 002 once had "Users can delete their own
-- draft vehicles". This migration is idempotent and makes the intended state explicit
-- whatever the live database currently contains. Safe to run more than once.

-- 1. Drop every DELETE / ALL policy on the two tables that is not an admin policy.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('submitted_vehicles', 'submitted_vehicle_images')
      AND cmd IN ('DELETE', 'ALL')
      AND COALESCE(qual, '') NOT ILIKE '%is_admin()%'
  LOOP
    RAISE NOTICE 'Dropping non-admin delete policy % on %', r.policyname, r.tablename;
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 2. Make sure the admin delete policy exists.
DROP POLICY IF EXISTS "Admins can delete submissions" ON public.submitted_vehicles;
CREATE POLICY "Admins can delete submissions"
  ON public.submitted_vehicles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 3. Anonymous visitors never need DELETE.
REVOKE DELETE ON public.submitted_vehicles FROM anon;
REVOKE DELETE ON public.submitted_vehicle_images FROM anon;

-- ----------------------------------------------------------------------------
-- Verify afterwards (expect only admin policies for DELETE / ALL):
--   SELECT tablename, policyname, cmd, roles, qual
--   FROM pg_policies
--   WHERE schemaname = 'public'
--     AND tablename IN ('submitted_vehicles', 'submitted_vehicle_images')
--     AND cmd IN ('DELETE', 'ALL');
-- ----------------------------------------------------------------------------
