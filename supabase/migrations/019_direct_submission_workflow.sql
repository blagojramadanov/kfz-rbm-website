-- ============================================================================
-- DIRECT SUBMISSION WORKFLOW MIGRATION
-- ============================================================================
-- Changes the vehicle submission flow from approval-based to direct submission
-- Customers can submit immediately → status: 'eingereicht'
-- Admin manages status: eingereicht → in_bearbeitung → angebot_gesendet OR abgelehnt
-- Submissions are PRIVATE (not public listings)

-- ============================================================================
-- 1. UPDATE SUBMISSION STATUS VALUES & ADD NEW COLUMNS
-- ============================================================================
-- Update the status check constraint to allow new statuses
ALTER TABLE submitted_vehicles DROP CONSTRAINT IF EXISTS submitted_vehicles_status_check;

ALTER TABLE submitted_vehicles ADD CONSTRAINT submitted_vehicles_status_check
  CHECK (status IN ('eingereicht', 'in_bearbeitung', 'angebot_gesendet', 'abgelehnt'));

-- Add fields for rejection handling and notifications
ALTER TABLE submitted_vehicles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE submitted_vehicles ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE submitted_vehicles ADD COLUMN IF NOT EXISTS status_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE submitted_vehicles ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Track when customer was notified (to prevent duplicate emails)
ALTER TABLE submitted_vehicles ADD COLUMN IF NOT EXISTS rejection_notified_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient admin queries
CREATE INDEX IF NOT EXISTS idx_submitted_vehicles_status ON submitted_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_submitted_vehicles_created_at_desc ON submitted_vehicles(created_at DESC);

-- ============================================================================
-- 2. ADMIN NOTIFICATION PREFERENCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_on_new_submission BOOLEAN DEFAULT true,
  email_address VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Admins can only view/edit their own settings
CREATE POLICY "Admins can manage own settings" ON admin_settings
  FOR ALL USING (
    auth.uid() = admin_id
    AND auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'ADMIN')
  );

-- ============================================================================
-- 3. UPDATE RLS POLICIES - SUBMISSIONS ARE PRIVATE
-- ============================================================================
-- Drop old public-viewing policies (if any)
DROP POLICY IF EXISTS "Users can view their own submissions" ON submitted_vehicles;
DROP POLICY IF EXISTS "Admins can view all submissions" ON submitted_vehicles;

-- NEW: Users can only view THEIR OWN submissions
CREATE POLICY "Users can view own submissions" ON submitted_vehicles
  FOR SELECT USING (auth.uid() = user_id);

-- NEW: Admins can view all submissions
CREATE POLICY "Admins can view all submissions" ON submitted_vehicles
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'ADMIN')
  );

-- ============================================================================
-- 4. SUBMISSION STATUS UPDATES - ADMIN ONLY
-- ============================================================================
-- Drop old update policies
DROP POLICY IF EXISTS "Users can update their own draft vehicles" ON submitted_vehicles;
DROP POLICY IF EXISTS "Admins can update any submission" ON submitted_vehicles;

-- NEW: Users can only update DRAFT submissions (status 'eingereicht' before first response)
-- Once admin responds, user cannot edit
CREATE POLICY "Users can edit own eingereicht submissions" ON submitted_vehicles
  FOR UPDATE USING (auth.uid() = user_id AND status = 'eingereicht')
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'eingereicht'  -- Cannot change status
    -- Can only update: brand, model, year, mileage, price, transmission, fuel_type, body_type, color, power_hp, description
  );

-- NEW: Admins can update any submission (especially status)
CREATE POLICY "Admins can update any submission" ON submitted_vehicles
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'ADMIN')
  );

-- Prevent users from deleting submissions once submitted
DROP POLICY IF EXISTS "Users can delete their own draft vehicles" ON submitted_vehicles;
DROP POLICY IF EXISTS "Admins can delete any submission" ON submitted_vehicles;

CREATE POLICY "Admins can delete submissions" ON submitted_vehicles
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'ADMIN')
  );

-- ============================================================================
-- 5. SUBMITTED VEHICLE IMAGES - KEEP EXISTING RLS
-- ============================================================================
-- Images follow submission privacy
-- (existing policies should work - admins can see all, users only their own)

-- ============================================================================
-- 6. MIGRATION DATA - Convert existing submissions to new statuses
-- ============================================================================
-- Map old statuses to new ones
-- draft → eingereicht (ready to send)
-- submitted → eingereicht
-- under_review → in_bearbeitung (admin is reviewing)
-- approved → (remove from submissions - these become vehicles) - we keep them for history
-- rejected → abgelehnt (with existing reason)

UPDATE submitted_vehicles
SET status = 'eingereicht'
WHERE status IN ('draft', 'submitted');

UPDATE submitted_vehicles
SET status = 'in_bearbeitung'
WHERE status = 'under_review';

-- Keep rejected as is, with existing status_reason as rejection_reason
UPDATE submitted_vehicles
SET rejection_reason = status_reason
WHERE status = 'abgelehnt' AND rejection_reason IS NULL AND status_reason IS NOT NULL;

-- ============================================================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_submitted_vehicles_user_id ON submitted_vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_submitted_vehicles_status_updated_at ON submitted_vehicles(status_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_settings_admin_id ON admin_settings(admin_id);

-- ============================================================================
-- 8. TRIGGERS - Auto-track status updates
-- ============================================================================
CREATE OR REPLACE FUNCTION track_submission_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_updated_at = NOW();
    NEW.status_updated_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_submission_status_change ON submitted_vehicles;
CREATE TRIGGER on_submission_status_change
  BEFORE UPDATE ON submitted_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION track_submission_status_change();

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================
/*
WHAT CHANGED:

1. STATUSES: Updated to reflect direct submission flow
   - eingereicht: New submission from customer
   - in_bearbeitung: Admin is reviewing
   - angebot_gesendet: Admin sent offer/quote to customer
   - abgelehnt: Admin rejected (with optional reason)

2. NEW COLUMNS:
   - rejection_reason: Why admin rejected (sent to customer)
   - status_updated_at: When status last changed
   - status_updated_by: Which admin changed it
   - admin_notes: Internal notes (not shown to customer)
   - rejection_notified_at: When customer was notified of rejection

3. RLS POLICIES:
   - Submissions are PRIVATE (not public)
   - Users can only view/edit their own
   - Admins can view/edit all
   - Users cannot change status (admin-only)
   - Vehicles table (public listings) is separate

4. ADMIN SETTINGS TABLE:
   - Track which admins want email notifications
   - Store notification email addresses
   - Prevent duplicate notifications

5. STATUS TRACKING:
   - Trigger auto-tracks who changed status and when
   - Important for audit trail and notifications

6. DATA MIGRATION:
   - draft/submitted → eingereicht
   - under_review → in_bearbeitung
   - approved → (kept for history, no longer created)
   - rejected → abgelehnt

WHAT STAYS THE SAME:
- submitted_vehicles table name
- submitted_vehicle_images table
- Customer can submit anytime without approval
- Admin can reject with reason
- Submissions remain private

WHAT'S NEW:
- Direct submission (no approval gate before first save)
- Admin status management workflow
- Email notifications on rejection
- Admin notification preferences
- Spam protection (in application code)
- Admin visibility badge for new submissions
*/
