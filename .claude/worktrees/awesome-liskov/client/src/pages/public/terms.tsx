import { PublicLayout } from "@/components/public-layout";

export default function TermsOfServicePage() {
  const lastUpdated = "January 15, 2025";

  return (
    <PublicLayout>
      <div className="py-16 bg-gray-50" data-testid="terms-hero">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4" data-testid="terms-heading">
            Terms of Service
          </h1>
          <p className="text-muted-foreground" data-testid="terms-updated">
            Last updated: {lastUpdated}
          </p>
        </div>
      </div>

      <div className="py-16" data-testid="terms-content">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <section className="mb-12" data-testid="section-intro">
              <p className="text-lg text-muted-foreground leading-relaxed">
                These Terms of Service ("Terms") govern your access to and use of DriverPath, a patient education and clinical engagement platform operated by Health Drivers Institute ("HDI," "we," "us," or "our"). By accessing or using DriverPath, you agree to be bound by these Terms.
              </p>
            </section>

            <section className="mb-12" data-testid="section-eligibility">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Eligibility</h2>
              <p className="text-muted-foreground mb-4">
                DriverPath is intended for use by licensed healthcare professionals and their authorized staff. By using our platform, you represent that you:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Are at least 18 years of age</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Have the legal authority to enter into these Terms</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Will use DriverPath only for lawful purposes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Will comply with all applicable laws and regulations, including HIPAA</span>
                </li>
              </ul>
            </section>

            <section className="mb-12" data-testid="section-accounts">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Account Registration</h2>
              <p className="text-muted-foreground mb-4">
                To use DriverPath, you must create an account. You agree to:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Provide accurate, current, and complete information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Maintain and update your information as needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Keep your login credentials confidential</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Notify us immediately of any unauthorized access to your account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Accept responsibility for all activities under your account</span>
                </li>
              </ul>
            </section>

            <section className="mb-12" data-testid="section-subscription">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Subscription and Billing</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Subscription Plans</h3>
              <p className="text-muted-foreground mb-4">
                DriverPath offers subscription-based access with various tiers (Basic, Pro, Enterprise). Features and pricing are described on our website and may change with notice.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Billing</h3>
              <p className="text-muted-foreground mb-4">
                By subscribing, you authorize us to charge your payment method on a recurring basis. You are responsible for all applicable taxes. Failed payments may result in service suspension.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Cancellation</h3>
              <p className="text-muted-foreground">
                You may cancel your subscription at any time. Cancellation takes effect at the end of your current billing period. We do not provide refunds for partial billing periods unless required by law.
              </p>
            </section>

            <section className="mb-12" data-testid="section-use">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h2>
              <p className="text-muted-foreground mb-4">You agree not to:</p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Use DriverPath for any illegal purpose</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Share or resell your account access</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Attempt to gain unauthorized access to our systems</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Interfere with the platform's operation or security</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Upload malicious code or content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Scrape or extract data from the platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Violate any applicable laws, including HIPAA regulations</span>
                </li>
              </ul>
            </section>

            <section className="mb-12" data-testid="section-content">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Content and Intellectual Property</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Our Content</h3>
              <p className="text-muted-foreground mb-4">
                All educational content, software, and materials provided through DriverPath are owned by HDI or our licensors. You receive a limited, non-exclusive license to use this content for patient education purposes only.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Your Content</h3>
              <p className="text-muted-foreground">
                You retain ownership of any content you upload to DriverPath. By uploading content, you grant us a license to store, process, and display it as necessary to provide our services.
              </p>
            </section>

            <section className="mb-12" data-testid="section-hipaa">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. HIPAA and Healthcare Compliance</h2>
              <p className="text-muted-foreground mb-4">
                If you are a covered entity under HIPAA, you agree to:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Execute a Business Associate Agreement (BAA) with HDI</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Use DriverPath in compliance with HIPAA requirements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Obtain necessary patient consents before using the platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Report any suspected breaches or security incidents</span>
                </li>
              </ul>
            </section>

            <section className="mb-12" data-testid="section-disclaimer">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Disclaimers</h2>
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl mb-4">
                <p className="text-amber-900 font-medium mb-2">Important Notice</p>
                <p className="text-amber-800 text-sm">
                  DriverPath provides educational content and tools to support clinical practice. It does not provide medical advice, diagnosis, or treatment. Clinicians are solely responsible for patient care decisions.
                </p>
              </div>
              <p className="text-muted-foreground">
                DriverPath is provided "as is" without warranties of any kind, express or implied. We do not guarantee that the platform will be error-free, uninterrupted, or meet your specific requirements.
              </p>
            </section>

            <section className="mb-12" data-testid="section-liability">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, HDI and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of DriverPath. Our total liability shall not exceed the amount you paid to us in the twelve months preceding the claim.
              </p>
            </section>

            <section className="mb-12" data-testid="section-indemnification">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to indemnify and hold harmless HDI, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of DriverPath, your violation of these Terms, or your violation of any third-party rights.
              </p>
            </section>

            <section className="mb-12" data-testid="section-termination">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
              <p className="text-muted-foreground">
                We may suspend or terminate your access to DriverPath at any time for violation of these Terms or for any other reason with notice. Upon termination, your right to use the platform ceases immediately. Provisions that by their nature should survive termination will remain in effect.
              </p>
            </section>

            <section className="mb-12" data-testid="section-changes">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may modify these Terms at any time. We will notify you of material changes by email or through the platform. Your continued use of DriverPath after changes become effective constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section className="mb-12" data-testid="section-governing">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to conflict of law principles. Any disputes shall be resolved in the state or federal courts located in Delaware.
              </p>
            </section>

            <section data-testid="section-contact">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
              <p className="text-muted-foreground mb-4">
                For questions about these Terms, contact us at:
              </p>
              <div className="bg-gray-50 p-6 rounded-xl">
                <p className="text-gray-900 font-semibold">Health Drivers Institute</p>
                <p className="text-muted-foreground">Legal Department</p>
                <p className="text-muted-foreground">Email: legal@driverpath.com</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
