-- Create trade_in_requests table for Inzahlungnahme (trade-in) workflow

CREATE TABLE IF NOT EXISTS trade_in_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Customer's current vehicle information
  current_vehicle_brand VARCHAR(50) NOT NULL,
  current_vehicle_model VARCHAR(100) NOT NULL,
  current_vehicle_year INTEGER NOT NULL,
  current_vehicle_mileage INTEGER NOT NULL,
  current_vehicle_value_estimate DECIMAL(10, 2) NOT NULL,

  -- Desired vehicle from KFZ RBM inventory
  desired_vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,

  -- Status tracking
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'contact_made', 'completed', 'cancelled')),

  -- Admin notes
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_trade_in_requests_user_id ON trade_in_requests(user_id);
CREATE INDEX idx_trade_in_requests_status ON trade_in_requests(status);
CREATE INDEX idx_trade_in_requests_desired_vehicle_id ON trade_in_requests(desired_vehicle_id);
CREATE INDEX idx_trade_in_requests_created_at ON trade_in_requests(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_trade_in_requests_updated_at BEFORE UPDATE ON trade_in_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE trade_in_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trade_in_requests

-- Policy 1: Users can view their own trade-in requests
CREATE POLICY "Users can view their own trade-in requests"
  ON trade_in_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Admins can view all trade-in requests
CREATE POLICY "Admins can view all trade-in requests"
  ON trade_in_requests FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'ADMIN'
    )
  );

-- Policy 3: Authenticated users can create trade-in requests
CREATE POLICY "Authenticated users can create trade-in requests"
  ON trade_in_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can update their own new/reviewing requests
CREATE POLICY "Users can update their own pending requests"
  ON trade_in_requests FOR UPDATE
  USING (
    auth.uid() = user_id
    AND status IN ('new', 'reviewing')
  );

-- Policy 5: Admins can update any trade-in request
CREATE POLICY "Admins can update any trade-in request"
  ON trade_in_requests FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'ADMIN'
    )
  );

-- Policy 6: Users can delete their own new requests
CREATE POLICY "Users can delete their own new requests"
  ON trade_in_requests FOR DELETE
  USING (
    auth.uid() = user_id
    AND status = 'new'
  );

-- Policy 7: Admins can delete any trade-in request
CREATE POLICY "Admins can delete any trade-in request"
  ON trade_in_requests FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'ADMIN'
    )
  );

-- Add comments
COMMENT ON TABLE trade_in_requests IS 'Trade-in (Inzahlungnahme) requests from customers';
COMMENT ON COLUMN trade_in_requests.status IS 'Status: new (just created), reviewing (admin looking at it), contact_made (admin contacted customer), completed (dealt with), cancelled';
COMMENT ON COLUMN trade_in_requests.admin_notes IS 'Admin-only notes about the trade-in request';
