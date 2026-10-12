/*
# Seed Demo Users with Balances and Transactions

## Overview
Creates 5 test users with auth accounts, profiles, balances, and transaction history
to make the platform feel live and functional.

## New Data
- 5 auth users with profiles (varying verification levels and statuses)
- Balances for each user across multiple assets (USDT, BTC, ETH, SOL)
- Transactions including deposits, withdrawals, trades, and rewards
- Orders for trade history
*/

-- Create auth users
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'a1111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'john@mail.com', crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"John Carter"}'::jsonb, '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a2222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'sarah@mail.com', crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Lin"}'::jsonb, '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a3333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'mike@mail.com', crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mike Thompson"}'::jsonb, '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a4444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'emma@mail.com', crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Emma Wilson"}'::jsonb, '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a5555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'li@mail.com', crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Li Zhang"}'::jsonb, '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Create profiles
INSERT INTO profiles (id, email, full_name, country, phone, account_status, verification_level, preferred_currency, timezone, referral_code) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'john@mail.com', 'John Carter', 'United States', '+1 555 0101', 'active', 'verified', 'USD', 'America/New_York', 'JCAR-7X2K'),
  ('a2222222-2222-2222-2222-222222222222', 'sarah@mail.com', 'Sarah Lin', 'Singapore', '+65 8123 4567', 'active', 'verified', 'USD', 'Asia/Singapore', 'SLIN-3F8A'),
  ('a3333333-3333-3333-3333-333333333333', 'mike@mail.com', 'Mike Thompson', 'United Kingdom', '+44 7700 900123', 'active', 'basic', 'USD', 'Europe/London', 'MTHO-9P4D'),
  ('a4444444-4444-4444-4444-444444444444', 'emma@mail.com', 'Emma Wilson', 'Germany', '+49 151 23456789', 'pending_verification', 'unverified', 'EUR', 'Europe/Berlin', 'EWIL-2B7C'),
  ('a5555555-5555-5555-5555-555555555555', 'li@mail.com', 'Li Zhang', 'Japan', '+81 90 1234 5678', 'active', 'verified', 'USD', 'Asia/Tokyo', 'LZHA-5R1E')
ON CONFLICT (id) DO NOTHING;

-- Balances: John - USDT, BTC, ETH
INSERT INTO balances (user_id, asset_id, available, invested, pending) VALUES
  ('a1111111-1111-1111-1111-111111111111', '44f42789-b508-4f0a-90b5-49767b1971bb', 25000, 0, 0),
  ('a1111111-1111-1111-1111-111111111111', 'b0ec4dee-9806-4d0b-8ba2-18b0a9505e61', 0.45, 0, 0),
  ('a1111111-1111-1111-1111-111111111111', '8e2c9113-f8ee-42b6-a3a7-f2e92c2cea11', 3.2, 0, 0)
ON CONFLICT (user_id, asset_id) DO NOTHING;

-- Sarah - USDT, SOL, ADA
INSERT INTO balances (user_id, asset_id, available, invested, pending) VALUES
  ('a2222222-2222-2222-2222-222222222222', '44f42789-b508-4f0a-90b5-49767b1971bb', 15000, 0, 0),
  ('a2222222-2222-2222-2222-222222222222', 'c9ee80af-7294-4be4-b240-dcc9b4233d5f', 120, 0, 0),
  ('a2222222-2222-2222-2222-222222222222', '996b4995-05de-42af-9622-507a6ccc55ff', 5000, 0, 0)
ON CONFLICT (user_id, asset_id) DO NOTHING;

-- Mike - USDT, BTC
INSERT INTO balances (user_id, asset_id, available, invested, pending) VALUES
  ('a3333333-3333-3333-3333-333333333333', '44f42789-b508-4f0a-90b5-49767b1971bb', 5000, 0, 500),
  ('a3333333-3333-3333-3333-333333333333', 'b0ec4dee-9806-4d0b-8ba2-18b0a9505e61', 0.08, 0, 0)
ON CONFLICT (user_id, asset_id) DO NOTHING;

-- Emma - USDT only (new user)
INSERT INTO balances (user_id, asset_id, available, invested, pending) VALUES
  ('a4444444-4444-4444-4444-444444444444', '44f42789-b508-4f0a-90b5-49767b1971bb', 500, 0, 0)
ON CONFLICT (user_id, asset_id) DO NOTHING;

-- Li - USDT, ETH, XRP
INSERT INTO balances (user_id, asset_id, available, invested, pending) VALUES
  ('a5555555-5555-5555-5555-555555555555', '44f42789-b508-4f0a-90b5-49767b1971bb', 42000, 0, 0),
  ('a5555555-5555-5555-5555-555555555555', '8e2c9113-f8ee-42b6-a3a7-f2e92c2cea11', 8.5, 0, 0),
  ('a5555555-5555-5555-5555-555555555555', 'b33f3451-e5f6-4e2f-a0a4-c5dceabea5cb', 15000, 0, 0)
ON CONFLICT (user_id, asset_id) DO NOTHING;

-- Transactions for John
INSERT INTO transactions (user_id, type, asset_id, asset_symbol, amount, fee, status, reference, created_at) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'deposit', '44f42789-b508-4f0a-90b5-49767b1971bb', 'USDT', 25000, 0, 'completed', 'DEP-JC-001', now() - interval '30 days'),
  ('a1111111-1111-1111-1111-111111111111', 'buy', 'b0ec4dee-9806-4d0b-8ba2-18b0a9505e61', 'BTC', 0.45, 295.50, 'completed', 'ORD-JC-001', now() - interval '25 days'),
  ('a1111111-1111-1111-1111-111111111111', 'buy', '8e2c9113-f8ee-42b6-a3a7-f2e92c2cea11', 'ETH', 3.2, 35.20, 'completed', 'ORD-JC-002', now() - interval '20 days'),
  ('a1111111-1111-1111-1111-111111111111', 'reward', '44f42789-b508-4f0a-90b5-49767b1971bb', 'USDT', 125.00, 0, 'completed', 'RWJ-JC-001', now() - interval '10 days'),
  ('a1111111-1111-1111-1111-111111111111', 'withdrawal', '44f42789-b508-4f0a-90b5-49767b1971bb', 'USDT', 1000, 0, 'completed', 'WDR-JC-001', now() - interval '5 days')
ON CONFLICT DO NOTHING;

-- Transactions for Sarah
INSERT INTO transactions (user_id, type, asset_id, asset_symbol, amount, fee, status, reference, created_at) VALUES
  ('a2222222-2222-2222-2222-222222222222', 'deposit', '44f42789-b508-4f0a-90b5-49767b1971bb', 'USDT', 20000, 0, 'completed', 'DEP-SL-001', now() - interval '28 days'),
  ('a2222222-2222-2222-2222-222222222222', 'buy', 'c9ee80af-7294-4be4-b240-dcc9b4233d5f', 'SOL', 120, 180.00, 'completed', 'ORD-SL-001', now() - interval '22 days'),
  ('a2222222-2222-2222-2222-222222222222', 'buy', '996b4995-05de-42af-9622-507a6ccc55ff', 'ADA', 5000, 12.50, 'completed', 'ORD-SL-002', now() - interval '15 days'),
  ('a2222222-2222-2222-2222-222222222222', 'investment', '44f42789-b508-4f0a-90b5-49767b1971bb', 'USDT', 5000, 0, 'completed', 'INV-SL-001', now() - interval '12 days'),
  ('a2222222-2222-2222-2222-222222222222', 'investment_payout', '44f42789-b508-4f0a-90b5-49767b1971bb', 'USDT', 5125.00, 0, 'completed', 'INV-SL-001-P', now() - interval '2 days')
ON CONFLICT DO NOTHING;

-- Transactions for Mike
INSERT INTO transactions (user_id, type, asset_id, asset_symbol, amount, fee, status, reference, created_at) VALUES
  ('a3333333-3333-3333-3333-333333333333', 'deposit', '44f42789-b508-4f0a-90b5-49767b1971bb', 'USDT', 5500, 0, 'completed', 'DEP-MT-001', now() - interval '15 days'),
  ('a3333333-3333-3333-3333-333333333333', 'buy', 'b0ec4dee-9806-4d0b-8ba2-18b0a9505e61', 'BTC', 0.08, 52.80, 'completed', 'ORD-MT-001', now() - interval '10 days'),
  ('a3333333-3333-3333-3333-333333333333', 'withdrawal', '44f42789-b508-4f0a-90b5-49767b1971bb', 'USDT', 500, 0, 'pending', 'WDR-MT-001', now() - interval '1 day')
ON CONFLICT DO NOTHING;

-- Transactions for Emma
INSERT INTO transactions (user_id, type, asset_id, asset_symbol, amount, fee, status, reference, created_at) VALUES
  ('a4444444-4444-4444-4444-444444444444', 'deposit', '44f42789-b508-4f0a-90b5-49767b1971bb', 'USDT', 500, 0, 'completed', 'DEP-EW-001', now() - interval '3 days')
ON CONFLICT DO NOTHING;

-- Transactions for Li
INSERT INTO transactions (user_id, type, asset_id, asset_symbol, amount, fee, status, reference, created_at) VALUES
  ('a5555555-5555-5555-5555-555555555555', 'deposit', '44f42789-b508-4f0a-90b5-49767b1971bb', 'USDT', 50000, 0, 'completed', 'DEP-LZ-001', now() - interval '45 days'),
  ('a5555555-5555-5555-5555-555555555555', 'buy', '8e2c9113-f8ee-42b6-a3a7-f2e92c2cea11', 'ETH', 8.5, 93.50, 'completed', 'ORD-LZ-001', now() - interval '35 days'),
  ('a5555555-5555-5555-5555-555555555555', 'buy', 'b33f3451-e5f6-4e2f-a0a4-c5dceabea5cb', 'XRP', 15000, 5.20, 'completed', 'ORD-LZ-002', now() - interval '20 days'),
  ('a5555555-5555-5555-5555-555555555555', 'transfer', '44f42789-b508-4f0a-90b5-49767b1971bb', 'USDT', 2000, 0, 'completed', 'TRF-LZ-001', now() - interval '8 days'),
  ('a5555555-5555-5555-5555-555555555555', 'referral_bonus', '44f42789-b508-4f0a-90b5-49767b1971bb', 'USDT', 50, 0, 'completed', 'REF-LZ-001', now() - interval '5 days')
ON CONFLICT DO NOTHING;

-- Orders for John
INSERT INTO orders (user_id, pair, side, order_type, price, amount, filled_amount, total, fee, status, asset_symbol, reference, created_at) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'BTC/USDT', 'buy', 'market', 65000, 0.45, 0.45, 29250, 29.25, 'filled', 'BTC', 'ORD-JC-001', now() - interval '25 days'),
  ('a1111111-1111-1111-1111-111111111111', 'ETH/USDT', 'buy', 'limit', 3200, 3.2, 3.2, 10240, 10.24, 'filled', 'ETH', 'ORD-JC-002', now() - interval '20 days')
ON CONFLICT DO NOTHING;

-- Orders for Sarah
INSERT INTO orders (user_id, pair, side, order_type, price, amount, filled_amount, total, fee, status, asset_symbol, reference, created_at) VALUES
  ('a2222222-2222-2222-2222-222222222222', 'SOL/USDT', 'buy', 'market', 145, 120, 120, 17400, 17.40, 'filled', 'SOL', 'ORD-SL-001', now() - interval '22 days'),
  ('a2222222-2222-2222-2222-222222222222', 'ADA/USDT', 'buy', 'limit', 0.45, 5000, 5000, 2250, 2.25, 'filled', 'ADA', 'ORD-SL-002', now() - interval '15 days')
ON CONFLICT DO NOTHING;

-- Orders for Li
INSERT INTO orders (user_id, pair, side, order_type, price, amount, filled_amount, total, fee, status, asset_symbol, reference, created_at) VALUES
  ('a5555555-5555-5555-5555-555555555555', 'ETH/USDT', 'buy', 'limit', 3100, 8.5, 8.5, 26350, 26.35, 'filled', 'ETH', 'ORD-LZ-001', now() - interval '35 days'),
  ('a5555555-5555-5555-5555-555555555555', 'XRP/USDT', 'buy', 'market', 0.52, 15000, 15000, 7800, 7.80, 'filled', 'XRP', 'ORD-LZ-002', now() - interval '20 days')
ON CONFLICT DO NOTHING;
