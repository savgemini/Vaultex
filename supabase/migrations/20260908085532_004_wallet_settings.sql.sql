/*
# Add Wallet Connection Settings

## Overview
Adds columns to site_settings for editable wallet connection modal labels,
and creates a wallet_connections table for storing user wallet addresses.

## Changes to site_settings
- wallet_connect_label: editable label for the wallet address input field
- wallet_connect_placeholder: editable placeholder text for the wallet address input
- wallet_connect_title: editable title for the wallet connection modal
- wallet_connect_description: editable description text

## New Tables
- wallet_connections: stores user wallet addresses with wallet type

## Security
- RLS enabled on wallet_connections
- Users can only view and manage their own wallet connections
*/

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS wallet_connect_label text NOT NULL DEFAULT 'Your Wallet Address',
  ADD COLUMN IF NOT EXISTS wallet_connect_placeholder text NOT NULL DEFAULT '0x... or your wallet address',
  ADD COLUMN IF NOT EXISTS wallet_connect_title text NOT NULL DEFAULT 'Connect Your Wallet',
  ADD COLUMN IF NOT EXISTS wallet_connect_description text NOT NULL DEFAULT 'Select your preferred wallet and enter your wallet address to connect.';

CREATE TABLE IF NOT EXISTS wallet_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_type text NOT NULL,
  wallet_address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, wallet_type)
);

ALTER TABLE wallet_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_wallets" ON wallet_connections;
CREATE POLICY "select_own_wallets" ON wallet_connections FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_wallets" ON wallet_connections;
CREATE POLICY "insert_own_wallets" ON wallet_connections FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_wallets" ON wallet_connections;
CREATE POLICY "delete_own_wallets" ON wallet_connections FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
