import { PublicLayout } from "@/components/public-layout";

export default function PrivacyPolicyPage() {
  const lastUpdated = "January 15, 2025";

  return (
    <PublicLayout>
      <div className="py-16 bg-gray-50" data-testid="privacy-hero">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4" data-testid="privacy-heading">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground" data-testid="privacy-updated">
            Last updated: {lastUpdated}
          </p>
        </div>
      </div>

      <div className="py-16" data-testid="privacy-content">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <section className="mb-12" data-testid="section-intro">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Health Drivers Institute ("HDI," "we," "us," or "our") is committed to protecting the privacy and security of your personal information. This Privacy Policy describes how we collect, use, disclose, and safeguard information when you use DriverPath, our patient education and clinical engagement platform.
              </p>
            </section>

            <section className="mb-12" data-testid="section-hipaa">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">HIPAA Compliance</h2>
              <p className="text-muted-foreground mb-4">
                DriverPath is designed to support HIPAA-compliant workflows for healthcare providers. As a Business Associate under HIPAA, we:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Implement administrative, physical, and technical safeguards to protect Protected Health Information (PHI)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Execute Business Associate Agreements (BAAs) with covered entities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Maintain audit logs of PHI access and system activities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Encrypt data in transit and at rest</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Provide breach notification in accordance with HIPAA requirements</span>
                </li>
              </ul>
            </section>

            <section className="mb-12" data-testid="section-collection">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Clinician Account Information</h3>
              <p className="text-muted-foreground mb-4">
                When you create a DriverPath account, we collect:
              </p>
              <ul className="space-y-2 text-muted-foreground mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Name, email address, and professional credentials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Practice or organization information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Billing and payment information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Professional license information (if applicable)</span>
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Patient Information</h3>
              <p className="text-muted-foreground mb-4">
                When clinicians use DriverPath to engage with patients, we may process:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Patient name and contact information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Assessment responses and scores</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Content engagement and viewing history</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Communication logs between clinicians and patients</span>
                </li>
              </ul>
            </section>

            <section className="mb-12" data-testid="section-use">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">We use collected information to:</p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Provide and maintain the DriverPath platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Process subscriptions and payments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Send transactional emails and platform notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Improve our services and develop new features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Comply with legal obligations and respond to legal requests</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Protect against fraud and security threats</span>
                </li>
              </ul>
            </section>

            <section className="mb-12" data-testid="section-sharing">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Information Sharing</h2>
              <p className="text-muted-foreground mb-4">
                We do not sell your personal information. We may share information with:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Service providers:</strong> Third parties that help us operate DriverPath (hosting, payment processing, email delivery)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Legal compliance:</strong> When required by law or to protect our rights</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</span>
                </li>
              </ul>
            </section>

            <section className="mb-12" data-testid="section-security">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
              <p className="text-muted-foreground mb-4">
                We implement industry-standard security measures including:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>TLS/SSL encryption for data in transit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>AES-256 encryption for data at rest</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Role-based access controls</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Regular security audits and vulnerability assessments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Secure password hashing using scrypt</span>
                </li>
              </ul>
            </section>

            <section className="mb-12" data-testid="section-retention">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your information for as long as your account is active or as needed to provide services. Clinicians may request deletion of their accounts and associated data, subject to legal and regulatory retention requirements. Patient data retention is governed by our agreements with healthcare providers and applicable regulations.
              </p>
            </section>

            <section className="mb-12" data-testid="section-rights">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-muted-foreground mb-4">
                Depending on your location, you may have rights to:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Access your personal information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Correct inaccurate information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Request deletion of your information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Export your data in a portable format</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Opt out of marketing communications</span>
                </li>
              </ul>
            </section>

            <section className="mb-12" data-testid="section-contact">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                For privacy-related inquiries or to exercise your rights, contact us at:
              </p>
              <div className="bg-gray-50 p-6 rounded-xl">
                <p className="text-gray-900 font-semibold">Health Drivers Institute</p>
                <p className="text-muted-foreground">Privacy Officer</p>
                <p className="text-muted-foreground">Email: privacy@driverpath.com</p>
              </div>
            </section>

            <section data-testid="section-changes">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy periodically. We will notify you of material changes by posting the updated policy on our website and updating the "Last updated" date. Your continued use of DriverPath after changes become effective constitutes acceptance of the revised policy.
              </p>
            </section>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
