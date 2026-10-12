import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { useSEO } from '@/hooks/useSEO';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';

// Public pages
import HomePage from '@/pages/public/HomePage';
import MarketsPage from '@/pages/public/MarketsPage';
import PricingPage from '@/pages/public/PricingPage';
import AboutPage from '@/pages/public/AboutPage';
import SecurityPage from '@/pages/public/SecurityPage';
import HelpPage from '@/pages/public/HelpPage';
import ContactPage from '@/pages/public/ContactPage';
import { TermsPage, PrivacyPage, RiskDisclosurePage } from '@/pages/public/LegalPages';

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';

// User app pages
import DashboardPage from '@/pages/app/DashboardPage';
import PortfolioPage from '@/pages/app/PortfolioPage';
import AppMarketsPage from '@/pages/app/MarketsPage';
import TradePage from '@/pages/app/TradePage';
import InvestPage from '@/pages/app/InvestPage';
import AssetsPage from '@/pages/app/AssetsPage';
import DepositPage from '@/pages/app/DepositPage';
import WithdrawPage from '@/pages/app/WithdrawPage';
import TransferPage from '@/pages/app/TransferPage';
import TransactionsPage from '@/pages/app/TransactionsPage';
import RewardsPage from '@/pages/app/RewardsPage';
import SupportPage from '@/pages/app/SupportPage';
import SettingsPage from '@/pages/app/SettingsPage';
import VerificationPage from '@/pages/app/VerificationPage';
import NotificationsPage from '@/pages/app/NotificationsPage';
import AssetDetailPage from '@/pages/app/AssetDetailPage';

// Admin pages
import AdminDashboardPage from '@/pages/admin/DashboardPage';
import AdminUsersPage from '@/pages/admin/UsersPage';
import AdminUserDetailPage from '@/pages/admin/UserDetailPage';
import AdminVerificationPage from '@/pages/admin/VerificationPage';
import AdminDepositsPage from '@/pages/admin/DepositsPage';
import AdminWithdrawalsPage from '@/pages/admin/WithdrawalsPage';
import AdminTransactionsPage from '@/pages/admin/TransactionsPage';
import AdminAssetsPage from '@/pages/admin/AssetsPage';
import AdminMarketsPage from '@/pages/admin/MarketsPage';
import AdminTradingPage from '@/pages/admin/TradingPage';
import AdminInvestmentsPage from '@/pages/admin/InvestmentsPage';
import AdminDepositMethodsPage from '@/pages/admin/DepositMethodsPage';
import AdminWithdrawalMethodsPage from '@/pages/admin/WithdrawalMethodsPage';
import AdminSupportPage from '@/pages/admin/SupportPage';
import AdminNotificationsPage from '@/pages/admin/NotificationsPage';
import AdminReferralsPage from '@/pages/admin/ReferralsPage';
import AdminReportsPage from '@/pages/admin/ReportsPage';
import AdminSettingsPage from '@/pages/admin/SettingsPage';
import AdminSecurityPage from '@/pages/admin/SecurityPage';
import AdminAdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminAuditLogsPage from '@/pages/admin/AuditLogsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" /></div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" /></div>;
  if (!session) return <Navigate to="/login" replace />;
  if (!profile?.is_admin) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export default function App() {
  useSEO();
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/markets" element={<MarketsPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/risk-disclosure" element={<RiskDisclosurePage />} />
            </Route>

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* User App */}
            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="portfolio" element={<PortfolioPage />} />
              <Route path="markets" element={<AppMarketsPage />} />
              <Route path="trade" element={<TradePage />} />
              <Route path="invest" element={<InvestPage />} />
              <Route path="assets" element={<AssetsPage />} />
              <Route path="assets/:symbol" element={<AssetDetailPage />} />
              <Route path="deposit" element={<DepositPage />} />
              <Route path="withdraw" element={<WithdrawPage />} />
              <Route path="transfer" element={<TransferPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="rewards" element={<RewardsPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="verification" element={<VerificationPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>

            {/* Admin */}
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="users/:id" element={<AdminUserDetailPage />} />
              <Route path="verification" element={<AdminVerificationPage />} />
              <Route path="deposits" element={<AdminDepositsPage />} />
              <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
              <Route path="transactions" element={<AdminTransactionsPage />} />
              <Route path="assets" element={<AdminAssetsPage />} />
              <Route path="markets" element={<AdminMarketsPage />} />
              <Route path="trading" element={<AdminTradingPage />} />
              <Route path="investments" element={<AdminInvestmentsPage />} />
              <Route path="deposit-methods" element={<AdminDepositMethodsPage />} />
              <Route path="withdrawal-methods" element={<AdminWithdrawalMethodsPage />} />
              <Route path="support" element={<AdminSupportPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="referrals" element={<AdminReferralsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="security" element={<AdminSecurityPage />} />
              <Route path="admin-users" element={<AdminAdminUsersPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
