/**
 * Precision Prices - Privacy Policy
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy({ onBack }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-12">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to App
        </button>

        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-10 h-10 text-emerald-600" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Privacy Policy</h1>
        </div>
        <p className="text-sm text-gray-500 mb-8">Last Updated: January 9, 2026</p>

        <div className="prose prose-emerald max-w-none space-y-6">
          <p className="text-lg text-gray-700 leading-relaxed">
            At Precision Prices, we take your privacy seriously. This Privacy Policy explains how we collect,
            use, protect, and share your information when you use our Service.
          </p>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Account Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Email address</strong> - Used for account creation and communication</li>
              <li><strong>Password</strong> - Stored as encrypted hash (never in plaintext) via Firebase Authentication</li>
              <li><strong>Display name</strong> - Optional, used for personalization</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Usage Data</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Pricing analyses</strong> - Item descriptions, conditions, locations, and uploaded images</li>
              <li><strong>Analytics</strong> - Session data, page views, feature usage, and interaction patterns</li>
              <li><strong>Feedback</strong> - Price accuracy ratings, transaction outcomes, and user comments</li>
              <li><strong>Device information</strong> - Browser type, operating system, IP address, and device identifiers</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Uploaded Images</h3>
            <p className="text-gray-700 leading-relaxed">
              Images you upload are processed by our AI to generate pricing estimates. Images are temporarily
              stored for analysis and may be retained for model training purposes. We do not sell or share your
              images with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Provide the Service</strong> - Generate pricing estimates, authenticate users, and maintain accounts</li>
              <li><strong>Improve accuracy</strong> - Train and refine our AI pricing models using anonymized data</li>
              <li><strong>Analytics</strong> - Understand usage patterns to improve features and user experience</li>
              <li><strong>Communication</strong> - Send important updates, security alerts, and feature announcements</li>
              <li><strong>Security</strong> - Detect and prevent fraud, abuse, and unauthorized access</li>
              <li><strong>Legal compliance</strong> - Respond to legal requests and enforce our Terms of Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>We do not sell or rent your personal data.</strong> We may share information only in these limited circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Service Providers</strong> - Firebase (authentication/database), Anthropic (AI processing), and Vercel (hosting)</li>
              <li><strong>Legal Requirements</strong> - When required by law, court order, or government request</li>
              <li><strong>Business Transfers</strong> - In the event of a merger, acquisition, or sale of assets</li>
              <li><strong>Consent</strong> - When you explicitly authorize us to share specific information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Encryption</strong> - All data transmitted over HTTPS with TLS encryption</li>
              <li><strong>Password Security</strong> - Passwords hashed using bcrypt with Firebase Authentication</li>
              <li><strong>Access Controls</strong> - Strict database rules limiting data access to authorized users</li>
              <li><strong>Regular Audits</strong> - Ongoing security reviews and vulnerability assessments</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              However, no system is 100% secure. While we strive to protect your data, we cannot guarantee
              absolute security against all threats.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              <strong>Account Data:</strong> Retained while your account is active and for up to 90 days after deletion.<br/>
              <strong>Analytics Data:</strong> Aggregated analytics retained indefinitely for product improvement.<br/>
              <strong>Images:</strong> Uploaded images retained for up to 30 days unless deleted earlier.<br/>
              <strong>Feedback:</strong> User feedback retained indefinitely to improve pricing accuracy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Your Privacy Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Access</strong> - Request a copy of the personal data we hold about you</li>
              <li><strong>Correction</strong> - Update or correct inaccurate information</li>
              <li><strong>Deletion</strong> - Request deletion of your account and associated data</li>
              <li><strong>Export</strong> - Receive your data in a portable format (data portability)</li>
              <li><strong>Opt-Out</strong> - Unsubscribe from marketing emails (transactional emails still sent)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              To exercise these rights, contact us at <a href="mailto:support@precisionprices.com" className="text-emerald-600 hover:text-emerald-700 font-semibold">support@precisionprices.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Authentication</strong> - Keep you logged in to your account</li>
              <li><strong>Preferences</strong> - Remember your settings and preferences</li>
              <li><strong>Analytics</strong> - Track usage patterns to improve the Service</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              You can disable cookies in your browser settings, but this may limit functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use third-party services that may collect information about you:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Firebase</strong> (Google) - Authentication, database, and analytics</li>
              <li><strong>Anthropic</strong> - AI-powered image and text processing</li>
              <li><strong>Vercel</strong> - Web hosting and serverless functions</li>
              <li><strong>Stripe</strong> - Payment processing (when subscriptions are active)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              These services have their own privacy policies governing how they handle your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Precision Prices is not intended for users under 18 years of age. We do not knowingly collect
              personal information from children. If you believe we have collected data from a minor, please
              contact us immediately for deletion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. International Users</h2>
            <p className="text-gray-700 leading-relaxed">
              Our Service is hosted in the United States. If you access the Service from outside the U.S., your
              data will be transferred to and processed in the United States. By using the Service, you consent
              to this transfer and processing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. Material changes will be announced via email
              or in-app notification. Continued use after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              For questions, concerns, or requests regarding your privacy, contact us at:
            </p>
            <div className="bg-emerald-50 p-4 rounded-lg">
              <p className="text-gray-700 font-semibold">Precision Prices</p>
              <p className="text-gray-700">Email: <a href="mailto:support@precisionprices.com" className="text-emerald-600 hover:text-emerald-700">support@precisionprices.com</a></p>
              <p className="text-gray-700">Website: <a href="https://precisionprices.com" className="text-emerald-600 hover:text-emerald-700">precisionprices.com</a></p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            © 2025 Precision Prices. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
