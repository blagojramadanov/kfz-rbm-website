-- Submitted Vehicles table (customer submissions awaiting admin approval)
CREATE TABLE IF NOT EXISTS submitted_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  mileage INTEGER NOT NULL,
  price DECIMAL(10, 2),
  transmission VARCHAR(20),
  fuel_type VARCHAR(20),
  body_type VARCHAR(30),
  color VARCHAR(50),
  power_hp INTEGER,
  description TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
  status_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submitted Vehicle Images table
CREATE TABLE IF NOT EXISTS submitted_vehicle_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submitted_vehicle_id UUID NOT NULL REFERENCES submitted_vehicles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(submitted_vehicle_id, image_url)
);

-- Create indexes for performance
CREATE INDEX idx_submitted_vehicles_user_id ON submitted_vehicles(user_id);
CREATE INDEX idx_submitted_vehicles_status ON submitted_vehicles(status);
CREATE INDEX idx_submitted_vehicles_created_at ON submitted_vehicles(created_at DESC);
CREATE INDEX idx_submitted_vehicles_year ON submitted_vehicles(year);
CREATE INDEX idx_submitted_vehicles_price ON submitted_vehicles(price);
CREATE INDEX idx_submitted_vehicle_images_vehicle_id ON submitted_vehicle_images(submitted_vehicle_id);

-- Create updated_at trigger
CREATE TRIGGER update_submitted_vehicles_updated_at BEFORE UPDATE ON submitted_vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submitted_vehicle_images_updated_at BEFORE UPDATE ON submitted_vehicle_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE submitted_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE submitted_vehicle_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for submitted_vehicles

-- Policy 1: Users can view their own submissions
CREATE POLICY "Users can view their own submissions"
  ON submitted_vehicles FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
  ON submitted_vehicles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'ADMIN'
    )
  );

-- Policy 3: Authenticated users can insert (submit) vehicles
CREATE POLICY "Authenticated users can submit vehicles"
  ON submitted_vehicles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can update only their own draft vehicles
CREATE POLICY "Users can update their own draft vehicles"
  ON submitted_vehicles FOR UPDATE
  USING (
    auth.uid() = user_id
    AND status = 'draft'
  );

-- Policy 5: Admins can update any vehicle
CREATE POLICY "Admins can update any submission"
  ON submitted_vehicles FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'ADMIN'
    )
  );

-- Policy 6: Users can delete only their own draft vehicles
CREATE POLICY "Users can delete their own draft vehicles"
  ON submitted_vehicles FOR DELETE
  USING (
    auth.uid() = user_id
    AND status = 'draft'
  );

-- Policy 7: Admins can delete any vehicle
CREATE POLICY "Admins can delete any submission"
  ON submitted_vehicles FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'ADMIN'
    )
  );

-- RLS Policies for submitted_vehicle_images

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
CREATE POLICY "Admins can view all images"
  ON submitted_vehicle_images FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'ADMIN'
    )
  );

-- Policy 3: Users can insert images for their draft vehicles only
CREATE POLICY "Users can upload images for their draft vehicles"
  ON submitted_vehicle_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM submitted_vehicles
      WHERE submitted_vehicles.id = submitted_vehicle_images.submitted_vehicle_id
      AND submitted_vehicles.user_id = auth.uid()
      AND submitted_vehicles.status = 'draft'
    )
  );

-- Policy 4: Users can delete images for their draft vehicles
CREATE POLICY "Users can delete images for their draft vehicles"
  ON submitted_vehicle_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM submitted_vehicles
      WHERE submitted_vehicles.id = submitted_vehicle_images.submitted_vehicle_id
      AND submitted_vehicles.user_id = auth.uid()
      AND submitted_vehicles.status = 'draft'
    )
  );

-- Policy 5: Admins can manage all images
CREATE POLICY "Admins can manage all images"
  ON submitted_vehicle_images FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'ADMIN'
    )
  );
