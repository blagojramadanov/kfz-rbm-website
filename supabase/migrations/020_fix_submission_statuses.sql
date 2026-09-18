-- ============================================================================
-- FIX SUBMISSION STATUSES - REMOVE DRAFT/APPROVED/UNDER_REVIEW
-- ============================================================================
-- BEFORE YOU RUN THIS MIGRATION:
--
-- This migration handles the old status values (draft, submitted, under_review,
-- approved, rejected) and converts them to the new workflow:
--
-- NEW STATUSES ONLY:
-- - eingereicht     (submitted, ready for admin review)
-- - in_bearbeitung  (admin reviewing)
-- - angebot_gesendet (admin sent offer)
-- - abgelehnt       (rejected with reason)
--
-- CONVERSION PLAN:
-- 1. draft              → DELETE (these are work-in-progress, user never sends)
-- 2. submitted          → eingereicht
-- 3. under_review       → in_bearbeitung
-- 4. approved           → DELETE (approved submissions become vehicles table)
-- 5. rejected           → abgelehnt (keep reason)
--
-- ACTION ITEMS (choose one approach):
--
-- APPROACH A (AUTOMATIC - run this SQL):
--   DELETE FROM submitted_vehicles WHERE status = 'draft';
--   DELETE FROM submitted_vehicles WHERE status = 'approved';
--   UPDATE submitted_vehicles SET status = 'eingereicht' WHERE status = 'submitted';
--   UPDATE submitted_vehicles SET status = 'in_bearbeitung' WHERE status = 'under_review';
--   UPDATE submitted_vehicles SET status = 'abgelehnt' WHERE status = 'rejected';
--
-- APPROACH B (MANUAL - run these queries first to see data):
--   SELECT status, COUNT(*) FROM submitted_vehicles GROUP BY status;
--   SELECT id, status, brand, model FROM submitted_vehicles WHERE status='draft';
--   SELECT id, status, brand, model FROM submitted_vehicles WHERE status='approved';
--   Then decide which to delete or convert.
--
-- ============================================================================

-- First, check current state (these SELECT don't modify data)
-- Run this first to see what exists:
/*
SELECT status, COUNT(*) as count,
       GROUP_CONCAT(DISTINCT user_id) as users
FROM submitted_vehicles
GROUP BY status;
*/

-- ============================================================================
-- DATA CLEANUP (uncomment below to execute)
-- ============================================================================

-- Delete draft submissions (these are incomplete, never sent)
-- DELETE FROM submitted_vehicles WHERE status = 'draft';

-- Delete approved submissions (these have been converted to vehicles table)
-- DELETE FROM submitted_vehicles WHERE status = 'approved';

-- Convert submitted → eingereicht
-- UPDATE submitted_vehicles SET status = 'eingereicht' WHERE status = 'submitted';

-- Convert under_review → in_bearbeitung
-- UPDATE submitted_vehicles SET status = 'in_bearbeitung' WHERE status = 'under_review';

-- Rejected stays as is (will update to abgelehnt below if still using old status)
-- UPDATE submitted_vehicles SET status = 'abgelehnt' WHERE status = 'rejected';

-- ============================================================================
-- ENFORCE NEW STATUS CONSTRAINT
-- ============================================================================

-- Drop old constraint
ALTER TABLE submitted_vehicles DROP CONSTRAINT IF EXISTS submitted_vehicles_status_check;

-- Add new constraint (only new statuses allowed)
ALTER TABLE submitted_vehicles ADD CONSTRAINT submitted_vehicles_status_check
  CHECK (status IN ('eingereicht', 'in_bearbeitung', 'angebot_gesendet', 'abgelehnt'));

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- After running this migration:
-- - Dashboard shows only: Eingereicht, In Bearbeitung, Angebot gesendet, Abgelehnt
-- - No "Entwurf" (draft) appears anywhere
-- - No "Genehmigt" (approved) appears anywhere
-- - No "Einreichen" button on dashboard
-- - Customer can only view submissions, not edit/delete after sending
-- - Only admins can change status
