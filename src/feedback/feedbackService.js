/**
 * Precision Prices - Feedback Service
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 *
 * Firebase service for feedback storage and retrieval
 */

import { collection, addDoc, doc, setDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { prepareFeedback, validateFeedback } from './feedbackOrchestrator';
import { getCurrentSessionId } from './sessionManager';

/**
 * Submit feedback to Firebase
 * @param {object} feedbackData - Raw feedback from component
 * @param {object} sessionData - Current session info
 * @param {object} userProfile - User profile (optional)
 * @returns {Promise<object>} - Result with success status
 */
export async function submitFeedback(feedbackData, sessionData, userProfile = null) {
  // Validate feedback
  const validation = validateFeedback(feedbackData);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    };
  }

  // Prepare feedback for storage
  const preparedFeedback = prepareFeedback(feedbackData, sessionData, userProfile);

  try {
    // Store in Firebase feedback_events collection
    const feedbackRef = collection(db, 'feedback_events');
    const docRef = await addDoc(feedbackRef, {
      ...preparedFeedback,
      createdAt: new Date() // Firestore timestamp
    });

    console.log('✅ Feedback submitted:', docRef.id);

    // Also update temp listing stage if applicable
    if (feedbackData.stage) {
      try {
        const listingRef = doc(db, 'listings_temp', feedbackData.listingId);
        await setDoc(listingRef, {
          stage: feedbackData.stage,
          lastFeedbackAt: new Date()
        }, { merge: true });
      } catch (error) {
        console.warn('Could not update listing stage:', error);
      }
    }

    return {
      success: true,
      feedbackId: docRef.id,
      weight: preparedFeedback.weight
    };
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get feedback for a specific listing
 * @param {string} listingId
 * @returns {Promise<array>} - Array of feedback items
 */
export async function getFeedbackForListing(listingId) {
  try {
    const feedbackRef = collection(db, 'feedback_events');
    const q = query(
      feedbackRef,
      where('listingId', '==', listingId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const feedback = [];
    snapshot.forEach((doc) => {
      feedback.push({ id: doc.id, ...doc.data() });
    });

    return feedback;
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return [];
  }
}

/**
 * Get recent feedback for analytics
 * @param {number} days - Number of days to look back
 * @param {number} maxResults - Max number of results
 * @returns {Promise<array>} - Array of feedback items
 */
export async function getRecentFeedback(days = 30, maxResults = 100) {
  try {
    const feedbackRef = collection(db, 'feedback_events');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const q = query(
      feedbackRef,
      where('createdAt', '>=', cutoffDate),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );

    const snapshot = await getDocs(q);
    const feedback = [];
    snapshot.forEach((doc) => {
      feedback.push({ id: doc.id, ...doc.data() });
    });

    return feedback;
  } catch (error) {
    console.error('Error fetching recent feedback:', error);
    return [];
  }
}

/**
 * Calculate aggregate feedback stats
 * @param {array} feedbackList - Array of feedback items
 * @returns {object} - Aggregated statistics
 */
export function calculateFeedbackStats(feedbackList) {
  if (!feedbackList || feedbackList.length === 0) {
    return {
      totalCount: 0,
      avgWeight: 0,
      priceAccuracy: null,
      soldCount: 0,
      avgDaysToSell: null
    };
  }

  const totalCount = feedbackList.length;
  const totalWeight = feedbackList.reduce((sum, f) => sum + (f.weight || 0), 0);
  const avgWeight = totalWeight / totalCount;

  // Price accuracy (micro feedback)
  const accuracyFeedback = feedbackList.filter(f => f.purpose === 'price_accuracy');
  const accurateCount = accuracyFeedback.filter(f => f.value === true).length;
  const priceAccuracy = accuracyFeedback.length > 0
    ? (accurateCount / accuracyFeedback.length * 100).toFixed(1)
    : null;

  // Sold items
  const soldFeedback = feedbackList.filter(f => f.stage === 'sold');
  const soldCount = soldFeedback.length;

  // Average days to sell
  const daysData = soldFeedback
    .filter(f => f.value && f.value.daysToSell)
    .map(f => f.value.daysToSell);
  const avgDaysToSell = daysData.length > 0
    ? (daysData.reduce((sum, d) => sum + d, 0) / daysData.length).toFixed(1)
    : null;

  return {
    totalCount,
    avgWeight: avgWeight.toFixed(2),
    priceAccuracy,
    soldCount,
    avgDaysToSell
  };
}

/**
 * Submit feedback via server endpoint (for analytics logging)
 * @param {object} feedbackData
 * @returns {Promise<object>}
 */
export async function submitFeedbackViaServer(feedbackData) {
  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feedbackData)
    });

    if (!response.ok) {
      throw new Error('Server feedback submission failed');
    }

    return await response.json();
  } catch (error) {
    console.warn('Server feedback submission failed, using client-side only:', error);
    return { success: false, error: error.message };
  }
}
