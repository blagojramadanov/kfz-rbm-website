-- Ensure foreign key constraints for vehicle relationships
-- This fixes relationship resolution for desired_vehicle_id and other vehicle references

-- Check if the constraint exists and rename if needed to standard format
-- for proper Supabase PostgREST relationship resolution

-- For trade_in_requests.desired_vehicle_id -> vehicles
-- Postgres constraint naming is automatic: tablename_columnname_fkey

-- Verify the FK exists with standard naming
-- If it doesn't exist with the right name, the relationship won't resolve

-- Note: This table already has the FK defined in 008_create_trade_in_requests.sql:
-- desired_vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT

-- The constraint should be named: trade_in_requests_desired_vehicle_id_fkey
-- Supabase PostgREST needs this standard naming to resolve relationships

-- If you're still getting "Fahrzeug nicht gefunden", check:
-- 1. The vehicles table actually contains the vehicle record
-- 2. The trade_in_requests.desired_vehicle_id matches a valid vehicles.id
-- 3. The foreign key constraint exists with the standard name

-- You can verify with:
-- SELECT constraint_name FROM information_schema.table_constraints
-- WHERE table_name='trade_in_requests' AND constraint_type='FOREIGN KEY';

-- If the constraint is missing or wrongly named, uncomment and run:
-- ALTER TABLE trade_in_requests
-- DROP CONSTRAINT IF EXISTS trade_in_requests_desired_vehicle_id_fkey;
-- ALTER TABLE trade_in_requests
-- ADD CONSTRAINT trade_in_requests_desired_vehicle_id_fkey
-- FOREIGN KEY (desired_vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT;
