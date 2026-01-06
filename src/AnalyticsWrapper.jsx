/**
 * Precision Prices - Analytics Wrapper Component
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import { useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useAnalytics } from './hooks/useAnalytics';

/**
 * Wrapper component that initializes analytics tracking
 * Wrap your app with this component to enable automatic session tracking
 */
export default function AnalyticsWrapper({ children }) {
  const { currentUser } = useAuth();
  // This hook automatically initializes sessions in its useEffect
  const analytics = useAnalytics();

  // Track login/logout events
  useEffect(() => {
    if (currentUser) {
      // User logged in or session resumed
      analytics.trackAuth('login', currentUser);
    }
  }, [currentUser, analytics]);

  return <>{children}</>;
}
