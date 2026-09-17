-- Fix foreign key relationships for Supabase PostgREST API
--
-- Issue: The queries try to join user_id to user_profiles (to get full_name, email)
-- but the FKs currently point to auth.users, causing PGRST200 "could not find relationship" errors
--
-- Solution: We need to tell Supabase/PostgREST how to resolve these relationships
-- Since user_profiles.id = auth.users.id (1-to-1 relationship), we can safely
-- add an explicit constraint that points to user_profiles

-- Drop existing FK constraints that point to auth.users
ALTER TABLE submitted_vehicles
DROP CONSTRAINT submitted_vehicles_user_id_fkey;

ALTER TABLE trade_in_requests
DROP CONSTRAINT trade_in_requests_user_id_fkey;

-- Add new FK constraints that point to user_profiles
-- This enables Supabase PostgREST to resolve the relationship
ALTER TABLE submitted_vehicles
ADD CONSTRAINT submitted_vehicles_user_id_fkey
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE trade_in_requests
ADD CONSTRAINT trade_in_requests_user_id_fkey
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Explanation:
-- user_profiles.id is a PRIMARY KEY that REFERENCES auth.users(id)
-- So by pointing to user_profiles instead of auth.users, we:
-- 1. Still ensure referential integrity (user must exist in auth AND user_profiles)
-- 2. Enable Supabase PostgREST to resolve the relationship and fetch full_name, email, etc.
-- 3. Maintain the 1-to-1 relationship between auth.users and user_profiles
