/*
# Extended Schema — Orders, Investments, Methods, Support, Notifications, Audit, Settings

## Overview
This migration adds the remaining operational tables for the full trading platform.

## New Tables
1. orders — Trade orders (market, limit, stop) with buy/sell side, status tracking
2. investment_products — Configurable investment products (flexible, fixed-term, staking)
3. investments — User investments in products with principal, accrued earnings, status
4. deposit_methods — Admin-configurable deposit methods (crypto, bank transfer, etc.)
5. withdrawal_methods — Admin-configurable withdrawal methods
6. support_tickets — Support conversations with status, priority, assignment
7. support_messages — Individual messages within support tickets
8. notifications — User notification center (security, deposit, withdrawal, etc.)
9. audit_logs — Immutable admin action audit trail
10. site_settings — Platform configuration (fees, branding, security, maintenance)
11. referrals — Referral tracking and rewards

## Security
- RLS on all tables
- User tables scoped to own data
- Site settings and audit logs readable by authenticated
- Deposit/withdrawal methods readable by all (needed for deposit/withdrawal flows)
*/

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  pair text NOT NULL DEFAULT '',
  side text NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type text NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
  price numeric(20,8) NOT NULL DEFAULT 0,
  amount numeric(20,8) NOT NULL DEFAULT 0,
  filled_amount numeric(20,8) NOT NULL DEFAULT 0,
  total numeric(20,8) NOT NULL DEFAULT 0,
  fee numeric(20,8) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'open', 'partially_filled', 'filled', 'cancelled', 'rejected', 'expired')),
  asset_symbol text NOT NULL DEFAULT '',
  reference text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_orders" ON orders;
CREATE POLICY "select_own_orders" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_orders" ON orders;
CREATE POLICY "insert_own_orders" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_orders" ON orders;
CREATE POLICY "update_own_orders" ON orders FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_orders" ON orders;
CREATE POLICY "delete_own_orders" ON orders FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================================
-- INVESTMENT PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS investment_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  asset_symbol text NOT NULL DEFAULT '',
  product_type text NOT NULL CHECK (product_type IN ('flexible', 'fixed_term', 'staking', 'portfolio_plan')),
  term_days integer NOT NULL DEFAULT 0,
  apy numeric(8,4) NOT NULL DEFAULT 0,
  min_amount numeric(20,8) NOT NULL DEFAULT 0,
  max_amount numeric(20,8) NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'coming_soon', 'closed')),
  start_date timestamptz,
  end_date timestamptz,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE investment_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_investment_products" ON investment_products;
CREATE POLICY "read_investment_products" ON investment_products FOR SELECT
  TO anon, authenticated USING (true);

-- ============================================================
-- INVESTMENTS (user investments in products)
-- ============================================================
CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES investment_products(id) ON DELETE CASCADE,
  asset_symbol text NOT NULL DEFAULT '',
  principal numeric(20,8) NOT NULL DEFAULT 0,
  accrued_earnings numeric(20,8) NOT NULL DEFAULT 0,
  apy numeric(8,4) NOT NULL DEFAULT 0,
  start_date timestamptz NOT NULL DEFAULT now(),
  maturity_date timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'pending')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_investments" ON investments;
CREATE POLICY "select_own_investments" ON investments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_investments" ON investments;
CREATE POLICY "insert_own_investments" ON investments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_investments" ON investments;
CREATE POLICY "update_own_investments" ON investments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);

-- ============================================================
-- DEPOSIT METHODS
-- ============================================================
CREATE TABLE IF NOT EXISTS deposit_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  currency text NOT NULL DEFAULT '',
  asset_symbol text NOT NULL DEFAULT '',
  network text NOT NULL DEFAULT '',
  method_type text NOT NULL CHECK (method_type IN ('crypto', 'bank_transfer', 'card', 'other')),
  instructions text NOT NULL DEFAULT '',
  min_deposit numeric(20,8) NOT NULL DEFAULT 0,
  max_deposit numeric(20,8) NOT NULL DEFAULT 0,
  fee numeric(10,4) NOT NULL DEFAULT 0,
  fee_type text NOT NULL DEFAULT 'fixed' CHECK (fee_type IN ('fixed', 'percentage')),
  processing_time text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE deposit_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_deposit_methods" ON deposit_methods;
CREATE POLICY "read_deposit_methods" ON deposit_methods FOR SELECT
  TO anon, authenticated USING (true);

-- ============================================================
-- WITHDRAWAL METHODS
-- ============================================================
CREATE TABLE IF NOT EXISTS withdrawal_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  asset_symbol text NOT NULL DEFAULT '',
  network text NOT NULL DEFAULT '',
  method_type text NOT NULL CHECK (method_type IN ('crypto', 'bank_transfer', 'other')),
  min_withdrawal numeric(20,8) NOT NULL DEFAULT 0,
  max_withdrawal numeric(20,8) NOT NULL DEFAULT 0,
  fee numeric(10,4) NOT NULL DEFAULT 0,
  fee_type text NOT NULL DEFAULT 'fixed' CHECK (fee_type IN ('fixed', 'percentage')),
  processing_time text NOT NULL DEFAULT '',
  verification_required boolean NOT NULL DEFAULT true,
  instructions text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE withdrawal_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_withdrawal_methods" ON withdrawal_methods;
CREATE POLICY "read_withdrawal_methods" ON withdrawal_methods FOR SELECT
  TO anon, authenticated USING (true);

-- ============================================================
-- SUPPORT TICKETS
-- ============================================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_number text NOT NULL UNIQUE,
  subject text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'account', 'deposit', 'withdrawal', 'trading', 'investment', 'security', 'other')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'waiting_customer', 'waiting_support', 'resolved', 'closed')),
  assigned_to uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tickets" ON support_tickets;
CREATE POLICY "select_own_tickets" ON support_tickets FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR auth.uid() = assigned_to);

DROP POLICY IF EXISTS "insert_own_tickets" ON support_tickets;
CREATE POLICY "insert_own_tickets" ON support_tickets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tickets" ON support_tickets;
CREATE POLICY "update_own_tickets" ON support_tickets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR auth.uid() = assigned_to) WITH CHECK (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);

-- ============================================================
-- SUPPORT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL DEFAULT '',
  is_internal boolean NOT NULL DEFAULT false,
  attachments jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_messages" ON support_messages;
CREATE POLICY "select_own_messages" ON support_messages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = support_messages.ticket_id AND (t.user_id = auth.uid() OR t.assigned_to = auth.uid()))
  );

DROP POLICY IF EXISTS "insert_own_messages" ON support_messages;
CREATE POLICY "insert_own_messages" ON support_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON support_messages(created_at);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('security', 'deposit', 'withdrawal', 'transaction', 'investment', 'support', 'account', 'system')),
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  reference text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL DEFAULT '',
  target_user_id uuid REFERENCES auth.users(id),
  target_entity text NOT NULL DEFAULT '',
  reason text NOT NULL DEFAULT '',
  before_values jsonb,
  after_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_audit_logs" ON audit_logs;
CREATE POLICY "select_audit_logs" ON audit_logs FOR SELECT
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- ============================================================
-- SITE SETTINGS (single-row table)
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text NOT NULL DEFAULT 'Vaultex',
  contact_email text NOT NULL DEFAULT 'support@vaultex.com',
  support_email text NOT NULL DEFAULT 'support@vaultex.com',
  timezone text NOT NULL DEFAULT 'UTC',
  default_currency text NOT NULL DEFAULT 'USD',
  primary_accent text NOT NULL DEFAULT '#0F766E',
  trading_fee_pct numeric(8,4) NOT NULL DEFAULT 0.10,
  withdrawal_fee_pct numeric(8,4) NOT NULL DEFAULT 0.00,
  min_deposit numeric(20,2) NOT NULL DEFAULT 10,
  min_withdrawal numeric(20,2) NOT NULL DEFAULT 10,
  max_withdrawal_daily numeric(20,2) NOT NULL DEFAULT 50000,
  require_2fa boolean NOT NULL DEFAULT false,
  session_duration_hours integer NOT NULL DEFAULT 24,
  admin_session_duration_hours integer NOT NULL DEFAULT 8,
  withdrawal_confirmation_required boolean NOT NULL DEFAULT true,
  maintenance_mode boolean NOT NULL DEFAULT false,
  maintenance_message text NOT NULL DEFAULT '',
  terms_url text NOT NULL DEFAULT '',
  privacy_url text NOT NULL DEFAULT '',
  risk_disclosure_url text NOT NULL DEFAULT '',
  twitter_url text NOT NULL DEFAULT '',
  telegram_url text NOT NULL DEFAULT '',
  discord_url text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_site_settings" ON site_settings;
CREATE POLICY "read_site_settings" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

-- ============================================================
-- REFERRALS
-- ============================================================
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL DEFAULT '',
  bonus numeric(20,8) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_referrals" ON referrals;
CREATE POLICY "select_own_referrals" ON referrals FOR SELECT
  TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "insert_own_referrals" ON referrals;
CREATE POLICY "insert_own_referrals" ON referrals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = referrer_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);

-- ============================================================
-- TRIGGERS for updated_at on new tables
-- ============================================================
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_investments_updated_at ON investments;
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_investment_products_updated_at ON investment_products;
CREATE TRIGGER update_investment_products_updated_at BEFORE UPDATE ON investment_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deposit_methods_updated_at ON deposit_methods;
CREATE TRIGGER update_deposit_methods_updated_at BEFORE UPDATE ON deposit_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_withdrawal_methods_updated_at ON withdrawal_methods;
CREATE TRIGGER update_withdrawal_methods_updated_at BEFORE UPDATE ON withdrawal_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
