/*
# Core Platform Schema — Profiles, Assets, Balances, Transactions

## Overview
This migration creates the foundational tables for a crypto investment and trading platform:
- User profiles extending Supabase Auth
- Crypto assets and blockchain networks
- User balances per asset
- Unified transaction records
- Account restrictions system
- Security events log
- Verification/KYC records

## New Tables

1. **profiles** — Extends auth.users with full_name, country, phone, status, verification_level, referral info
2. **assets** — Crypto assets (BTC, ETH, SOL, etc.) with price, status, deposit/withdrawal/trading flags
3. **networks** — Blockchain networks (Bitcoin, Ethereum, Solana, etc.)
4. **asset_networks** — Many-to-many linking assets to networks with deposit/withdrawal addresses
5. **balances** — User balances per asset (available, invested, pending)
6. **transactions** — Unified transaction ledger (deposits, withdrawals, trades, transfers, investments, fees, rewards)
7. **account_restrictions** — Granular restrictions per user (disable deposits, withdrawals, trading, etc.)
8. **security_events** — Login history, security alerts, device/session tracking
9. **verification_records** — KYC verification stages and documents

## Security
- RLS enabled on all tables
- User-facing tables scoped to authenticated users accessing only their own data
- Assets/networks are publicly readable (anon + authenticated) for market display
- All write operations require authentication and ownership verification
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  referral_code text,
  referred_by uuid REFERENCES auth.users(id),
  account_status text NOT NULL DEFAULT 'pending_verification'
    CHECK (account_status IN ('active', 'pending_verification', 'restricted', 'suspended', 'closed')),
  verification_level text NOT NULL DEFAULT 'unverified'
    CHECK (verification_level IN ('unverified', 'basic', 'verified', 'rejected')),
  is_admin boolean NOT NULL DEFAULT false,
  admin_role text
    CHECK (admin_role IS NULL OR admin_role IN ('super_admin', 'operations_admin', 'finance_admin', 'support_admin', 'compliance_admin', 'content_admin', 'read_only')),
  two_factor_enabled boolean NOT NULL DEFAULT false,
  preferred_currency text NOT NULL DEFAULT 'USD',
  timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- ============================================================
-- NETWORKS
-- ============================================================
CREATE TABLE IF NOT EXISTS networks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE networks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_networks" ON networks;
CREATE POLICY "read_networks" ON networks FOR SELECT
  TO anon, authenticated USING (true);

-- ============================================================
-- ASSETS
-- ============================================================
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  symbol text NOT NULL UNIQUE,
  network text NOT NULL DEFAULT '',
  decimals integer NOT NULL DEFAULT 8,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'coming_soon')),
  deposit_enabled boolean NOT NULL DEFAULT true,
  withdrawal_enabled boolean NOT NULL DEFAULT true,
  trading_enabled boolean NOT NULL DEFAULT true,
  min_deposit numeric(20,8) NOT NULL DEFAULT 0,
  min_withdrawal numeric(20,8) NOT NULL DEFAULT 0,
  withdrawal_fee numeric(20,8) NOT NULL DEFAULT 0,
  current_price numeric(20,8) NOT NULL DEFAULT 0,
  price_change_24h numeric(10,4) NOT NULL DEFAULT 0,
  market_cap numeric(20,2) NOT NULL DEFAULT 0,
  volume_24h numeric(20,2) NOT NULL DEFAULT 0,
  high_24h numeric(20,8) NOT NULL DEFAULT 0,
  low_24h numeric(20,8) NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'major'
    CHECK (category IN ('major', 'stablecoin', 'defi', 'layer1', 'layer2', 'meme', 'other')),
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_assets" ON assets;
CREATE POLICY "read_assets" ON assets FOR SELECT
  TO anon, authenticated USING (true);

-- ============================================================
-- ASSET NETWORKS (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS asset_networks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  deposit_address text,
  min_confirmations integer NOT NULL DEFAULT 3,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(asset_id, network_id)
);

ALTER TABLE asset_networks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_asset_networks" ON asset_networks;
CREATE POLICY "read_asset_networks" ON asset_networks FOR SELECT
  TO anon, authenticated USING (true);

-- ============================================================
-- BALANCES
-- ============================================================
CREATE TABLE IF NOT EXISTS balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  available numeric(20,8) NOT NULL DEFAULT 0,
  invested numeric(20,8) NOT NULL DEFAULT 0,
  pending numeric(20,8) NOT NULL DEFAULT 0,
  avg_acquisition_price numeric(20,8) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, asset_id)
);

ALTER TABLE balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_balances" ON balances;
CREATE POLICY "select_own_balances" ON balances FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_balances" ON balances;
CREATE POLICY "insert_own_balances" ON balances FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_balances" ON balances;
CREATE POLICY "update_own_balances" ON balances FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_balances" ON balances;
CREATE POLICY "delete_own_balances" ON balances FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- TRANSACTIONS (unified ledger)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL
    CHECK (type IN ('deposit', 'withdrawal', 'buy', 'sell', 'trade', 'transfer', 'investment', 'investment_payout', 'fee', 'reward', 'referral_bonus')),
  asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
  asset_symbol text NOT NULL DEFAULT '',
  amount numeric(20,8) NOT NULL DEFAULT 0,
  fee numeric(20,8) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'under_review', 'confirmed', 'completed', 'rejected', 'expired', 'cancelled', 'processing', 'approved', 'partially_filled', 'filled')),
  reference text NOT NULL DEFAULT '',
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_transactions" ON transactions;
CREATE POLICY "select_own_transactions" ON transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_transactions" ON transactions;
CREATE POLICY "insert_own_transactions" ON transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_transactions" ON transactions;
CREATE POLICY "update_own_transactions" ON transactions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- ============================================================
-- ACCOUNT RESTRICTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS account_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restriction_type text NOT NULL
    CHECK (restriction_type IN ('disable_deposits', 'disable_withdrawals', 'disable_trading', 'disable_investments', 'disable_transfers', 'require_verification', 'require_manual_review', 'suspend_login', 'full_suspension')),
  reason text NOT NULL DEFAULT '',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE account_restrictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_restrictions" ON account_restrictions;
CREATE POLICY "select_own_restrictions" ON account_restrictions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_restrictions_user_id ON account_restrictions(user_id);
CREATE INDEX IF NOT EXISTS idx_restrictions_active ON account_restrictions(is_active);

-- ============================================================
-- SECURITY EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL
    CHECK (event_type IN ('login', 'logout', 'password_change', 'two_factor_enabled', 'two_factor_disabled', 'withdrawal_request', 'withdrawal_completed', 'suspicious_activity', 'device_added', 'session_revoked')),
  ip_address text,
  user_agent text,
  device_info jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_security_events" ON security_events;
CREATE POLICY "select_own_security_events" ON security_events FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_security_events" ON security_events;
CREATE POLICY "insert_own_security_events" ON security_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);

-- ============================================================
-- VERIFICATION RECORDS (KYC)
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  stage text NOT NULL
    CHECK (stage IN ('basic_info', 'identity', 'address', 'review', 'approved', 'rejected')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  data jsonb,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE verification_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_verification" ON verification_records;
CREATE POLICY "select_own_verification" ON verification_records FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_verification" ON verification_records;
CREATE POLICY "insert_own_verification" ON verification_records FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_verification" ON verification_records;
CREATE POLICY "update_own_verification" ON verification_records FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_verification_user_id ON verification_records(user_id);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_balances_updated_at ON balances;
CREATE TRIGGER update_balances_updated_at BEFORE UPDATE ON balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_verification_updated_at ON verification_records;
CREATE TRIGGER update_verification_updated_at BEFORE UPDATE ON verification_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
