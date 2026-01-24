/**
 * Market Data Aggregation Functions for PrecisionPrices
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Aggregate market data nightly (runs at 2 AM CT)
 * Recalculates averages and updates market data collection
 */
exports.aggregateMarketData = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('America/Chicago')
  .onRun(async (context) => {
    console.log('Starting market data aggregation...');

    try {
      // Get all market data documents
      const marketSnapshot = await db.collection('marketData').get();

      for (const marketDoc of marketSnapshot.docs) {
        const marketId = marketDoc.id;
        const marketData = marketDoc.data();

        // Get recent sales for this market
        const recentSalesSnapshot = await db
          .collection('marketData')
          .doc(marketId)
          .collection('recentSales')
          .orderBy('soldAt', 'desc')
          .limit(100)
          .get();

        if (recentSalesSnapshot.empty) {
          continue;
        }

        // Calculate aggregates
        let totalPrice = 0;
        let totalDays = 0;
        let minPrice = Infinity;
        let maxPrice = 0;
        let count = 0;

        recentSalesSnapshot.forEach((saleDoc) => {
          const sale = saleDoc.data();
          totalPrice += sale.price || 0;
          totalDays += sale.daysToSell || 0;
          minPrice = Math.min(minPrice, sale.price || Infinity);
          maxPrice = Math.max(maxPrice, sale.price || 0);
          count++;
        });

        if (count > 0) {
          // Update market data
          await db
            .collection('marketData')
            .doc(marketId)
            .update({
              avgSoldPrice: totalPrice / count,
              avgDaysToSell: totalDays / count,
              soldListings: count,
              priceMin: minPrice === Infinity ? null : minPrice,
              priceMax: maxPrice === 0 ? null : maxPrice,
              lastAggregated: admin.firestore.FieldValue.serverTimestamp(),
            });

          console.log(`Updated market data for ${marketId}: ${count} sales`);
        }

        // Clean up old sales data (older than 90 days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const oldSalesSnapshot = await db
          .collection('marketData')
          .doc(marketId)
          .collection('recentSales')
          .where('soldAt', '<', admin.firestore.Timestamp.fromDate(ninetyDaysAgo))
          .get();

        const batch = db.batch();
        oldSalesSnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        if (!oldSalesSnapshot.empty) {
          await batch.commit();
          console.log(`Cleaned up ${oldSalesSnapshot.size} old sales for ${marketId}`);
        }
      }

      console.log('Successfully completed market data aggregation');
      return null;
    } catch (error) {
      console.error('Error in aggregation job:', error);
      return null;
    }
  });

/**
 * Calculate trending categories for a ZIP code
 */
exports.calculateTrending = functions.pubsub
  .schedule('0 3 * * *')
  .timeZone('America/Chicago')
  .onRun(async (context) => {
    console.log('Calculating trending categories...');

    try {
      // Group market data by ZIP code
      const marketSnapshot = await db
        .collection('marketData')
        .where('soldListings', '>', 0)
        .orderBy('soldListings', 'desc')
        .get();

      const zipCodeData = {};

      marketSnapshot.forEach((doc) => {
        const data = doc.data();
        const zipCode = data.zipCode;

        if (!zipCodeData[zipCode]) {
          zipCodeData[zipCode] = [];
        }

        zipCodeData[zipCode].push({
          category: data.category,
          soldListings: data.soldListings,
          avgDaysToSell: data.avgDaysToSell,
          avgSoldPrice: data.avgSoldPrice,
        });
      });

      // Save trending data for each ZIP code
      for (const [zipCode, categories] of Object.entries(zipCodeData)) {
        // Sort by sold listings (most popular first)
        categories.sort((a, b) => b.soldListings - a.soldListings);

        await db
          .collection('trending')
          .doc(zipCode)
          .set({
            zipCode,
            categories: categories.slice(0, 10), // Top 10 categories
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          });
      }

      console.log('Successfully calculated trending categories');
      return null;
    } catch (error) {
      console.error('Error calculating trending:', error);
      return null;
    }
  });
