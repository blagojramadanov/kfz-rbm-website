-- Update RLS policy to allow image inserts for both draft and submitted vehicles
-- This allows users to upload images during draft creation and potentially add/modify images after submission if needed

DROP POLICY IF EXISTS "Users can upload images for their draft vehicles" ON submitted_vehicle_images;

CREATE POLICY "Users can upload images for their vehicles"
  ON submitted_vehicle_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM submitted_vehicles
      WHERE submitted_vehicles.id = submitted_vehicle_images.submitted_vehicle_id
      AND submitted_vehicles.user_id = auth.uid()
      AND submitted_vehicles.status IN ('draft', 'submitted')
    )
  );
