/**
 * Precision Prices - Analytics React Hook
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../AuthContext';
import {
  initializeSession,
  endSession,
  logPageView,
  logActivity,
  logAnalysis,
  logBulkAnalysis,
  logImageUpload,
  logFeedback,
  logAuth
} from '../analytics';

/**
 * Custom hook for analytics tracking
 * Automatically handles session management and provides tracking functions
 */
export function useAnalytics() {
  const { currentUser, isGuestMode } = useAuth();
  const sessionInitialized = useRef(false);
  const currentPage = useRef(null);

  // Initialize session on mount
  useEffect(() => {
    if (!sessionInitialized.current) {
      console.log('🔄 Initializing analytics session for user:', currentUser?.email || 'guest');
      initializeSession(currentUser).then(() => {
        sessionInitialized.current = true;
        console.log('✅ Analytics session ready');
      }).catch((error) => {
        console.error('❌ Failed to initialize analytics session:', error);
      });
    }

    // End session on unmount
    return () => {
      if (sessionInitialized.current) {
        console.log('👋 Ending analytics session');
        endSession();
        sessionInitialized.current = false;
      }
    };
  }, [currentUser]);

  // Track page views automatically
  const trackPageView = useCallback((page, metadata = {}) => {
    if (currentPage.current !== page) {
      currentPage.current = page;
      logPageView(page, metadata);
    }
  }, []);

  // Track custom events
  const trackEvent = useCallback((eventType, metadata = {}) => {
    logActivity(eventType, metadata);
  }, []);

  // Track analysis
  const trackAnalysis = useCallback((analysisData) => {
    logAnalysis(analysisData);
  }, []);

  // Track bulk analysis
  const trackBulkAnalysis = useCallback((itemCount, results) => {
    logBulkAnalysis(itemCount, results);
  }, []);

  // Track image upload
  const trackImageUpload = useCallback((imageCount, imageTypes = []) => {
    logImageUpload(imageCount, imageTypes);
  }, []);

  // Track feedback
  const trackFeedback = useCallback((feedbackType, rating, comments = '') => {
    logFeedback(feedbackType, rating, comments);
  }, []);

  // Track auth events
  const trackAuth = useCallback((authType, user) => {
    logAuth(authType, user);
  }, []);

  return {
    trackPageView,
    trackEvent,
    trackAnalysis,
    trackBulkAnalysis,
    trackImageUpload,
    trackFeedback,
    trackAuth,
    isGuest: isGuestMode,
    userId: currentUser?.uid || null
  };
}

/**
 * Hook for tracking page views
 * Use this in components that represent distinct pages
 */
export function usePageTracking(pageName, metadata = {}) {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView(pageName, metadata);
  }, [pageName, trackPageView]);
}
