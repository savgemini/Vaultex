/*
# Add SEO settings and deposit wallet addresses

## Changes to site_settings
- seo_title, seo_description, seo_keywords for frontend SEO
- seo_og_title, seo_og_description for social sharing
- deposit_btc_address, deposit_eth_address, deposit_usdt_address, deposit_usdc_address for deposit instructions

## Changes to deposit_methods
- deposit_address: the wallet address users should send deposits to
*/

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS seo_title text NOT NULL DEFAULT 'Vaultex — Digital Asset Trading & Investment Platform',
  ADD COLUMN IF NOT EXISTS seo_description text NOT NULL DEFAULT 'Trade and invest in digital assets with confidence. Professional platform for cryptocurrency trading, investing, and portfolio management.',
  ADD COLUMN IF NOT EXISTS seo_keywords text NOT NULL DEFAULT 'crypto, cryptocurrency, bitcoin, ethereum, trading, investment, digital assets',
  ADD COLUMN IF NOT EXISTS seo_og_title text NOT NULL DEFAULT 'Vaultex — Trade & Invest in Digital Assets',
  ADD COLUMN IF NOT EXISTS seo_og_description text NOT NULL DEFAULT 'A professional platform for cryptocurrency trading, investing, and portfolio management.',
  ADD COLUMN IF NOT EXISTS deposit_btc_address text NOT NULL DEFAULT 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  ADD COLUMN IF NOT EXISTS deposit_eth_address text NOT NULL DEFAULT '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  ADD COLUMN IF NOT EXISTS deposit_usdt_address text NOT NULL DEFAULT '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  ADD COLUMN IF NOT EXISTS deposit_usdc_address text NOT NULL DEFAULT '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';

ALTER TABLE deposit_methods
  ADD COLUMN IF NOT EXISTS deposit_address text NOT NULL DEFAULT '';
