-- ============================================================================
-- SECURITY AUDIT FIXES MIGRATION
-- ============================================================================
-- This migration corrects RLS policy issues from the security audit:
-- 1. Drop ALL existing policies before creating new ones
-- 2. Create is_admin() helper function with secure search_path
-- 3. Fix user_profiles privacy (customers cannot view all profiles)
-- 4. Fix admin role assignment trigger (no auto-admin, no EXCEPTION swallowing)
-- 5. Create private storage bucket for customer-submitted photos
-- 6. Update public vehicle-images bucket (admins only, no listing policy)
-- ============================================================================

-- ============================================================================
-- 0. DROP ALL EXISTING POLICIES (Defense in depth)
-- ============================================================================
-- This ensures no old policies with different names survive the migration

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'user_profiles', 'vehicles', 'vehicle_images', 'vehicle_features',
        'submitted_vehicles', 'submitted_vehicle_images', 'trade_in_requests',
        'customer_inquiries'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;

  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (policyname ILIKE '%vehicle%' OR policyname ILIKE '%customer%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- ============================================================================
-- 1. CREATE PUBLIC.IS_ADMIN() HELPER FUNCTION
-- ============================================================================
-- This function replaces all subqueries "auth.uid() IN (SELECT...)"
-- Prevents infinite recursion and improves policy clarity
-- SET search_path = '' to prevent injection; explicitly qualify table names

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  );
$$;

-- Grant EXECUTE only to authenticated users (anon cannot call this)
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================================================
-- 2. FIX USER_PROFILES POLICIES
-- ============================================================================
-- Customers see only their own profile; admins see all
-- Only admins can INSERT (signup trigger with SECURITY DEFINER handles signup)

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Policy 3: Users can update only their own profile (preserving role)
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.user_profiles WHERE id = auth.uid())
  );

-- Policy 4: Only admins can update role
CREATE POLICY "Only admins can update role"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policy 5: Only admins can insert (signup trigger has SECURITY DEFINER)
CREATE POLICY "Only admins can insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Policy 6: Prevent all deletes
CREATE POLICY "No deletes via RLS"
  ON user_profiles FOR DELETE
  USING (false);

-- ============================================================================
-- 3. FIX VEHICLES TABLE POLICIES
-- ============================================================================
-- Public can view available vehicles (status='available' with listing_type='verkauf'|'export')
-- Admins can view/create/update/delete all

-- Policy 1: Public can view available vehicles
CREATE POLICY "Public can view available vehicles"
  ON vehicles FOR SELECT
  USING (status = 'available' AND listing_type IN ('verkauf', 'export'));

-- Policy 2: Admins can view all vehicles
CREATE POLICY "Admins can view all vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Policy 3: Admins can insert rbm vehicles
CREATE POLICY "Admins can create rbm vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    AND source_type = 'rbm'
  );

-- Policy 4: Admins can create customer vehicles (when approving submissions)
CREATE POLICY "Admins can create customer vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    AND source_type = 'customer'
    AND submitted_vehicle_id IS NOT NULL
  );

-- Policy 5: Admins can update vehicles
CREATE POLICY "Admins can update vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policy 6: Admins can delete vehicles
CREATE POLICY "Admins can delete vehicles"
  ON vehicles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- 4. FIX VEHICLE_IMAGES POLICIES (RLS on table)
-- ============================================================================
-- Public can view images of available vehicles
-- Admins can view all images
-- Database policies only; actual image files have their own storage.objects policies

DROP POLICY IF EXISTS "Public can read vehicle-images" ON vehicle_images;
DROP POLICY IF EXISTS "Public can list vehicle images" ON vehicle_images;

-- Policy 1: Public can view images of available vehicles
CREATE POLICY "Public can view vehicle images"
  ON vehicle_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_images.vehicle_id
      AND vehicles.status = 'available'
      AND vehicles.listing_type IN ('verkauf', 'export')
    )
  );

-- Policy 2: Admins can view all images
CREATE POLICY "Admins can view all vehicle images"
  ON vehicle_images FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Policy 3: Admins can insert/update/delete images
CREATE POLICY "Admins can manage vehicle images"
  ON vehicle_images FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 5. FIX VEHICLE_FEATURES POLICIES
-- ============================================================================
-- Public can view features of available vehicles
-- Admins can view all features

-- Policy 1: Public can view vehicle features
CREATE POLICY "Public can view vehicle features"
  ON vehicle_features FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_features.vehicle_id
      AND vehicles.status = 'available'
      AND vehicles.listing_type IN ('verkauf', 'export')
    )
  );

-- Policy 2: Admins can view all features
CREATE POLICY "Admins can view all vehicle features"
  ON vehicle_features FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- 6. FIX SUBMITTED_VEHICLES POLICIES
-- ============================================================================
-- Customers can INSERT (submit) and SELECT (view own)
-- Customers cannot UPDATE or DELETE (direct submission, no editing)
-- Admins can do everything

-- Policy 1: Users can view their own submissions
CREATE POLICY "Users can view their own submissions"
  ON submitted_vehicles FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
  ON submitted_vehicles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Policy 3: Authenticated users can insert (submit) vehicles
-- WITH CHECK: user_id must be their own, status must be 'eingereicht', admin columns must be NULL
CREATE POLICY "Authenticated users can submit vehicles"
  ON submitted_vehicles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'eingereicht'
    AND admin_notes IS NULL
    AND approval_notes IS NULL
    AND offered_price IS NULL
    AND offer_terms IS NULL
    AND approved_at IS NULL
    AND approved_by IS NULL
    AND approver_name IS NULL
  );

-- Policy 4: Admins can update submissions
CREATE POLICY "Admins can update submissions"
  ON submitted_vehicles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policy 5: Admins can delete submissions
CREATE POLICY "Admins can delete submissions"
  ON submitted_vehicles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- 7. FIX SUBMITTED_VEHICLE_IMAGES POLICIES
-- ============================================================================
-- Customers can INSERT (upload) and SELECT (view own)
-- Customers cannot UPDATE or DELETE
-- Admins can do everything

-- Policy 1: Users can view images for their own vehicles
CREATE POLICY "Users can view images for their vehicles"
  ON submitted_vehicle_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM submitted_vehicles
      WHERE submitted_vehicles.id = submitted_vehicle_images.submitted_vehicle_id
      AND submitted_vehicles.user_id = auth.uid()
    )
  );

-- Policy 2: Admins can view all images
CREATE POLICY "Admins can view all submitted images"
  ON submitted_vehicle_images FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Policy 3: Authenticated users can insert images
CREATE POLICY "Authenticated users can upload images"
  ON submitted_vehicle_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM submitted_vehicles
      WHERE submitted_vehicles.id = submitted_vehicle_images.submitted_vehicle_id
      AND submitted_vehicles.user_id = auth.uid()
    )
  );

-- Policy 4: Admins can manage all images
CREATE POLICY "Admins can manage submitted images"
  ON submitted_vehicle_images FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 8. FIX TRADE_IN_REQUESTS POLICIES (READ-ONLY for customers)
-- ============================================================================
-- Customers can INSERT (create) and SELECT (view own)
-- Customers cannot UPDATE or DELETE
-- Admins can do everything

-- Policy 1: Users can view their own trade-in requests
CREATE POLICY "Users can view their own trade-in requests"
  ON trade_in_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Admins can view all trade-in requests
CREATE POLICY "Admins can view all trade-in requests"
  ON trade_in_requests FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Policy 3: Authenticated users can create trade-in requests
CREATE POLICY "Authenticated users can create trade-in requests"
  ON trade_in_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Admins can update trade-in requests
CREATE POLICY "Admins can update trade-in requests"
  ON trade_in_requests FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policy 5: Admins can delete trade-in requests
CREATE POLICY "Admins can delete trade-in requests"
  ON trade_in_requests FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- 9. FIX CUSTOMER_INQUIRIES POLICIES (Admin only)
-- ============================================================================
-- Public can insert (contact form)
-- Only admins can SELECT/UPDATE/DELETE

-- Policy 1: Public can insert inquiries
CREATE POLICY "Allow public to create inquiries"
  ON customer_inquiries FOR INSERT
  WITH CHECK (true);

-- Policy 2: Only admins can view inquiries
CREATE POLICY "Admins can view all inquiries"
  ON customer_inquiries FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Policy 3: Only admins can update inquiries
CREATE POLICY "Admins can update inquiries"
  ON customer_inquiries FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policy 4: Only admins can delete inquiries
CREATE POLICY "Admins can delete inquiries"
  ON customer_inquiries FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- 10. INDEXES FOR POLICY PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_id_role ON user_profiles(id, role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

CREATE INDEX IF NOT EXISTS idx_submitted_vehicles_user_id ON submitted_vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_submitted_vehicle_images_submitted_vehicle_id ON submitted_vehicle_images(submitted_vehicle_id);

CREATE INDEX IF NOT EXISTS idx_trade_in_requests_user_id ON trade_in_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_vehicles_status_listing_type ON vehicles(status, listing_type);

CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id ON vehicle_images(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_features_vehicle_id ON vehicle_features(vehicle_id);

-- ============================================================================
-- 11. FIX ADMIN ROLE ASSIGNMENT TRIGGER
-- ============================================================================
-- All new users get CUSTOMER role (no auto-admin)
-- If profile creation fails, the signup transaction must fail (no EXCEPTION swallowing)

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS auto_assign_role_on_user_creation();
DROP FUNCTION IF EXISTS create_user_profile();

-- Function: Assign all new users CUSTOMER role
-- SECURITY DEFINER allows insertion even if signup has minimal permissions
-- No EXCEPTION WHEN OTHERS: if INSERT fails, signup fails (correct behavior)
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'CUSTOMER',  -- All new users are CUSTOMER, never auto-admin
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_profile();

-- ============================================================================
-- 12. CREATE PRIVATE STORAGE BUCKET FOR CUSTOMER-SUBMITTED PHOTOS
-- ============================================================================
-- Bucket: customer-submitted-photos (private)
-- Path structure: {user_id}/{submission_id}/{filename}
-- Customers upload to their own folder; Admins access via signed URLs

INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-submitted-photos', 'customer-submitted-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS on storage.objects is already enabled globally (not controlled per-table)

-- Policy: Customers can upload (INSERT) to their own folder only
CREATE POLICY "Customers can upload own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'customer-submitted-photos'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Policy: Customers can SELECT (view) only their own uploaded files
CREATE POLICY "Customers can view own photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'customer-submitted-photos'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Policy: Admins can SELECT all files in customer bucket (for signed URLs, no direct access)
CREATE POLICY "Admins can view all customer photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'customer-submitted-photos'
    AND public.is_admin()
  );

-- Policy: Admins can DELETE files in customer bucket
CREATE POLICY "Admins can delete customer photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'customer-submitted-photos'
    AND public.is_admin()
  );

-- Policy: Prevent UPDATE operations (not allowed on any files)
CREATE POLICY "Prevent storage updates"
  ON storage.objects FOR UPDATE
  USING (false);

-- ============================================================================
-- 13. UPDATE PUBLIC VEHICLE-IMAGES BUCKET POLICY
-- ============================================================================
-- Bucket: vehicle-images (public)
-- Only admins can INSERT/UPDATE/DELETE
-- No SELECT policy needed: public bucket URLs work directly
-- (Removed "Public can read vehicle-images" policy to prevent listing)

-- Policy: Admins can manage all files in vehicle-images bucket
CREATE POLICY "Admins can manage vehicle-images bucket"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'vehicle-images'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'vehicle-images'
    AND public.is_admin()
  );

-- NOTE: No SELECT policy for vehicle-images bucket.
-- Public URLs work without it (public bucket URLs are not blocked by RLS).
-- This prevents listing all files in the bucket.
