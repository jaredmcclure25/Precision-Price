/**
 * Pricing Intelligence System
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 *
 * Query and analyze proprietary sold price database for data-driven pricing
 */

import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Query comparable sold items from Firebase database
 * @param {string} itemName - Name of the item
 * @param {string} category - Item category
 * @param {object} locationData - Parsed location data
 * @returns {Promise<object>} - Comparable pricing data
 */
export async function getComparableItems(itemName, category, locationData) {
  try {
    // Build query for similar items
    const soldPricesRef = collection(db, 'soldPrices');

    // Query 1: Same category in same metro area (most relevant)
    let comparables = [];

    if (locationData.metro) {
      const metroQuery = query(
        soldPricesRef,
        where('category', '==', category),
        where('location.parsed.metro', '==', locationData.metro),
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      try {
        const metroSnapshot = await getDocs(metroQuery);
        metroSnapshot.forEach((doc) => {
          comparables.push(doc.data());
        });
      } catch (e) {
        console.log('Metro query failed, trying state-level');
      }
    }

    // Query 2: If not enough metro data, try state-level
    if (comparables.length < 5 && locationData.state) {
      const stateQuery = query(
        soldPricesRef,
        where('category', '==', category),
        where('location.parsed.state', '==', locationData.state),
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      try {
        const stateSnapshot = await getDocs(stateQuery);
        stateSnapshot.forEach((doc) => {
          const data = doc.data();
          // Don't add duplicates
          if (!comparables.find(c => c.itemName === data.itemName && c.timestamp === data.timestamp)) {
            comparables.push(data);
          }
        });
      } catch (e) {
        console.log('State query failed, trying category-only');
      }
    }

    // Query 3: If still not enough, get category data nationally
    if (comparables.length < 3) {
      const categoryQuery = query(
        soldPricesRef,
        where('category', '==', category),
        orderBy('timestamp', 'desc'),
        limit(30)
      );

      try {
        const categorySnapshot = await getDocs(categoryQuery);
        categorySnapshot.forEach((doc) => {
          const data = doc.data();
          if (!comparables.find(c => c.itemName === data.itemName && c.timestamp === data.timestamp)) {
            comparables.push(data);
          }
        });
      } catch (e) {
        console.error('All queries failed:', e);
      }
    }

    // If no data found, return null
    if (comparables.length === 0) {
      return null;
    }

    // Filter to last 90 days for freshness
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentComparables = comparables.filter(item => {
      const itemDate = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
      return itemDate >= ninetyDaysAgo;
    });

    // Use recent data if available, otherwise fall back to all data
    const dataToAnalyze = recentComparables.length >= 3 ? recentComparables : comparables;

    // Calculate statistics
    const prices = dataToAnalyze.map(item => item.actualSoldPrice);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

    // Calculate standard deviation
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);

    // Calculate median
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const median = sortedPrices[Math.floor(sortedPrices.length / 2)];

    // Calculate min/max
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Calculate average days to sell (if data available)
    const daysData = dataToAnalyze.filter(item => item.daysToSell != null);
    const avgDaysToSell = daysData.length > 0
      ? daysData.reduce((sum, item) => sum + item.daysToSell, 0) / daysData.length
      : null;

    // Build comparable items list
    const comparableItems = dataToAnalyze.slice(0, 5).map(item => ({
      description: `${item.itemName} (${item.condition})`,
      soldPrice: item.actualSoldPrice,
      location: item.location?.parsed?.city || item.location?.parsed?.state || 'Unknown',
      daysToSell: item.daysToSell || null
    }));

    return {
      count: dataToAnalyze.length,
      avgPrice: Math.round(avgPrice),
      median: Math.round(median),
      min: Math.round(minPrice),
      max: Math.round(maxPrice),
      stdDev: Math.round(stdDev),
      avgDaysToSell: avgDaysToSell ? Math.round(avgDaysToSell) : null,
      comparableItems,
      dataFreshness: recentComparables.length >= 3 ? 'recent' : 'historical',
      geographicScope: comparables.some(c => c.location?.parsed?.metro === locationData.metro)
        ? 'local'
        : comparables.some(c => c.location?.parsed?.state === locationData.state)
        ? 'regional'
        : 'national'
    };
  } catch (error) {
    console.error('Error querying comparable items:', error);
    return null;
  }
}

/**
 * Blend AI pricing with real database pricing
 * @param {object} aiPricing - Claude's suggested pricing
 * @param {object} realData - Comparable items data from database
 * @returns {object} - Blended pricing recommendation
 */
export function blendPricing(aiPricing, realData) {
  if (!realData || realData.count < 3) {
    // Not enough data, use AI pricing as-is
    return {
      ...aiPricing,
      dataSource: 'AI_only',
      confidenceScore: 60
    };
  }

  // Calculate blend weight based on data count
  // More data = higher weight on real data
  const dataWeight = Math.min(0.8, 0.5 + (realData.count * 0.05)); // 0.5 to 0.8
  const aiWeight = 1 - dataWeight;

  // Blend optimal price
  const blendedOptimal = Math.round(
    (realData.avgPrice * dataWeight) + (aiPricing.optimal * aiWeight)
  );

  // Blend min/max based on real data's range
  const blendedMin = Math.round(blendedOptimal - realData.stdDev);
  const blendedMax = Math.round(blendedOptimal + realData.stdDev);

  // Ensure min/max are reasonable
  const finalMin = Math.max(1, blendedMin);
  const finalMax = Math.max(blendedOptimal, blendedMax);

  // Calculate confidence score
  let confidence = 70; // Base confidence
  if (realData.count >= 10) confidence = 90;
  else if (realData.count >= 5) confidence = 80;
  else if (realData.count >= 3) confidence = 75;

  // Boost confidence for local data
  if (realData.geographicScope === 'local') confidence += 5;

  // Boost confidence for recent data
  if (realData.dataFreshness === 'recent') confidence += 5;

  return {
    min: finalMin,
    max: finalMax,
    optimal: blendedOptimal,
    dataSource: 'hybrid_AI_plus_database',
    confidenceScore: Math.min(100, confidence),
    dataCount: realData.count,
    geographicScope: realData.geographicScope,
    avgDaysToSell: realData.avgDaysToSell
  };
}

/**
 * Format pricing insights for display to user
 * @param {object} realData - Comparable items data
 * @param {object} locationData - Parsed location data
 * @returns {string} - Human-readable insights
 */
export function formatPricingInsights(realData, locationData) {
  if (!realData) {
    return "Be the first to report a sale in this category to help build our pricing database!";
  }

  const scope = realData.geographicScope === 'local' ? `in ${locationData.metro || locationData.city}`
    : realData.geographicScope === 'regional' ? `in ${locationData.state}`
    : 'nationally';

  let insight = `Based on ${realData.count} similar items sold ${scope}. `;
  insight += `Average sale price: $${realData.avgPrice}. `;

  if (realData.avgDaysToSell) {
    insight += `Typical time to sell: ${realData.avgDaysToSell} days. `;
  }

  if (realData.dataFreshness === 'recent') {
    insight += "Data is from the last 90 days.";
  } else {
    insight += "Note: Limited recent data available.";
  }

  return insight;
}
