/**
 * Precision Prices - Analytics & Activity Logging
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 *
 * TEMPORARILY DISABLED - Firestore SDK removed to fix CORS
 * All functions are stubbed out to prevent errors
 */

// Stub all analytics functions to do nothing
export async function initializeSession(user = null) {
  console.log('📊 Analytics disabled');
  return null;
}

export async function endSession() {
  return null;
}

export async function logPageView(page, metadata = {}) {
  return null;
}

export async function logActivity(activityType, metadata = {}) {
  return null;
}

export async function logAnalysis(analysisData) {
  return null;
}

export async function logBulkAnalysis(itemCount, results) {
  return null;
}

export async function logImageUpload(imageCount, imageTypes = []) {
  return null;
}

export async function logFeedback(feedbackType, rating, comments = '') {
  return null;
}

export async function logAuth(authType, user) {
  return null;
}

export async function getAnalyticsDashboard(dateRange = 7) {
  return {
    totalSessions: 0,
    totalPageViews: 0,
    totalActivities: 0,
    uniqueUsers: 0,
    guestSessions: 0,
    registeredSessions: 0,
    topPages: [],
    topActivities: [],
    deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0 },
    osBreakdown: {},
    browserBreakdown: {}
  };
}

export async function getUserAnalytics(userId) {
  return {
    totalSessions: 0,
    totalActivities: 0,
    totalPageViews: 0,
    totalAnalyses: 0,
    averageSessionDuration: 0,
    deviceUsage: {},
    mostVisitedPages: [],
    recentActivities: []
  };
}
