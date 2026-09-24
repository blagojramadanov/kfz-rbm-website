-- ============================================================================
-- 025: admins upload vehicle photos with their own session (no service role)
-- ============================================================================
-- Why: since commit 3aa1d04 `uploadVehicleImagesBase64` uses the admin's session
-- client. That failed in production with UPLOAD_FAILED because
--   * role `authenticated` only had SELECT on public.vehicle_images (migration 010),
--     so the INSERT of the image row was rejected before RLS was even evaluated;
--   * the storage policies for the `vehicle-images` bucket were not verifiable.
-- This migration:
--   1. keeps RLS on vehicle_images and lets only admins INSERT/UPDATE/DELETE rows;
--   2. vehicle-images bucket: INSERT/UPDATE/DELETE (and SELECT for listing/removal)
--      only for admins; public read stays via the public bucket URL;
--   3. customer-submitted-photos bucket: customers may upload only into
--      {their user id}/{a submission id they own}/...; nothing else changes.
-- Idempotent: safe to run more than once. Run it in the Supabase SQL editor.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. public.vehicle_images: RLS on FIRST, then the table grant.
-- ----------------------------------------------------------------------------
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;

-- Replace every write policy on the table with admin-only ones (read policies are untouched).
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'vehicle_images'
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.vehicle_images', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admins can insert vehicle images"
  ON public.vehicle_images FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update vehicle images"
  ON public.vehicle_images FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete vehicle images"
  ON public.vehicle_images FOR DELETE TO authenticated
  USING (public.is_admin());

GRANT INSERT, UPDATE, DELETE ON public.vehicle_images TO authenticated;
-- anon never writes
REVOKE INSERT, UPDATE, DELETE ON public.vehicle_images FROM anon;

-- ----------------------------------------------------------------------------
-- 2. storage.objects, bucket vehicle-images (public bucket; files are read via
--    /storage/v1/object/public/..., which does not need a SELECT policy).
-- ----------------------------------------------------------------------------
-- (The bucket itself is already public = true; checked on 2026-09-24. Not changed here.)

-- Drop every existing policy that only concerns this bucket (e.g. 023's
-- "Admins can manage vehicle-images bucket") and recreate them explicitly.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (COALESCE(qual, '') || COALESCE(with_check, '')) LIKE '%vehicle-images%'
      AND (COALESCE(qual, '') || COALESCE(with_check, '')) NOT LIKE '%customer-submitted-photos%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "vehicle-images: admins can read (list/remove)"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'vehicle-images' AND public.is_admin());
CREATE POLICY "vehicle-images: admins can upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehicle-images' AND public.is_admin());
CREATE POLICY "vehicle-images: admins can update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'vehicle-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'vehicle-images' AND public.is_admin());
CREATE POLICY "vehicle-images: admins can delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vehicle-images' AND public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. storage.objects, bucket customer-submitted-photos (private).
--    Path layout: {user_id}/{submission_id}/{file}
--    Only the INSERT policy changes: the submission folder must belong to the uploader.
--    SELECT (own + admin) and DELETE (admin only) from migration 023 stay as they are.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Customers can upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "customer-submitted-photos: owners upload into own submission" ON storage.objects;
CREATE POLICY "customer-submitted-photos: owners upload into own submission"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'customer-submitted-photos'
    AND (storage.foldername(name))[1] = (auth.uid())::text
    AND EXISTS (
      SELECT 1 FROM public.submitted_vehicles sv
      WHERE sv.id::text = (storage.foldername(name))[2]
        AND sv.user_id = auth.uid()
        AND sv.status IN ('draft', 'eingereicht')
    )
  );

COMMIT;

-- ----------------------------------------------------------------------------
-- Verify afterwards:
--   SELECT policyname, cmd, roles, qual, with_check FROM pg_policies
--   WHERE schemaname = 'storage' AND tablename = 'objects' ORDER BY policyname;
--   SELECT policyname, cmd, roles, qual, with_check FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'vehicle_images' ORDER BY policyname;
--   SELECT grantee, privilege_type FROM information_schema.role_table_grants
--   WHERE table_schema = 'public' AND table_name = 'vehicle_images' ORDER BY 1, 2;
-- ----------------------------------------------------------------------------
