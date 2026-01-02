/**
 * Precision Prices - Auth Wrapper
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import React, { useEffect } from 'react';
import { useAuth } from './AuthContext';

export default function AuthWrapper({ children }) {
  const { currentUser, isGuestMode, enableGuestMode } = useAuth();

  // Automatically enable guest mode on first load if not logged in
  useEffect(() => {
    if (!currentUser && !isGuestMode) {
      enableGuestMode();
    }
  }, [currentUser, isGuestMode, enableGuestMode]);

  // Show the app (either logged in or guest mode)
  return <>{children}</>;
}
