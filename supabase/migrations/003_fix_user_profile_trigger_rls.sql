-- Fix RLS policy for user_profiles to allow trigger to insert new profiles
-- The issue: trigger runs as SECURITY DEFINER but RLS still checks auth.uid()
-- which is the new user without a profile yet

-- Drop all existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view other profiles (limited)" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile (not role)" ON user_profiles;
DROP POLICY IF EXISTS "Only admins can update role" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "No deletes via RLS" ON user_profiles;

-- Create corrected policies that allow trigger to work

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

-- Policy 5: Allow profile creation during signup OR by admins
-- This allows the trigger to insert for NEW users during signup
CREATE POLICY "System can create profiles on signup"
  ON user_profiles FOR INSERT
  WITH CHECK (
    -- Allow trigger to create profiles during signup (id = new auth user)
    id = auth.uid()
    OR
    -- Allow existing admins to insert profiles manually
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'ADMIN'
    )
  );

-- Policy 6: Prevent all deletes by users (admins can via app logic)
CREATE POLICY "No deletes via RLS"
  ON user_profiles FOR DELETE
  USING (false);

-- Update trigger function with error handling and search_path
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
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail signup
  RAISE WARNING 'Error creating user profile: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
