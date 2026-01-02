/**
 * Precision Prices - Auth Wrapper
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import React from 'react';
import { useAuth } from './AuthContext';
import AuthPage from './AuthPage';

export default function AuthWrapper({ children }) {
  const { currentUser, isGuestMode, enableGuestMode } = useAuth();

  // Show auth page if user is not logged in and not in guest mode
  if (!currentUser && !isGuestMode) {
    return <AuthPage onGuestMode={enableGuestMode} />;
  }

  // Show the app if user is logged in or in guest mode
  return <>{children}</>;
}
