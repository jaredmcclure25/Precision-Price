/**
 * Precision Prices - Session Manager
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 *
 * Hybrid session tracking: anonymous + authenticated users
 */

import { addDocument, getDocument, updateDocument } from '../firestoreREST';

/**
 * Generate a unique session ID
 * Uses timestamp + random string for uniqueness
 */
function generateSessionId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `sess_${timestamp}_${random}`;
}

/**
 * Get device type
 */
function getDeviceType() {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Initialize or retrieve session
 * @param {object|null} currentUser - Firebase Auth user (if authenticated)
 * @param {string|null} zipCode - User's location (optional)
 * @returns {Promise<object>} - Session data
 */
export async function initializeSession(currentUser = null, zipCode = null) {
  // TEMPORARILY DISABLED - Firestore REST API requires auth
  // Just create a local session for now
  let sessionId = localStorage.getItem('pp_session_id');

  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('pp_session_id', sessionId);
  }

  const sessionData = {
    sessionId,
    userId: currentUser?.uid || null,
    userEmail: currentUser?.email || null,
    deviceType: getDeviceType(),
    region: zipCode || null,
    createdAt: new Date(),
    lastActiveAt: new Date(),
    isAnonymous: !currentUser
  };

  return sessionData;
}

/**
 * Update session last active timestamp
 * @param {string} sessionId
 */
export async function updateSessionActivity(sessionId) {
  // DISABLED - not critical for app functionality
  return;
}

/**
 * Link session to user after authentication
 * @param {string} sessionId
 * @param {object} user - Firebase Auth user
 */
export async function linkSessionToUser(sessionId, user) {
  // DISABLED - not critical for app functionality
  return;
}

/**
 * Create a temporary listing record
 * @param {object} listingData - Listing information
 * @param {string} sessionId - Current session ID
 * @returns {Promise<string>} - Generated listing ID
 */
export async function createTempListing(listingData, sessionId) {
  const listingId = `listing_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  // Just return the ID - don't store in Firestore for now
  return listingId;
}

/**
 * Get current session from localStorage
 * @returns {string|null} - Session ID
 */
export function getCurrentSessionId() {
  return localStorage.getItem('pp_session_id');
}
