-- ============================================================================
-- 028: Vehicle inquiries and contact form messages
-- ============================================================================
-- Nothing ever inserted into customer_inquiries. From now on the server actions in
-- app/actions/inquiries.ts write to it:
--   * inquiry_type 'general' / 'test_drive': sent from a vehicle detail page
--   * inquiry_type 'contact': the /contact form (vehicle_id is NULL)
--
-- Changes:
--   1. user_id (logged-in sender), preferred_date (test drives), vehicle_label
--      (snapshot "Brand Model (Year)", survives the vehicle being sold/deleted)
--   2. inquiry_type allows 'contact'; preferred_date only on test drives
--   3. customer_phone widened to 30 characters
--   4. Direct INSERTs through the API are no longer allowed: the old policy let
--      anyone with the public anon key insert any row (any status, any content),
--      bypassing validation and the honeypot. The server action validates with zod
--      and then inserts with the service-role client.
--   5. Customers can read their own inquiries (user_id = auth.uid()).
-- ============================================================================

-- 1. Columns
ALTER TABLE public.customer_inquiries
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS preferred_date DATE,
  ADD COLUMN IF NOT EXISTS vehicle_label VARCHAR(200);

-- 3. Phone length
ALTER TABLE public.customer_inquiries ALTER COLUMN customer_phone TYPE VARCHAR(30);

-- 2. Constraints
ALTER TABLE public.customer_inquiries DROP CONSTRAINT IF EXISTS customer_inquiries_inquiry_type_check;
ALTER TABLE public.customer_inquiries
  ADD CONSTRAINT customer_inquiries_inquiry_type_check
  CHECK (inquiry_type IN ('general', 'test_drive', 'part_exchange', 'contact'));

ALTER TABLE public.customer_inquiries DROP CONSTRAINT IF EXISTS customer_inquiries_preferred_date_check;
ALTER TABLE public.customer_inquiries
  ADD CONSTRAINT customer_inquiries_preferred_date_check
  CHECK (preferred_date IS NULL OR inquiry_type = 'test_drive');

CREATE INDEX IF NOT EXISTS idx_customer_inquiries_user_id ON public.customer_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_customer_email ON public.customer_inquiries(customer_email);

-- 4. No direct inserts (server action + service role only)
DROP POLICY IF EXISTS "Allow public to create inquiries" ON public.customer_inquiries;
REVOKE INSERT ON public.customer_inquiries FROM anon, authenticated;

-- 5. Customers read their own inquiries (admins keep "Admins can view all inquiries")
DROP POLICY IF EXISTS "Customers can view own inquiries" ON public.customer_inquiries;
CREATE POLICY "Customers can view own inquiries"
  ON public.customer_inquiries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT ON public.customer_inquiries TO authenticated;
GRANT ALL ON public.customer_inquiries TO service_role;
