-- Grant necessary table-level permissions for authenticated users
-- RLS policies will still control which rows users can access
-- This is the table-level permission gate that comes BEFORE RLS row-level checks

-- Ensure schema usage is granted
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================================================
-- VEHICLES TABLE (KFZ RBM Inventory)
-- ============================================================================
-- Customers need SELECT to view available vehicles for trade-in and purchase
-- Admin operations handled via service_role
GRANT SELECT ON public.vehicles TO authenticated;

-- Vehicle images - customers need to see images of available vehicles
GRANT SELECT ON public.vehicle_images TO authenticated;

-- Vehicle features - customers may need to read vehicle features/specs
GRANT SELECT ON public.vehicle_features TO authenticated;

-- ============================================================================
-- TRADE-IN REQUESTS TABLE
-- ============================================================================
-- Customers need full CRUD on their own requests (RLS controls row access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_in_requests TO authenticated;

-- ============================================================================
-- CUSTOMER INQUIRIES TABLE
-- ============================================================================
-- Customers may already have this, but ensure it's set
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_inquiries TO authenticated;

-- ============================================================================
-- SERVICE ROLE PERMISSIONS (Admin/Backend Operations)
-- ============================================================================
-- Service role needs full access for admin operations and server-side actions
GRANT ALL ON public.vehicles TO service_role;
GRANT ALL ON public.vehicle_images TO service_role;
GRANT ALL ON public.vehicle_features TO service_role;
GRANT ALL ON public.trade_in_requests TO service_role;
GRANT ALL ON public.customer_inquiries TO service_role;
GRANT ALL ON public.appointments TO service_role;

-- ============================================================================
-- IMPORTANT NOTE
-- ============================================================================
-- After running this migration, make sure RLS policies are properly configured:
--
-- For 'vehicles' table:
--   - Public users should see status = 'available' or 'featured'
--   - Authenticated users should see same (via RLS policies)
--
-- For 'trade_in_requests' table:
--   - Users should only see their own requests (USING: auth.uid() = user_id)
--   - Admins should see all requests
--
-- Table-level GRANT just opens the door; RLS policies control which rows are visible
