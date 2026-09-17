-- Grant UPDATE and DELETE permissions to authenticated users for admin operations
-- RLS policies will enforce that only admins can actually perform these operations

-- ============================================================================
-- VEHICLES TABLE
-- ============================================================================
-- Admins need UPDATE and DELETE on vehicles (RLS policies enforce admin-only access)
GRANT UPDATE, DELETE ON public.vehicles TO authenticated;

-- ============================================================================
-- SUBMITTED VEHICLES TABLE
-- ============================================================================
-- Admins need full permissions (users have their own restrictions via RLS)
GRANT UPDATE, DELETE ON public.submitted_vehicles TO authenticated;

-- ============================================================================
-- CUSTOMER INQUIRIES TABLE
-- ============================================================================
-- Admins need full permissions
GRANT UPDATE, DELETE ON public.customer_inquiries TO authenticated;

-- ============================================================================
-- NOTE: Table-level GRANTs + RLS policies work together:
-- 1. Table-level GRANT allows the operation (UPDATE, DELETE, etc.)
-- 2. RLS policy then decides who can actually do it
-- Without the table-level GRANT, operation fails immediately with permission error
-- ============================================================================
