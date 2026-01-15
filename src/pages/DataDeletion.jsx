/**
 * Precision Prices - Data Deletion Instructions
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 *
 * This page is required by Facebook for apps using Facebook Login
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Mail, Shield } from 'lucide-react';

export default function DataDeletion() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-12">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to App
        </button>

        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="w-10 h-10 text-emerald-600" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Data Deletion</h1>
        </div>
        <p className="text-sm text-gray-500 mb-8">How to delete your data from Precision Prices</p>

        <div className="prose prose-emerald max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Delete Your Account and Data</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              We respect your right to control your personal data. You can request complete deletion
              of your account and all associated data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How to Request Data Deletion</h2>

            <div className="bg-emerald-50 p-6 rounded-xl mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Mail className="w-6 h-6 text-emerald-600" />
                Option 1: Email Request (Recommended)
              </h3>
              <p className="text-gray-700 mb-4">
                Send an email to <a href="mailto:support@precisionprices.com" className="text-emerald-600 hover:text-emerald-700 font-semibold">support@precisionprices.com</a> with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Subject line: <strong>"Data Deletion Request"</strong></li>
                <li>The email address associated with your account</li>
                <li>Your name (optional, but helps us verify your identity)</li>
              </ul>
              <p className="text-gray-700 mt-4">
                We will process your request within <strong>30 days</strong> and send confirmation when complete.
              </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                Option 2: Facebook Data Deletion
              </h3>
              <p className="text-gray-700 mb-4">
                If you signed up using Facebook Login, you can also request deletion through Facebook:
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>Go to your Facebook Settings</li>
                <li>Navigate to <strong>Settings & Privacy → Settings → Apps and Websites</strong></li>
                <li>Find "Precision Prices" and click <strong>Remove</strong></li>
                <li>Check the box to delete all data shared with Precision Prices</li>
              </ol>
              <p className="text-gray-700 mt-4">
                This will notify us to delete your data. We will complete the deletion within 30 days.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">What Data Will Be Deleted</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              When you request data deletion, we will remove:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Account information</strong> - Email, display name, and profile data</li>
              <li><strong>Pricing history</strong> - All items you've analyzed and their results</li>
              <li><strong>Uploaded images</strong> - Any photos you've uploaded for analysis</li>
              <li><strong>Feedback and ratings</strong> - Your price accuracy feedback</li>
              <li><strong>Usage data</strong> - Session logs and analytics tied to your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Retention After Deletion</h2>
            <p className="text-gray-700 leading-relaxed">
              After deletion, some data may be retained in the following cases:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-3">
              <li><strong>Aggregated analytics</strong> - Anonymous, non-identifiable usage statistics</li>
              <li><strong>Legal requirements</strong> - Data required for legal compliance (up to 90 days)</li>
              <li><strong>Backups</strong> - Data in encrypted backups (automatically purged within 90 days)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Questions?</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              If you have any questions about data deletion or your privacy rights, contact us:
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
