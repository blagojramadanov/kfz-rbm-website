-- Add is_main column to submitted_vehicle_images
ALTER TABLE submitted_vehicle_images
ADD COLUMN is_main BOOLEAN DEFAULT FALSE;

-- Create index for faster main image lookup
CREATE INDEX idx_submitted_vehicle_images_main ON submitted_vehicle_images(submitted_vehicle_id, is_main);

-- Ensure only one main image per vehicle via constraint
-- First, set the first (lowest sort_order) image as main for each vehicle
UPDATE submitted_vehicle_images svi
SET is_main = TRUE
WHERE id IN (
  SELECT id FROM submitted_vehicle_images
  WHERE (submitted_vehicle_id, sort_order) IN (
    SELECT submitted_vehicle_id, MIN(sort_order)
    FROM submitted_vehicle_images
    GROUP BY submitted_vehicle_id
  )
);
