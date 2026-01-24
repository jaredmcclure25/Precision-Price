/**
 * Email Notification Functions for PrecisionPrices
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Get days since a date
 */
const getDaysSince = (date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

/**
 * Mark notification as sent
 */
const markNotificationSent = async (userId, listingId, notification) => {
  await db
    .collection('users')
    .doc(userId)
    .collection('listings')
    .doc(listingId)
    .update({
      notificationsSent: admin.firestore.FieldValue.arrayUnion(notification),
      lastNotified: admin.firestore.FieldValue.serverTimestamp(),
    });
};

/**
 * Get market data for a listing
 */
const getMarketDataForListing = async (listing) => {
  try {
    const marketDoc = await db
      .collection('marketData')
      .doc(`${listing.zipCode}_${listing.category}`)
      .get();

    if (!marketDoc.exists) return null;

    return marketDoc.data();
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
};

/**
 * Send reminder emails (runs daily at 9 AM CT)
 * Note: For production, integrate with SendGrid or another email service
 */
exports.sendListingReminders = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('America/Chicago')
  .onRun(async (context) => {
    console.log('Starting listing reminder job...');

    try {
      const usersSnapshot = await db.collection('users').get();

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();

        // Skip if email notifications disabled
        if (!userData.emailNotifications) continue;

        const listingsSnapshot = await db
          .collection('users')
          .doc(userId)
          .collection('listings')
          .where('status', '==', 'active')
          .get();

        for (const listingDoc of listingsSnapshot.docs) {
          const listing = {
            id: listingDoc.id,
            userId,
            ...listingDoc.data(),
          };

          const daysSincePosted = getDaysSince(listing.datePosted.toDate());
          const notificationsSent = listing.notificationsSent || [];

          // Day 7 reminder
          if (daysSincePosted >= 7 && !notificationsSent.includes('day7')) {
            console.log(`Day 7 reminder needed for listing ${listing.id}`);
            await markNotificationSent(userId, listing.id, 'day7');
            // In production, send email via SendGrid
          }

          // Day 14 reminder
          if (daysSincePosted >= 14 && !notificationsSent.includes('day14')) {
            console.log(`Day 14 reminder needed for listing ${listing.id}`);
            await markNotificationSent(userId, listing.id, 'day14');
            // In production, send email via SendGrid
          }

          // Day 30 reminder
          if (daysSincePosted >= 30 && !notificationsSent.includes('day30')) {
            console.log(`Day 30 reminder needed for listing ${listing.id}`);
            await markNotificationSent(userId, listing.id, 'day30');
            // In production, send email via SendGrid
          }
        }
      }

      console.log('Successfully completed listing reminder job');
      return null;
    } catch (error) {
      console.error('Error in reminder job:', error);
      return null;
    }
  });
