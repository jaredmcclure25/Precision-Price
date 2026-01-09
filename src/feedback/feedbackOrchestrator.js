/**
 * Precision Prices - Feedback Orchestrator
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 *
 * Core weighting and ingestion logic for trust-weighted feedback
 */

import { FeedbackEffort, TransactionStage } from './feedbackEnums';

/**
 * Calculate weight for feedback based on effort and stage
 * @param {string} effort - FeedbackEffort value
 * @param {string} stage - TransactionStage value
 * @returns {number} - Calculated weight (0.3 to 1.5)
 */
export function calculateWeight(effort, stage) {
  let base = {
    [FeedbackEffort.MICRO]: 0.3,
    [FeedbackEffort.SHORT]: 0.7,
    [FeedbackEffort.LONG]: 1.0
  }[effort] || 0.3;

  // Boost weight for post-sale feedback (more valuable)
  if (stage === TransactionStage.SOLD) {
    base += 0.5;
  }

  // Cap at 1.5
  return Math.min(base, 1.5);
}

/**
 * Determine user segment based on behavior patterns
 * @param {object} userProfile - User profile with history
 * @returns {string} - UserSegment value
 */
export function inferUserSegment(userProfile) {
  if (!userProfile || !userProfile.analysisCount) {
    return 'casual_seller';
  }

  const { analysisCount, avgItemValue, categories } = userProfile;

  // High volume, diverse categories = reseller
  if (analysisCount > 20 && categories && categories.length > 5) {
    return 'reseller';
  }

  // High value items in short timeframe = mover
  if (avgItemValue > 200 && analysisCount > 5) {
    return 'mover';
  }

  // Low value, quick turnaround = quick_cash
  if (avgItemValue < 50 && analysisCount > 3) {
    return 'quick_cash';
  }

  return 'casual_seller';
}

/**
 * Validate feedback payload before submission
 * @param {object} feedback - Feedback object to validate
 * @returns {object} - { valid: boolean, error?: string }
 */
export function validateFeedback(feedback) {
  if (!feedback.listingId) {
    return { valid: false, error: 'Missing listingId' };
  }

  if (!feedback.purpose) {
    return { valid: false, error: 'Missing purpose' };
  }

  if (!feedback.effort) {
    return { valid: false, error: 'Missing effort level' };
  }

  if (feedback.value === undefined || feedback.value === null) {
    return { valid: false, error: 'Missing feedback value' };
  }

  return { valid: true };
}

/**
 * Prepare feedback for storage
 * @param {object} rawFeedback - Raw feedback from UI
 * @param {object} sessionData - Current session info
 * @param {object} userProfile - User profile (if available)
 * @returns {object} - Prepared feedback ready for Firestore/Postgres
 */
export function prepareFeedback(rawFeedback, sessionData, userProfile) {
  const stage = rawFeedback.stage || TransactionStage.PRE_LISTING;
  const weight = calculateWeight(rawFeedback.effort, stage);
  const segment = userProfile ? inferUserSegment(userProfile) : 'casual_seller';

  return {
    listingId: rawFeedback.listingId,
    sessionId: sessionData.sessionId,
    userId: sessionData.userId || null,
    purpose: rawFeedback.purpose,
    stage,
    effort: rawFeedback.effort,
    value: rawFeedback.value,
    weight,
    segment,
    variant: rawFeedback.variant || 'button',
    metadata: rawFeedback.metadata || {},
    createdAt: new Date()
  };
}
