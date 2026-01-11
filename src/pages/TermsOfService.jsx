/**
 * Precision Prices - Terms of Service
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService({ onBack }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to App
        </button>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: January 9, 2026</p>

        <div className="prose prose-emerald max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using Precision Prices ("Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed">
              Precision Prices provides AI-powered pricing insights and recommendations for marketplace sellers.
              Our Service analyzes market data, item conditions, and local demand to generate pricing estimates.
              All outputs are estimates only and are provided "as-is" without guarantees.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. No Professional or Financial Advice</h2>
            <p className="text-gray-700 leading-relaxed">
              All pricing estimates are <strong>informational only</strong> and do not constitute professional
              financial, legal, or business advice. We make no guarantees regarding accuracy, completeness,
              or suitability for any specific purpose. You are solely responsible for your pricing decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. User Accounts and Guest Access</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>Guest Users:</strong> Guests may perform up to 3 free pricing analyses without creating an account.
              After 3 analyses, you must create an account to continue using the Service.
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>Registered Users:</strong> You are responsible for maintaining the confidentiality of your
              login credentials and all activities under your account. Notify us immediately of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Prohibited Uses</h2>
            <p className="text-gray-700 leading-relaxed mb-3">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Reverse engineer, decompile, or attempt to extract source code from the Service</li>
              <li>Scrape, copy, or commercially exploit the Service or its outputs</li>
              <li>Misrepresent pricing outputs as guarantees or professional advice</li>
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Upload prohibited content (see Section 6)</li>
              <li>Attempt to circumvent usage limits or access restrictions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Prohibited Content</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You may not upload images or information related to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Illegal drugs, controlled substances, or prescription medications for resale</li>
              <li>Weapons, explosives, or dangerous materials</li>
              <li>Stolen goods, counterfeit items, or forged documents</li>
              <li>Adult content, explicit materials, or illegal services</li>
              <li>Human body parts, organs, or biological materials</li>
              <li>Protected wildlife, endangered species, or illegal animal products</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              We reserve the right to immediately terminate accounts that violate these prohibitions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              All content, algorithms, software, and branding are owned by Precision Prices and protected by
              copyright, trademark, and other intellectual property laws. You may not copy, modify, or distribute
              any part of the Service without express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong> Precision Prices is not liable for any
              direct, indirect, incidental, consequential, or punitive damages resulting from your use of the Service,
              including but not limited to lost profits, pricing errors, or business losses. Your sole remedy is to
              discontinue use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Subscription and Payment Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              Paid subscription plans (when available) will be billed monthly or annually as selected.
              Subscriptions auto-renew unless cancelled. Refunds are provided at our discretion.
              We reserve the right to modify pricing and features with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may suspend or terminate your access at any time for violation of these terms, fraudulent activity,
              or abusive behavior. You may terminate your account at any time by contacting us at
              <a href="mailto:contact@precisionprices.com" className="text-emerald-600 hover:text-emerald-700 font-semibold"> contact@precisionprices.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these Terms of Service from time to time. Continued use of the Service after changes
              constitutes acceptance of the new terms. Material changes will be announced via email or in-app notification.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. Governing Law and Disputes</h2>
            <p className="text-gray-700 leading-relaxed">
              These terms are governed by the laws of the United States. Any disputes shall be resolved through
              binding arbitration in accordance with the rules of the American Arbitration Association.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">13. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              For questions about these Terms of Service, contact us at:
            </p>
            <div className="bg-emerald-50 p-4 rounded-lg mt-3">
              <p className="text-gray-700 font-semibold">Precision Prices</p>
              <p className="text-gray-700">Email: <a href="mailto:contact@precisionprices.com" className="text-emerald-600 hover:text-emerald-700">contact@precisionprices.com</a></p>
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
