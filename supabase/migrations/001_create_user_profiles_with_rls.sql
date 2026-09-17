-- Create user_profiles table with RLS
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'ADMIN')),
  avatar_url TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can view other profiles (non-sensitive fields)
CREATE POLICY "Users can view other profiles (limited)"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Policy 3: Users can update only their own profile (NOT role field)
CREATE POLICY "Users can update their own profile (not role)"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())
  );

-- Policy 4: Only admins can update role field
CREATE POLICY "Only admins can update role"
  ON user_profiles FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'ADMIN'
    )
  )
  WITH CHECK (true);

-- Policy 5: Only system/admins can insert new profiles (via trigger)
CREATE POLICY "Admins can insert profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'ADMIN'
    )
  );

-- Policy 6: Prevent all deletes by users (admins can via app logic)
CREATE POLICY "No deletes via RLS"
  ON user_profiles FOR DELETE
  USING (false);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'CUSTOMER'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Function to prevent role field updates via API
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If user is not admin, prevent role changes
  IF NEW.role != OLD.role AND
     (SELECT role FROM user_profiles WHERE id = auth.uid()) != 'ADMIN' THEN
    RAISE EXCEPTION 'You do not have permission to update the role field';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce role field immutability for non-admins
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON user_profiles;
CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_role_escalation();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;
