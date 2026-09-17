-- Fix RLS policy for submitted_vehicle_images INSERT
-- The issue: Multiple conflicting policies from previous migrations (002 and 014)
-- Solution: Drop all existing INSERT policies and create a single, working one

-- Drop ALL existing INSERT policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload images for their draft vehicles" ON submitted_vehicle_images;
DROP POLICY IF EXISTS "Users can upload images for their vehicles" ON submitted_vehicle_images;

-- Create a single, clear INSERT policy
-- Allows authenticated users to insert images for their own vehicles (regardless of status)
CREATE POLICY "authenticated_users_insert_images"
  ON submitted_vehicle_images FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Verify the vehicle exists, belongs to the authenticated user
    EXISTS (
      SELECT 1 FROM submitted_vehicles
      WHERE submitted_vehicles.id = submitted_vehicle_images.submitted_vehicle_id
      AND submitted_vehicles.user_id = auth.uid()
    )
  );

-- Ensure DELETE policy also allows deletion for draft vehicles
DROP POLICY IF EXISTS "Users can delete images for their draft vehicles" ON submitted_vehicle_images;

CREATE POLICY "authenticated_users_delete_images"
  ON submitted_vehicle_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM submitted_vehicles
      WHERE submitted_vehicles.id = submitted_vehicle_images.submitted_vehicle_id
      AND submitted_vehicles.user_id = auth.uid()
      AND submitted_vehicles.status = 'draft'
    )
  );
