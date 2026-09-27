-- ============================================================================
-- 029: Favorites ("Merken")
-- ============================================================================
-- Logged-in customers can save vehicles. The server actions in
-- app/actions/favorites.ts read and write this table with the RLS-bound session
-- client; the user id always comes from the session (auth.uid()).
--
--   * SELECT / DELETE: only your own rows.
--   * INSERT: only for yourself, and only for a vehicle that is publicly visible.
--     The visibility check is the condition of the vehicles policy
--     "Public can view available vehicles" (migration 023).
--   * No UPDATE policy (and no UPDATE grant): a favorite is added or removed.
--   * Admins read all rows (public.is_admin(), migration 023) for the
--     "X× gemerkt" counts in the admin vehicle views.
--
-- ON DELETE CASCADE on vehicle_id: deleting a vehicle removes its favorites.
-- A sold/draft vehicle keeps its favorites; the dashboard shows it as
-- "no longer available".
--
-- Idempotent: safe to run more than once. Run it in the Supabase SQL editor.
-- ============================================================================

-- 1. Table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT favorites_user_vehicle_unique UNIQUE (user_id, vehicle_id)
);

-- 2. Indexes (the unique constraint already covers lookups by user_id first;
--    the explicit index keeps the intent obvious and is cheap)
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_vehicle_id ON public.favorites(vehicle_id);

-- 3. RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add favorites for public vehicles" ON public.favorites;
CREATE POLICY "Users can add favorites for public vehicles"
  ON public.favorites FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = favorites.vehicle_id
        AND v.status = 'available'
        AND v.listing_type IN ('verkauf', 'export')
    )
  );

DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;
CREATE POLICY "Users can delete own favorites"
  ON public.favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all favorites" ON public.favorites;
CREATE POLICY "Admins can view all favorites"
  ON public.favorites FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 4. Grants (no UPDATE; anon gets nothing)
REVOKE ALL ON public.favorites FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;

-- PostgREST caches the schema; make the new table visible right away.
NOTIFY pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- Verify afterwards:
--   SELECT policyname, cmd FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'favorites';
--   -- expect 4 rows: 2x SELECT, INSERT, DELETE
-- ----------------------------------------------------------------------------
