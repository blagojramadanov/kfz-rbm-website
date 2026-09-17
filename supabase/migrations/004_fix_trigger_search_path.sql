-- Fix the create_user_profile trigger function
-- Issue: Function couldn't find user_profiles table because search_path wasn't set
-- Solution: Explicitly qualify table with schema and set search_path in function definition

-- Drop the old trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop and recreate the function with proper schema qualification and search_path
DROP FUNCTION IF EXISTS create_user_profile();

CREATE FUNCTION create_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Explicitly use public schema prefix
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'CUSTOMER'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but allow signup to proceed
  RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Grant necessary permissions to ensure the function can execute
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT INSERT ON public.user_profiles TO authenticated, service_role;
