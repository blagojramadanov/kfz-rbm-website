-- Grant necessary table-level permissions for authenticated users to submit vehicles
-- RLS policies will still control which rows users can access
-- This is the table-level permission gate that comes BEFORE RLS row-level checks

-- Grants for submitted_vehicles table (UUID-based, no sequences needed)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submitted_vehicles TO authenticated;

-- Grants for submitted_vehicle_images table (UUID-based, no sequences needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submitted_vehicle_images TO authenticated;

-- Grants for vehicle storage bucket access (if using Supabase Storage)
-- Note: Storage permissions are managed via storage.objects table RLS, not here
GRANT USAGE ON SCHEMA storage TO authenticated;

-- Grant service_role full access (for admin operations and server-side actions)
GRANT ALL ON public.submitted_vehicles TO service_role;
GRANT ALL ON public.submitted_vehicle_images TO service_role;
