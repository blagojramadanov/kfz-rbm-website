-- Add export vehicles feature
-- Allows admin to list vehicles for export abroad separately from normal sales

-- 1. Add listing_type to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS listing_type VARCHAR(20) DEFAULT 'verkauf'
  CHECK (listing_type IN ('verkauf', 'export'));

-- 2. Add export-specific fields to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS zustand VARCHAR(50); -- fahrbereit, nicht fahrbereit, Unfallwagen
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS zielland VARCHAR(100); -- Target country
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS export_notes TEXT; -- Export-specific notes (e.g., price is net)

-- 3. Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_vehicles_listing_type ON vehicles(listing_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_listing_type_status ON vehicles(listing_type, status);

-- 4. Update RLS policies to enforce export vehicle restrictions

-- Drop old policies that allow public viewing
DROP POLICY IF EXISTS "Public can view available vehicles" ON vehicles;
DROP POLICY IF EXISTS "Admins can view all vehicles" ON vehicles;

-- NEW: Public can view available VERKAUF vehicles only
CREATE POLICY "Public can view available verkauf vehicles"
  ON vehicles FOR SELECT
  USING (status = 'available' AND listing_type = 'verkauf');

-- NEW: Public can view available EXPORT vehicles only
CREATE POLICY "Public can view available export vehicles"
  ON vehicles FOR SELECT
  USING (status = 'available' AND listing_type = 'export');

-- Admins can view all vehicles (both types)
CREATE POLICY "Admins can view all vehicles"
  ON vehicles FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'ADMIN')
  );

-- Keep existing admin write policies (they can create/edit both types)
-- Existing DELETE policy: Admins can delete any vehicle
-- Existing UPDATE policy: Admins can update any vehicle
-- These already allow both listing_type values

-- 5. Ensure admins can create export vehicles
-- (existing INSERT policy allows authenticated users, but RLS will filter on select)
-- Make sure admins have full access

DROP POLICY IF EXISTS "Admins can create vehicles" ON vehicles;
CREATE POLICY "Admins can create vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'ADMIN')
  );
