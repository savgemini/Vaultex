export type AccountStatus = 'active' | 'pending_verification' | 'restricted' | 'suspended' | 'closed';
export type VerificationLevel = 'unverified' | 'basic' | 'verified' | 'rejected';
export type AdminRole = 'super_admin' | 'operations_admin' | 'finance_admin' | 'support_admin' | 'compliance_admin' | 'content_admin' | 'read_only';

export type AssetStatus = 'active' | 'inactive' | 'coming_soon';
export type AssetCategory = 'major' | 'stablecoin' | 'defi' | 'layer1' | 'layer2' | 'meme' | 'other';

export type TransactionType = 'deposit' | 'withdrawal' | 'buy' | 'sell' | 'trade' | 'transfer' | 'investment' | 'investment_payout' | 'fee' | 'reward' | 'referral_bonus';
export type TransactionStatus = 'pending' | 'under_review' | 'confirmed' | 'completed' | 'rejected' | 'expired' | 'cancelled' | 'processing' | 'approved' | 'partially_filled' | 'filled';

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';
export type OrderStatus = 'pending' | 'open' | 'partially_filled' | 'filled' | 'cancelled' | 'rejected' | 'expired';

export type ProductType = 'flexible' | 'fixed_term' | 'staking' | 'portfolio_plan';
export type ProductStatus = 'active' | 'paused' | 'coming_soon' | 'closed';
export type RiskLevel = 'low' | 'medium' | 'high';
export type InvestmentStatus = 'active' | 'completed' | 'cancelled' | 'pending';

export type MethodType = 'crypto' | 'bank_transfer' | 'card' | 'other';
export type MethodStatus = 'active' | 'inactive';

export type TicketStatus = 'open' | 'waiting_customer' | 'waiting_support' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketCategory = 'general' | 'account' | 'deposit' | 'withdrawal' | 'trading' | 'investment' | 'security' | 'other';

export type NotificationType = 'security' | 'deposit' | 'withdrawal' | 'transaction' | 'investment' | 'support' | 'account' | 'system';

export type RestrictionType = 'disable_deposits' | 'disable_withdrawals' | 'disable_trading' | 'disable_investments' | 'disable_transfers' | 'require_verification' | 'require_manual_review' | 'suspend_login' | 'full_suspension';

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  network: string;
  decimals: number;
  status: AssetStatus;
  deposit_enabled: boolean;
  withdrawal_enabled: boolean;
  trading_enabled: boolean;
  min_deposit: number;
  min_withdrawal: number;
  withdrawal_fee: number;
  current_price: number;
  price_change_24h: number;
  market_cap: number;
  volume_24h: number;
  high_24h: number;
  low_24h: number;
  category: AssetCategory;
  display_order: number;
}

export interface Balance {
  id: string;
  user_id: string;
  asset_id: string;
  available: number;
  invested: number;
  pending: number;
  avg_acquisition_price: number;
  asset?: Asset;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  asset_id: string | null;
  asset_symbol: string;
  amount: number;
  fee: number;
  status: TransactionStatus;
  reference: string;
  details: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  pair: string;
  side: OrderSide;
  order_type: OrderType;
  price: number;
  amount: number;
  filled_amount: number;
  total: number;
  fee: number;
  status: OrderStatus;
  asset_symbol: string;
  reference: string;
  created_at: string;
  updated_at: string;
}

export interface InvestmentProduct {
  id: string;
  name: string;
  description: string;
  asset_symbol: string;
  product_type: ProductType;
  term_days: number;
  apy: number;
  min_amount: number;
  max_amount: number;
  risk_level: RiskLevel;
  status: ProductStatus;
  start_date: string | null;
  end_date: string | null;
  display_order: number;
}

export interface Investment {
  id: string;
  user_id: string;
  product_id: string;
  asset_symbol: string;
  principal: number;
  accrued_earnings: number;
  apy: number;
  start_date: string;
  maturity_date: string | null;
  status: InvestmentStatus;
}

export interface DepositMethod {
  id: string;
  name: string;
  currency: string;
  asset_symbol: string;
  network: string;
  method_type: MethodType;
  instructions: string;
  min_deposit: number;
  max_deposit: number;
  fee: number;
  fee_type: 'fixed' | 'percentage';
  processing_time: string;
  status: MethodStatus;
  display_order: number;
}

export interface WithdrawalMethod {
  id: string;
  name: string;
  asset_symbol: string;
  network: string;
  method_type: MethodType;
  min_withdrawal: number;
  max_withdrawal: number;
  fee: number;
  fee_type: 'fixed' | 'percentage';
  processing_time: string;
  verification_required: boolean;
  instructions: string;
  status: MethodStatus;
  display_order: number;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  ticket_number: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_internal: boolean;
  attachments: unknown;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  reference: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  target_entity: string;
  reason: string;
  before_values: Record<string, unknown> | null;
  after_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AccountRestriction {
  id: string;
  user_id: string;
  restriction_type: RestrictionType;
  reason: string;
  created_by: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SiteSettings {
  id: string;
  site_name: string;
  contact_email: string;
  support_email: string;
  timezone: string;
  default_currency: string;
  primary_accent: string;
  trading_fee_pct: number;
  withdrawal_fee_pct: number;
  min_deposit: number;
  min_withdrawal: number;
  max_withdrawal_daily: number;
  require_2fa: boolean;
  session_duration_hours: number;
  admin_session_duration_hours: number;
  withdrawal_confirmation_required: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
  terms_url: string;
  privacy_url: string;
  risk_disclosure_url: string;
  twitter_url: string;
  telegram_url: string;
  discord_url: string;
}

export interface SecurityEvent {
  id: string;
  user_id: string;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  device_info: Record<string, unknown> | null;
  created_at: string;
}

export interface VerificationRecord {
  id: string;
  user_id: string;
  stage: 'basic_info' | 'identity' | 'address' | 'review' | 'approved' | 'rejected';
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  data: Record<string, unknown> | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  country: string;
  phone: string;
  referral_code: string | null;
  referred_by: string | null;
  account_status: AccountStatus;
  verification_level: VerificationLevel;
  is_admin: boolean;
  admin_role: AdminRole | null;
  two_factor_enabled: boolean;
  preferred_currency: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}
