/**
 * Precision Prices - Analytics & Activity Logging
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  increment
} from 'firebase/firestore';

/**
 * Analytics Database Schema:
 *
 * Collections:
 * 1. sessions - User session tracking
 *    - sessionId (string)
 *    - userId (string, null for guests)
 *    - userEmail (string, null for guests)
 *    - isGuest (boolean)
 *    - startTime (timestamp)
 *    - endTime (timestamp)
 *    - duration (number, milliseconds)
 *    - pageViews (array of objects)
 *    - deviceInfo (object)
 *    - ipAddress (string, optional)
 *
 * 2. activities - User activity events
 *    - sessionId (string)
 *    - userId (string, null for guests)
 *    - activityType (string: 'analysis', 'image_upload', 'feedback', 'navigation', 'bulk_analysis', 'export', 'login', 'logout', 'signup')
 *    - timestamp (timestamp)
 *    - metadata (object, activity-specific data)
 *    - page (string)
 *
 * 3. analytics_daily - Daily aggregated stats
 *    - date (string, YYYY-MM-DD)
 *    - totalUsers (number)
 *    - totalGuests (number)
 *    - totalSessions (number)
 *    - totalActivities (number)
 *    - totalAnalyses (number)
 *    - totalImages (number)
 *    - avgSessionDuration (number)
 *    - topPages (array)
 *    - topItems (array)
 *
 * 4. user_stats - Per-user statistics
 *    - userId (string)
 *    - userEmail (string)
 *    - totalSessions (number)
 *    - totalAnalyses (number)
 *    - totalImages (number)
 *    - firstSeen (timestamp)
 *    - lastSeen (timestamp)
 *    - deviceTypes (array)
 */

// Current session tracking
let currentSession = null;
let sessionStartTime = null;
let pageViews = [];
let activityBuffer = []; // Buffer for batch writes

/**
 * Initialize a new user session
 */
export async function initializeSession(user = null) {
  try {
    const sessionId = generateSessionId();
    sessionStartTime = Date.now();
    pageViews = [];

    const deviceInfo = await getDeviceInfo();

    const sessionData = {
      sessionId,
      userId: user?.uid || null,
      userEmail: user?.email || null,
      isGuest: !user,
      startTime: serverTimestamp(),
      endTime: null,
      duration: 0,
      pageViews: [],
      deviceInfo,
      lastActivity: serverTimestamp()
    };

    const sessionRef = await addDoc(collection(db, 'sessions'), sessionData);

    currentSession = {
      ...sessionData,
      id: sessionRef.id
    };

    // Log session start activity
    await logActivity('session_start', {
      sessionId,
      deviceInfo
    });

    // Set up periodic session updates
    startSessionHeartbeat();

    return currentSession;
  } catch (error) {
    console.error('Error initializing session:', error);
    return null;
  }
}

/**
 * End the current session
 */
export async function endSession() {
  if (!currentSession) return;

  try {
    const duration = Date.now() - sessionStartTime;

    const sessionRef = doc(db, 'sessions', currentSession.id);
    await updateDoc(sessionRef, {
      endTime: serverTimestamp(),
      duration,
      pageViews
    });

    await logActivity('session_end', {
      duration,
      pageViewCount: pageViews.length
    });

    // Flush any pending activities
    await flushActivityBuffer();

    currentSession = null;
    sessionStartTime = null;
    pageViews = [];

  } catch (error) {
    console.error('Error ending session:', error);
  }
}

/**
 * Log a page view
 */
export async function logPageView(page, metadata = {}) {
  if (!currentSession) return;

  const pageView = {
    page,
    timestamp: new Date().toISOString(),
    ...metadata
  };

  pageViews.push(pageView);

  // Update session's last activity
  try {
    const sessionRef = doc(db, 'sessions', currentSession.id);
    await updateDoc(sessionRef, {
      lastActivity: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging page view:', error);
  }

  await logActivity('page_view', { page, ...metadata });
}

/**
 * Log a user activity
 */
export async function logActivity(activityType, metadata = {}) {
  if (!currentSession) return;

  try {
    const activity = {
      sessionId: currentSession.sessionId,
      userId: currentSession.userId,
      userEmail: currentSession.userEmail,
      isGuest: currentSession.isGuest,
      activityType,
      timestamp: serverTimestamp(),
      metadata,
      page: window.location.pathname
    };

    // Add to buffer for batch processing
    activityBuffer.push(activity);

    // Flush buffer if it gets too large
    if (activityBuffer.length >= 10) {
      await flushActivityBuffer();
    }

    // For important events, write immediately
    if (['analysis', 'signup', 'purchase'].includes(activityType)) {
      await flushActivityBuffer();
    }

  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

/**
 * Flush activity buffer to database
 */
async function flushActivityBuffer() {
  if (activityBuffer.length === 0) return;

  try {
    const activitiesToWrite = [...activityBuffer];
    activityBuffer = [];

    // Write all activities
    const promises = activitiesToWrite.map(activity =>
      addDoc(collection(db, 'activities'), activity)
    );

    await Promise.all(promises);
  } catch (error) {
    console.error('Error flushing activity buffer:', error);
    // Restore activities to buffer on failure
    activityBuffer = [...activityBuffer, ...activitiesToWrite];
  }
}

/**
 * Log an analysis event
 */
export async function logAnalysis(analysisData) {
  await logActivity('analysis', {
    itemName: analysisData.itemName,
    condition: analysisData.condition,
    location: analysisData.location,
    imageCount: analysisData.imageCount || 0,
    mode: analysisData.mode || 'single',
    priceRange: analysisData.priceRange,
    success: analysisData.success || true
  });

  // Update user stats
  if (currentSession?.userId) {
    await updateUserStats(currentSession.userId, {
      totalAnalyses: increment(1),
      lastAnalysis: serverTimestamp()
    });
  }
}

/**
 * Log bulk analysis event
 */
export async function logBulkAnalysis(itemCount, results) {
  await logActivity('bulk_analysis', {
    itemCount,
    successCount: results.filter(r => r.success).length,
    failureCount: results.filter(r => !r.success).length,
    avgProcessingTime: results.reduce((sum, r) => sum + (r.duration || 0), 0) / itemCount
  });
}

/**
 * Log image upload
 */
export async function logImageUpload(imageCount, imageTypes = []) {
  await logActivity('image_upload', {
    imageCount,
    imageTypes
  });

  if (currentSession?.userId) {
    await updateUserStats(currentSession.userId, {
      totalImages: increment(imageCount)
    });
  }
}

/**
 * Log user feedback
 */
export async function logFeedback(feedbackType, rating, comments = '') {
  await logActivity('feedback', {
    feedbackType,
    rating,
    comments,
    hasComments: !!comments
  });
}

/**
 * Log authentication events
 */
export async function logAuth(authType, user) {
  await logActivity(authType, {
    userEmail: user?.email,
    provider: user?.providerData?.[0]?.providerId || 'email'
  });

  if (authType === 'signup' || authType === 'login') {
    // Initialize or update user stats
    const userId = user.uid;
    const userStatsRef = doc(db, 'user_stats', userId);

    try {
      await updateDoc(userStatsRef, {
        lastSeen: serverTimestamp(),
        totalSessions: increment(1)
      });
    } catch (error) {
      // If document doesn't exist, create it
      await addDoc(collection(db, 'user_stats'), {
        userId,
        userEmail: user.email,
        totalSessions: 1,
        totalAnalyses: 0,
        totalImages: 0,
        firstSeen: serverTimestamp(),
        lastSeen: serverTimestamp(),
        deviceTypes: [getDeviceInfo().type]
      });
    }
  }
}

/**
 * Update user statistics
 */
async function updateUserStats(userId, updates) {
  try {
    const userStatsQuery = query(
      collection(db, 'user_stats'),
      where('userId', '==', userId),
      limit(1)
    );

    const snapshot = await getDocs(userStatsQuery);

    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, {
        ...updates,
        lastSeen: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

/**
 * Get analytics dashboard data
 */
export async function getAnalyticsDashboard(dateRange = 7) {
  try {
    const now = new Date();
    const startDate = new Date(now.getTime() - dateRange * 24 * 60 * 60 * 1000);

    // Get recent sessions
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('startTime', '>=', startDate),
      orderBy('startTime', 'desc')
    );

    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get recent activities
    const activitiesQuery = query(
      collection(db, 'activities'),
      where('timestamp', '>=', startDate),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const activitiesSnapshot = await getDocs(activitiesQuery);
    const activities = activitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate metrics
    const totalUsers = new Set(sessions.map(s => s.userId).filter(Boolean)).size;
    const totalGuests = sessions.filter(s => s.isGuest).length;
    const totalSessions = sessions.length;

    const analyses = activities.filter(a => a.activityType === 'analysis');
    const totalAnalyses = analyses.length;

    const imageUploads = activities.filter(a => a.activityType === 'image_upload');
    const totalImages = imageUploads.reduce((sum, a) => sum + (a.metadata?.imageCount || 0), 0);

    const avgSessionDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length;

    // Activity by type
    const activityCounts = activities.reduce((acc, a) => {
      acc[a.activityType] = (acc[a.activityType] || 0) + 1;
      return acc;
    }, {});

    // Most analyzed items
    const itemAnalyses = analyses.reduce((acc, a) => {
      const item = a.metadata?.itemName;
      if (item) {
        acc[item] = (acc[item] || 0) + 1;
      }
      return acc;
    }, {});

    const topItems = Object.entries(itemAnalyses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return {
      totalUsers,
      totalGuests,
      totalSessions,
      totalAnalyses,
      totalImages,
      avgSessionDuration: Math.round(avgSessionDuration / 1000), // Convert to seconds
      activityCounts,
      topItems,
      recentActivities: activities.slice(0, 20),
      dateRange
    };

  } catch (error) {
    console.error('Error getting analytics dashboard:', error);
    return null;
  }
}

/**
 * Get user-specific analytics
 */
export async function getUserAnalytics(userId) {
  try {
    const userStatsQuery = query(
      collection(db, 'user_stats'),
      where('userId', '==', userId),
      limit(1)
    );

    const snapshot = await getDocs(userStatsQuery);

    if (snapshot.empty) {
      return null;
    }

    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    console.error('Error getting user analytics:', error);
    return null;
  }
}

/**
 * Helper: Generate unique session ID
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Helper: Get device information with location
 */
async function getDeviceInfo() {
  const ua = navigator.userAgent;

  let deviceType = 'desktop';
  if (/mobile/i.test(ua)) deviceType = 'mobile';
  else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet';

  let os = 'unknown';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/ios|iphone|ipad/i.test(ua)) os = 'iOS';

  let browser = 'unknown';
  if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/edge/i.test(ua)) browser = 'Edge';

  // Get approximate location from IP (using free ipapi.co service)
  let location = null;
  try {
    // Mobile-compatible fetch with AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      location = {
        city: data.city || 'Unknown',
        region: data.region || 'Unknown',
        country: data.country_name || 'Unknown',
        countryCode: data.country_code || 'XX',
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        latitude: data.latitude || null,
        longitude: data.longitude || null
      };
    }
  } catch (error) {
    // Silently fail - location is nice-to-have, not required
    console.log('Location fetch skipped (offline or slow network)');
  }

  return {
    type: deviceType,
    os,
    browser,
    userAgent: ua,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language,
    location // Added location data
  };
}

/**
 * Session heartbeat - updates session every 30 seconds
 */
let heartbeatInterval = null;

function startSessionHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  heartbeatInterval = setInterval(async () => {
    if (currentSession) {
      try {
        const sessionRef = doc(db, 'sessions', currentSession.id);
        await updateDoc(sessionRef, {
          lastActivity: serverTimestamp(),
          duration: Date.now() - sessionStartTime
        });
      } catch (error) {
        console.error('Error updating session heartbeat:', error);
      }
    }
  }, 30000); // Every 30 seconds
}

/**
 * Clean up on page unload
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', async () => {
    await flushActivityBuffer();
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
  });
}
