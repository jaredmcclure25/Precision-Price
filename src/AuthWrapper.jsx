/**
 * Precision Prices - Auth Wrapper
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import React from 'react';
import { useAuth } from './AuthContext';
import AuthPage from './AuthPage';
import IndustrySelector from './components/IndustrySelector';
import { Loader2 } from 'lucide-react';

export default function AuthWrapper({ children }) {
  const { currentUser, userProfile, loading } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show auth page (no more guest mode)
  if (!currentUser) {
    return <AuthPage />;
  }

  // If user is logged in but hasn't selected an industry, show industry selector
  // (This happens for social login users who need to complete onboarding)
  if (userProfile && !userProfile.industry) {
    return <IndustrySelector />;
  }

  // User is authenticated and has completed onboarding, show the app
  return <>{children}</>;
}
