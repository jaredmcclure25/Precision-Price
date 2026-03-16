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

    // Note: If no data exists yet or user isn't authenticated, queries will fail gracefully

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
        // Silent fail - no metro data available or permission denied
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
        // Silent fail - no state data available or permission denied
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
        // Silent fail - no category data available or permission denied
        // This is expected when database is empty or user not authenticated
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
export function blendPricing(aiPricing, realData, ebayData = null) {
  // Adjust eBay prices down ~12% (eBay tends to run higher than FB Marketplace)
  const ebayAdjustedAvg = ebayData?.avgPrice ? Math.round(ebayData.avgPrice * 0.88) : null;
  const hasEbay = ebayData && ebayData.items && ebayData.items.length >= 3 && ebayAdjustedAvg;
  const hasRealData = realData && realData.count >= 3;

  // Case 1: No real data and no eBay data — AI only
  if (!hasRealData && !hasEbay) {
    return {
      ...aiPricing,
      dataSource: 'AI_only',
      confidenceScore: 60
    };
  }

  let blendedOptimal;
  let dataSource;
  let confidence = 70;

  if (hasRealData && hasEbay) {
    // Case 2: Three-way blend — database 50%, eBay 30%, AI 20%
    blendedOptimal = Math.round(
      (realData.avgPrice * 0.5) + (ebayAdjustedAvg * 0.3) + (aiPricing.optimal * 0.2)
    );
    dataSource = 'hybrid_AI_plus_database_plus_ebay';
    confidence = 75;
  } else if (hasRealData) {
    // Case 3: Two-way blend — database + AI (original behavior)
    const dataWeight = Math.min(0.8, 0.5 + (realData.count * 0.05));
    const aiWeight = 1 - dataWeight;
    blendedOptimal = Math.round(
      (realData.avgPrice * dataWeight) + (aiPricing.optimal * aiWeight)
    );
    dataSource = 'hybrid_AI_plus_database';
    confidence = 70;
  } else {
    // Case 4: Two-way blend — eBay + AI (no database data)
    blendedOptimal = Math.round(
      (ebayAdjustedAvg * 0.4) + (aiPricing.optimal * 0.6)
    );
    dataSource = 'hybrid_AI_plus_ebay';
    confidence = 68;
  }

  // Calculate min/max from available data
  let spread;
  if (hasRealData) {
    spread = realData.stdDev;
  } else if (hasEbay && ebayData.priceRange) {
    spread = Math.round((ebayData.priceRange.max - ebayData.priceRange.min) * 0.88 / 4);
  } else {
    spread = Math.round(blendedOptimal * 0.15);
  }

  const finalMin = Math.max(1, Math.round(blendedOptimal - spread));
  const finalMax = Math.max(blendedOptimal, Math.round(blendedOptimal + spread));

  // Confidence scoring
  if (hasRealData) {
    if (realData.count >= 10) confidence = 90;
    else if (realData.count >= 5) confidence = 80;
    else if (realData.count >= 3) confidence = 75;

    if (realData.geographicScope === 'local') confidence += 5;
    if (realData.dataFreshness === 'recent') confidence += 5;
  }

  // Boost confidence when eBay data corroborates
  if (hasEbay) {
    confidence += 5;
    if (ebayData.items.length >= 10) confidence += 3;
  }

  return {
    min: finalMin,
    max: finalMax,
    optimal: blendedOptimal,
    dataSource,
    confidenceScore: Math.min(100, confidence),
    dataCount: hasRealData ? realData.count : 0,
    ebayCount: hasEbay ? ebayData.items.length : 0,
    geographicScope: hasRealData ? realData.geographicScope : (hasEbay ? 'national' : null),
    avgDaysToSell: hasRealData ? realData.avgDaysToSell : null
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
