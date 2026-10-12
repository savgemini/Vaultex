-- ============================================================
-- Admin read access for deposits and profiles
-- ============================================================

-- Allow authenticated admins to review all transaction rows while keeping
-- normal users scoped to their own transaction history.
DROP POLICY IF EXISTS "select_own_transactions" ON transactions;
CREATE POLICY "select_own_transactions" ON transactions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- Allow admins to read the full profile directory needed for user names.
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR EXISTS (
      SELECT 1 FROM profiles AS requester
      WHERE requester.id = auth.uid()
        AND requester.is_admin = true
    )
  );
