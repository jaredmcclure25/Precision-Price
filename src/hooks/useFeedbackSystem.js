/**
 * Precision Prices - Feedback System Hook
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 *
 * React hook for managing feedback throughout the app
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import {
  initializeSession,
  updateSessionActivity,
  createTempListing,
  submitFeedback,
  getCurrentSessionId
} from '../feedback';

export function useFeedbackSystem() {
  const { currentUser } = useAuth();
  const [sessionData, setSessionData] = useState(null);
  const [currentListingId, setCurrentListingId] = useState(null);

  // Initialize session on mount
  useEffect(() => {
    const setupSession = async () => {
      const session = await initializeSession(currentUser);
      setSessionData(session);
    };

    setupSession();
  }, [currentUser]);

  // Update session activity periodically
  useEffect(() => {
    if (!sessionData?.sessionId) return;

    const interval = setInterval(() => {
      updateSessionActivity(sessionData.sessionId);
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [sessionData]);

  /**
   * Create a listing record when analysis completes
   * @param {object} analysisResult - The pricing analysis result
   * @returns {Promise<string>} - Listing ID
   */
  const createListingRecord = async (analysisResult) => {
    if (!sessionData) return null;

    const listingData = {
      category: analysisResult.itemIdentification?.category || 'unknown',
      itemName: analysisResult.itemIdentification?.name || '',
      priceSuggested: analysisResult.suggestedPriceRange?.optimal || null,
      confidenceScore: analysisResult.confidenceScore || null
    };

    const listingId = await createTempListing(listingData, sessionData.sessionId);
    setCurrentListingId(listingId);
    return listingId;
  };

  /**
   * Submit feedback
   * @param {object} feedbackData - Feedback from component
   * @param {object} userProfile - User profile (optional)
   * @returns {Promise<object>} - Submission result
   */
  const handleFeedbackSubmit = async (feedbackData, userProfile = null) => {
    if (!sessionData) {
      console.warn('No session initialized for feedback');
      return { success: false, error: 'No session' };
    }

    const result = await submitFeedback(feedbackData, sessionData, userProfile);
    return result;
  };

  /**
   * Get current listing ID for feedback
   */
  const getListingId = () => currentListingId;

  return {
    sessionData,
    currentListingId,
    createListingRecord,
    handleFeedbackSubmit,
    getListingId
  };
}
