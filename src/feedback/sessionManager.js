/**
 * Precision Prices - Session Manager
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 *
 * Hybrid session tracking: anonymous + authenticated users
 */

import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
  // Check for existing session in localStorage
  let sessionId = localStorage.getItem('pp_session_id');
  let sessionData = null;

  if (sessionId) {
    // Try to retrieve existing session from Firestore
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);

      if (sessionSnap.exists()) {
        sessionData = sessionSnap.data();
      }
    } catch (error) {
      console.log('Could not retrieve session, creating new one');
    }
  }

  // Create new session if none exists
  if (!sessionData) {
    sessionId = generateSessionId();
    sessionData = {
      sessionId,
      userId: currentUser?.uid || null,
      userEmail: currentUser?.email || null,
      deviceType: getDeviceType(),
      region: zipCode || null,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      isAnonymous: !currentUser
    };

    // Store in Firestore
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await setDoc(sessionRef, sessionData);
    } catch (error) {
      console.warn('Failed to store session in Firestore:', error);
      // Continue anyway - we can still track locally
    }

    // Store session ID in localStorage
    localStorage.setItem('pp_session_id', sessionId);
  } else if (currentUser && sessionData.isAnonymous) {
    // Upgrade anonymous session to authenticated
    sessionData.userId = currentUser.uid;
    sessionData.userEmail = currentUser.email;
    sessionData.isAnonymous = false;
    sessionData.upgradedAt = new Date();

    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await setDoc(sessionRef, sessionData, { merge: true });
    } catch (error) {
      console.warn('Failed to upgrade session:', error);
    }
  }

  return sessionData;
}

/**
 * Update session last active timestamp
 * @param {string} sessionId
 */
export async function updateSessionActivity(sessionId) {
  if (!sessionId) return;

  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    await setDoc(sessionRef, {
      lastActiveAt: new Date()
    }, { merge: true });
  } catch (error) {
    // Fail silently - not critical
  }
}

/**
 * Link session to user after authentication
 * @param {string} sessionId
 * @param {object} user - Firebase Auth user
 */
export async function linkSessionToUser(sessionId, user) {
  if (!sessionId || !user) return;

  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    await setDoc(sessionRef, {
      userId: user.uid,
      userEmail: user.email,
      isAnonymous: false,
      linkedAt: new Date()
    }, { merge: true });
  } catch (error) {
    console.warn('Failed to link session to user:', error);
  }
}

/**
 * Create a temporary listing record
 * @param {object} listingData - Listing information
 * @param {string} sessionId - Current session ID
 * @returns {Promise<string>} - Generated listing ID
 */
export async function createTempListing(listingData, sessionId) {
  const listingId = `listing_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const tempListing = {
    listingId,
    sessionId,
    category: listingData.category || 'unknown',
    itemName: listingData.itemName || '',
    priceSuggested: listingData.priceSuggested || null,
    confidenceScore: listingData.confidenceScore || null,
    stage: 'pre_listing',
    createdAt: new Date()
  };

  try {
    const listingRef = doc(db, 'listings_temp', listingId);
    await setDoc(listingRef, tempListing);
  } catch (error) {
    console.warn('Failed to create temp listing:', error);
    // Continue anyway - listing ID is still valid
  }

  return listingId;
}

/**
 * Get current session from localStorage
 * @returns {string|null} - Session ID
 */
export function getCurrentSessionId() {
  return localStorage.getItem('pp_session_id');
}
