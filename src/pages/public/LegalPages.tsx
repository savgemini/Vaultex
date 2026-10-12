import { Card } from '@/components/ui/Card';

function LegalLayout({ title, updated, sections }: { title: string; updated: string; sections: { heading: string; body: string[] }[] }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-surface-900 mb-1">{title}</h1>
      <p className="text-xs text-surface-400 mb-8">Last updated: {updated}</p>
      <Card>
        <div className="space-y-6">
          {sections.map((s, i) => (
            <div key={i}>
              <h2 className="text-base font-semibold text-surface-900 mb-2">{s.heading}</h2>
              {s.body.map((p, j) => (
                <p key={j} className="text-sm text-surface-600 leading-relaxed mb-2">{p}</p>
              ))}
            </div>
          ))}
        </div>
      </Card>
      <p className="mt-6 text-xs text-surface-400">
        This is a demonstration platform. These legal documents are templates and should not be relied upon for real legal guidance.
      </p>
    </div>
  );
}

export function TermsPage() {
  return <LegalLayout title="Terms of Service" updated="September 2026" sections={[
    { heading: '1. Acceptance of Terms', body: ['By accessing and using the Vaultex platform, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use the platform.'] },
    { heading: '2. Platform Description', body: ['Vaultex is a digital asset trading and investment platform. The platform is provided for demonstration purposes and does not process real financial transactions.'] },
    { heading: '3. User Responsibilities', body: ['You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must be at least 18 years old to use the platform.'] },
    { heading: '4. Risk Acknowledgment', body: ['Digital asset investments carry significant risk. You acknowledge that the value of cryptocurrencies can fluctuate and that you may lose some or all of your investment. Past performance does not guarantee future results.'] },
    { heading: '5. Prohibited Activities', body: ['You must not use the platform for illegal activities, money laundering, or any activity that violates applicable laws and regulations.'] },
    { heading: '6. Limitation of Liability', body: ['Vaultex shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.'] },
    { heading: '7. Modifications', body: ['We reserve the right to modify these terms at any time. Users will be notified of significant changes through the platform.'] },
  ]} />;
}

export function PrivacyPage() {
  return <LegalLayout title="Privacy Policy" updated="September 2026" sections={[
    { heading: '1. Information We Collect', body: ['We collect information you provide during registration including your name, email, country, and phone number. We also collect transaction data and account activity information.'] },
    { heading: '2. How We Use Your Information', body: ['Your information is used to provide and improve our services, verify your identity, communicate with you, and comply with legal obligations.'] },
    { heading: '3. Data Security', body: ['We implement industry-standard security measures including encryption, access controls, and audit logging to protect your information.'] },
    { heading: '4. Data Retention', body: ['We retain your personal information for as long as your account is active and for a reasonable period thereafter for legal and accounting purposes.'] },
    { heading: '5. Your Rights', body: ['You have the right to access, correct, or delete your personal information. Contact us at privacy@vaultex.com to exercise these rights.'] },
    { heading: '6. Cookies', body: ['We use cookies to maintain your session and improve platform functionality. You can manage cookie preferences in your browser settings.'] },
  ]} />;
}

export function RiskDisclosurePage() {
  return <LegalLayout title="Risk Disclosure" updated="September 2026" sections={[
    { heading: '1. Market Risk', body: ['Digital assets are subject to high market volatility. The value of your investments can decrease significantly and rapidly. You may lose some or all of your investment.'] },
    { heading: '2. Liquidity Risk', body: ['Some digital assets may have limited liquidity, making it difficult to buy or sell at desired prices, especially during periods of market stress.'] },
    { heading: '3. Regulatory Risk', body: ['The regulatory environment for digital assets is evolving. Changes in regulations may affect the availability and value of digital asset services.'] },
    { heading: '4. Technology Risk', body: ['Digital asset platforms rely on complex technology systems. Software bugs, network failures, or security breaches could result in loss of funds.'] },
    { heading: '5. No Guarantee of Returns', body: ['Vaultex does not guarantee any specific returns on investments. Investment products carry their own risks as described in their product terms.'] },
    { heading: '6. Professional Advice', body: ['You should consult with a qualified financial advisor before making investment decisions. The information provided on this platform is not financial advice.'] },
  ]} />;
}
