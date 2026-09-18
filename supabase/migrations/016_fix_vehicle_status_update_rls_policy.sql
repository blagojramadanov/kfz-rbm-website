-- Fix RLS UPDATE policy for submitted_vehicles status transitions
-- Issue: The original policy only checked USING (existing row) without WITH CHECK (new row)
-- This caused updates to fail because the new row with status='submitted' didn't match the old condition status='draft'

-- Drop the old, incomplete policy
DROP POLICY IF EXISTS "Users can update their own draft vehicles" ON submitted_vehicles;

-- Create the corrected policy with both USING and WITH CHECK
-- USING: Only existing draft vehicles can be updated (by their owner)
-- WITH CHECK: After update, the vehicle must still belong to the owner and status must be valid
CREATE POLICY "Users can update their own draft vehicles"
  ON submitted_vehicles FOR UPDATE
  TO authenticated
  USING (
    -- Only draft vehicles belonging to the authenticated user can be selected for update
    auth.uid() = user_id
    AND status = 'draft'
  )
  WITH CHECK (
    -- After update, the vehicle must still belong to the authenticated user
    -- and the new status must be valid (draft for continuing edits, submitted for submission)
    auth.uid() = user_id
    
    AND status IN ('draft', 'submitted')
  );
