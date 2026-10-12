-- Admin checks must bypass profiles RLS to avoid a recursive policy lookup.
ALTER TABLE deposit_methods
  ADD COLUMN IF NOT EXISTS deposit_address text NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$;

DROP POLICY IF EXISTS select_own_profile ON profiles;
CREATE POLICY select_own_profile ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_platform_admin());

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'orders', 'investments', 'verification_records', 'account_restrictions',
    'security_events', 'referrals', 'wallet_connections', 'support_tickets',
    'balances', 'notifications'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'admin_read_' || table_name, table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (public.is_platform_admin())',
      'admin_read_' || table_name,
      table_name
    );
  END LOOP;
END $$;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'assets', 'investment_products', 'deposit_methods', 'withdrawal_methods'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'admin_manage_' || table_name, table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin())',
      'admin_manage_' || table_name,
      table_name
    );
  END LOOP;
END $$;

DROP POLICY IF EXISTS admin_insert_notifications ON notifications;
CREATE POLICY admin_insert_notifications ON notifications
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS admin_manage_verification_records ON verification_records;
CREATE POLICY admin_manage_verification_records ON verification_records
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS admin_manage_account_restrictions ON account_restrictions;
CREATE POLICY admin_manage_account_restrictions ON account_restrictions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin() AND created_by = auth.uid());

DROP POLICY IF EXISTS admin_update_profiles ON profiles;
CREATE POLICY admin_update_profiles ON profiles
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());