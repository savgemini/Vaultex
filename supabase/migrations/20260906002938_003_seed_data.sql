/*
# Seed Data — Assets, Networks, Methods, Products, Settings

## Overview
Populates the database with development seed data:
- 7 crypto assets (BTC, ETH, SOL, USDT, USDC, XRP, ADA) with realistic demo prices
- 5 blockchain networks
- Asset-network links
- 3 deposit methods (crypto, bank transfer)
- 3 withdrawal methods
- 4 investment products (flexible, fixed-term, staking)
- 1 site settings row

## Important
All prices and market data are clearly DEMO data for development.
Real market-data providers should be connected through backend services.
*/

-- ============================================================
-- NETWORKS
-- ============================================================
INSERT INTO networks (name, code, is_active) VALUES
  ('Bitcoin', 'BTC', true),
  ('Ethereum', 'ERC20', true),
  ('Solana', 'SOL', true),
  ('Ripple', 'XRP', true),
  ('Cardano', 'ADA', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- ASSETS
-- ============================================================
INSERT INTO assets (name, symbol, network, decimals, status, current_price, price_change_24h, market_cap, volume_24h, high_24h, low_24h, category, display_order) VALUES
  ('Bitcoin', 'BTC', 'Bitcoin', 8, 'active', 67284.50, 2.34, 1325000000000, 28500000000, 67800.00, 65400.00, 'major', 1),
  ('Ethereum', 'ETH', 'Ethereum', 8, 'active', 3245.80, 1.87, 390000000000, 15200000000, 3280.00, 3180.00, 'major', 2),
  ('Solana', 'SOL', 'Solana', 8, 'active', 168.42, 4.12, 78000000000, 3200000000, 172.00, 161.50, 'layer1', 3),
  ('Tether', 'USDT', 'Ethereum', 8, 'active', 1.0001, 0.02, 119000000000, 45000000000, 1.0010, 0.9995, 'stablecoin', 4),
  ('USD Coin', 'USDC', 'Ethereum', 8, 'active', 0.9998, -0.01, 34000000000, 8200000000, 1.0005, 0.9990, 'stablecoin', 5),
  ('XRP', 'XRP', 'Ripple', 8, 'active', 0.5234, -1.23, 29000000000, 1100000000, 0.5340, 0.5180, 'major', 6),
  ('Cardano', 'ADA', 'Cardano', 8, 'active', 0.3856, 3.45, 13500000000, 480000000, 0.3920, 0.3710, 'layer1', 7)
ON CONFLICT (symbol) DO NOTHING;

-- ============================================================
-- ASSET NETWORKS
-- ============================================================
INSERT INTO asset_networks (asset_id, network_id, deposit_address, min_confirmations, is_active)
SELECT a.id, n.id, 'demo_' || lower(a.symbol) || '_deposit_address', 3, true
FROM assets a
JOIN networks n ON (
  (a.symbol = 'BTC' AND n.code = 'BTC') OR
  (a.symbol = 'ETH' AND n.code = 'ERC20') OR
  (a.symbol = 'SOL' AND n.code = 'SOL') OR
  (a.symbol = 'USDT' AND n.code = 'ERC20') OR
  (a.symbol = 'USDC' AND n.code = 'ERC20') OR
  (a.symbol = 'XRP' AND n.code = 'XRP') OR
  (a.symbol = 'ADA' AND n.code = 'ADA')
)
ON CONFLICT (asset_id, network_id) DO NOTHING;

-- ============================================================
-- DEPOSIT METHODS
-- ============================================================
INSERT INTO deposit_methods (name, currency, asset_symbol, network, method_type, instructions, min_deposit, max_deposit, fee, fee_type, processing_time, status, display_order) VALUES
  ('Bitcoin Transfer', 'BTC', 'BTC', 'Bitcoin', 'crypto', 'Send BTC to the address provided. Funds will be credited after 3 network confirmations.', 0.0001, 100, 0, 'fixed', '10-30 minutes', 'active', 1),
  ('Ethereum Transfer (ERC-20)', 'ETH', 'ETH', 'Ethereum', 'crypto', 'Send ETH to the address provided. Funds will be credited after 12 network confirmations.', 0.005, 1000, 0, 'fixed', '5-15 minutes', 'active', 2),
  ('Bank Transfer (SEPA)', 'EUR', 'EUR', '', 'bank_transfer', 'Transfer EUR to the bank account provided. Include your reference code in the transfer description.', 10, 100000, 0, 'fixed', '1-3 business days', 'active', 3),
  ('USDT Transfer (ERC-20)', 'USDT', 'USDT', 'Ethereum', 'crypto', 'Send USDT to the address provided on the ERC-20 network. Funds credited after 12 confirmations.', 10, 500000, 0, 'fixed', '5-15 minutes', 'active', 4)
ON CONFLICT DO NOTHING;

-- ============================================================
-- WITHDRAWAL METHODS
-- ============================================================
INSERT INTO withdrawal_methods (name, asset_symbol, network, method_type, min_withdrawal, max_withdrawal, fee, fee_type, processing_time, verification_required, instructions, status, display_order) VALUES
  ('Bitcoin Withdrawal', 'BTC', 'Bitcoin', 'crypto', 0.001, 50, 0.0004, 'fixed', '10-30 minutes', true, 'Enter your Bitcoin wallet address. Withdrawals are processed after security review.', 'active', 1),
  ('Ethereum Withdrawal (ERC-20)', 'ETH', 'Ethereum', 'crypto', 0.01, 500, 0.005, 'fixed', '5-15 minutes', true, 'Enter your Ethereum wallet address. Withdrawals are processed after security review.', 'active', 2),
  ('Bank Withdrawal (SEPA)', 'EUR', '', 'bank_transfer', 50, 50000, 1.50, 'fixed', '1-3 business days', true, 'Enter your bank account details. Withdrawals are processed after security review.', 'active', 3),
  ('USDT Withdrawal (ERC-20)', 'USDT', 'Ethereum', 'crypto', 10, 100000, 1, 'fixed', '5-15 minutes', true, 'Enter your USDT wallet address on the ERC-20 network. Withdrawals are processed after security review.', 'active', 4)
ON CONFLICT DO NOTHING;

-- ============================================================
-- INVESTMENT PRODUCTS
-- ============================================================
INSERT INTO investment_products (name, description, asset_symbol, product_type, term_days, apy, min_amount, max_amount, risk_level, status, start_date, display_order) VALUES
  ('Flexible USDT Savings', 'Earn returns on your USDT with full flexibility. Withdraw anytime after the first 24 hours.', 'USDT', 'flexible', 0, 4.50, 100, 1000000, 'low', 'active', now(), 1),
  ('BTC Fixed-Term 90', 'Lock Bitcoin for 90 days to earn a fixed rate. Principal returned at maturity.', 'BTC', 'fixed_term', 90, 6.20, 0.001, 10, 'medium', 'active', now(), 2),
  ('ETH Staking', 'Stake your Ethereum to support network validation and earn rewards.', 'ETH', 'staking', 0, 4.80, 0.05, 1000, 'low', 'active', now(), 3),
  ('SOL Fixed-Term 30', 'Lock Solana for 30 days for a competitive fixed rate. Principal returned at maturity.', 'SOL', 'fixed_term', 30, 7.50, 1, 5000, 'medium', 'active', now(), 4)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SITE SETTINGS (single row)
-- ============================================================
INSERT INTO site_settings (id, site_name, contact_email, support_email, timezone, default_currency, primary_accent, trading_fee_pct, withdrawal_fee_pct, min_deposit, min_withdrawal, max_withdrawal_daily, require_2fa, session_duration_hours, admin_session_duration_hours, withdrawal_confirmation_required, maintenance_mode, maintenance_message, terms_url, privacy_url, risk_disclosure_url, twitter_url, telegram_url, discord_url)
VALUES (
  gen_random_uuid(),
  'Vaultex',
  'support@vaultex.com',
  'support@vaultex.com',
  'UTC',
  'USD',
  '#0F766E',
  0.10,
  0.00,
  10,
  10,
  50000,
  false,
  24,
  8,
  true,
  false,
  '',
  '/terms',
  '/privacy',
  '/risk-disclosure',
  'https://twitter.com/vaultex',
  'https://t.me/vaultex',
  'https://discord.gg/vaultex'
)
ON CONFLICT (id) DO NOTHING;
