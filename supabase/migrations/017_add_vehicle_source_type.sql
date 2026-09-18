-- Add source_type and submitted_vehicle_id to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'rbm' CHECK (source_type IN ('rbm', 'customer'));
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS submitted_vehicle_id UUID REFERENCES submitted_vehicles(id) ON DELETE SET NULL;

-- Add index for source_type
CREATE INDEX IF NOT EXISTS idx_vehicles_source_type ON vehicles(source_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_submitted_vehicle_id ON vehicles(submitted_vehicle_id);

-- Add approval-related fields to submitted_vehicles
ALTER TABLE submitted_vehicles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE submitted_vehicles ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE submitted_vehicles ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL;

-- Add index for tracking approvals
CREATE INDEX IF NOT EXISTS idx_submitted_vehicles_vehicle_id ON submitted_vehicles(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_submitted_vehicles_approved_at ON submitted_vehicles(approved_at DESC);

-- Add approver info to submitted_vehicles (for display)
ALTER TABLE submitted_vehicles ADD COLUMN IF NOT EXISTS approver_name VARCHAR(100);

-- Update RLS Policy: Only admins can create vehicles with source_type 'rbm'
-- Drop the old policy if it exists and create a new one
DROP POLICY IF EXISTS "Allow public to view available vehicles" ON vehicles;

-- New policy: Allow public to view available/featured vehicles
CREATE POLICY "Allow public to view available vehicles"
  ON vehicles FOR SELECT
  USING (status IN ('available', 'featured'));

-- Policy: Admins can create RBM vehicles directly
DROP POLICY IF EXISTS "Admins can create vehicles" ON vehicles;
CREATE POLICY "Admins can create rbm vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'ADMIN'
    )
    AND source_type = 'rbm'
  );

-- Policy: Admins can create customer vehicles (when approving)
CREATE POLICY "Admins can create customer vehicles from submissions"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'ADMIN'
    )
    AND source_type = 'customer'
    AND submitted_vehicle_id IS NOT NULL
  );

-- Policy: Admins can update any vehicle
DROP POLICY IF EXISTS "Allow admins to manage vehicles" ON vehicles;
CREATE POLICY "Admins can update vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'ADMIN'
    )
  );

-- Policy: Admins can delete any vehicle
CREATE POLICY "Admins can delete vehicles"
  ON vehicles FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'ADMIN'
    )
  );

-- Ensure customers cannot insert into vehicles table
CREATE POLICY "Prevent customers from creating vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (FALSE);

-- Add approval method column
ALTER TABLE submitted_vehicles ADD COLUMN IF NOT EXISTS approval_notes TEXT;

-- Add comment to explain the workflow
COMMENT ON COLUMN vehicles.source_type IS 'rbm: Directly offered by KFZ RBM, customer: Customer-submitted and approved';
COMMENT ON COLUMN vehicles.submitted_vehicle_id IS 'Reference to the submitted vehicle that was approved and promoted to inventory';
COMMENT ON COLUMN submitted_vehicles.vehicle_id IS 'Reference to the vehicle in the vehicles table after approval';
