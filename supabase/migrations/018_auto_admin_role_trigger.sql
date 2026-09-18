-- ============================================================================
-- AUTOMATIC ADMIN ROLE ASSIGNMENT MIGRATION
-- ============================================================================
-- This migration creates a trigger that automatically assigns the 'admin' role
-- to the account with email 'kfzrbm@gmail.com', and 'customer' role to all others.

-- ============================================================================
-- 1. CREATE FUNCTION: auto_assign_role_on_user_creation
-- ============================================================================
-- This function runs when a new user is created in auth.users
-- It creates a user_profiles row with the appropriate role based on email
CREATE OR REPLACE FUNCTION auto_assign_role_on_user_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user profile with role assignment
  -- kfzrbm@gmail.com gets 'ADMIN' role, all others get 'CUSTOMER' role
  INSERT INTO user_profiles (
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
    COALESCE(NEW.user_metadata->>'full_name', ''),
    CASE
      WHEN NEW.email = 'kfzrbm@gmail.com' THEN 'ADMIN'
      ELSE 'CUSTOMER'
    END,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. CREATE TRIGGER: on_auth_user_created
-- ============================================================================
-- This trigger calls the function above whenever a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_role_on_user_creation();

-- ============================================================================
-- 3. ONE-TIME FIX FOR EXISTING ACCOUNTS (Run if kfzrbm@gmail.com exists)
-- ============================================================================
-- Uncomment and run this if the kfzrbm@gmail.com account already exists
-- This will update their profile to have the ADMIN role
/*
UPDATE user_profiles
SET role = 'ADMIN'
WHERE email = 'kfzrbm@gmail.com';
*/

-- ============================================================================
-- 4. RLS POLICY: Prevent users from changing their own role
-- ============================================================================
-- Drop existing policy if present
DROP POLICY IF EXISTS "Users cannot update role" ON user_profiles;

-- Create new policy that blocks role updates from regular users
CREATE POLICY "Users cannot update role"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    -- Only allow the update if the role is NOT being changed
    -- (SELECT role FROM user_profiles WHERE id = auth.uid()) = (NEW.role)
    -- OR: Simply block all updates to prevent role changes
    false  -- This blocks all UPDATE attempts for the user
  );

-- ============================================================================
-- 5. ALTERNATIVE: Allow profile updates but protect role column
-- ============================================================================
-- If you want to allow users to update OTHER fields (name, phone, etc)
-- but not the role, use this policy instead:

-- Drop the blocking policy first
DROP POLICY IF EXISTS "Users cannot update role" ON user_profiles;

-- Create a more permissive policy
CREATE POLICY "Users can update own profile except role"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())  -- Role must stay the same
  );

-- ============================================================================
-- 6. ENSURE ADMINS CAN UPDATE PROFILES (server-side, not via RLS)
-- ============================================================================
-- Admins will use the service role key in server actions, which bypasses RLS
-- So no policy needed for admin updates - service role has full access

-- ============================================================================
-- VERIFICATION QUERIES (Run these to test)
-- ============================================================================
-- After running this migration, you can verify with:
/*
-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'auto_assign_role_on_user_creation';

-- Check policies on user_profiles
SELECT policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Check existing user roles
SELECT email, role FROM user_profiles ORDER BY email;
*/

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- 1. Trigger automatically creates user_profiles on auth.users INSERT
-- 2. Email 'kfzrbm@gmail.com' → role = 'ADMIN'
-- 3. All other emails → role = 'CUSTOMER'
-- 4. RLS prevents users from updating their role column
-- 5. Service role key (admin client) bypasses RLS for admin operations
