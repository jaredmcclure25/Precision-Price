/**
 * Precision Prices - Feedback System Export
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 *
 * Centralized exports for the feedback system
 */

// Enums
export {
  FeedbackPurpose,
  TransactionStage,
  FeedbackEffort,
  UserSegment
} from './feedbackEnums';

// Orchestrator functions
export {
  calculateWeight,
  inferUserSegment,
  validateFeedback,
  prepareFeedback
} from './feedbackOrchestrator';

// Session management
export {
  initializeSession,
  updateSessionActivity,
  linkSessionToUser,
  createTempListing,
  getCurrentSessionId
} from './sessionManager';

// Feedback service
export {
  submitFeedback,
  getFeedbackForListing,
  getRecentFeedback,
  calculateFeedbackStats,
  submitFeedbackViaServer
} from './feedbackService';

// Components
export { default as MicroFeedback } from '../components/MicroFeedback';
export { default as TransactionOutcome } from '../components/TransactionOutcome';
