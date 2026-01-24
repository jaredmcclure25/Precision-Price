/**
 * PrecisionPrices - Firestore Operations for Listings
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase';
import { calculateTier } from '../types';

/**
 * Get or create user profile
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export const getOrCreateUserProfile = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const data = userDoc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      lastActive: data.lastActive?.toDate?.() || new Date(),
    };
  }

  // Create new user profile
  const newProfile = {
    tier: 'bronze',
    listingsAdded: 0,
    listingsUpdated: 0,
    dataQualityScore: 0,
    emailNotifications: true,
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
  };

  await setDoc(userRef, newProfile);
  return {
    ...newProfile,
    createdAt: new Date(),
    lastActive: new Date(),
  };
};

/**
 * Update user profile
 * @param {string} userId
 * @param {Object} updates
 */
export const updateUserProfile = async (userId, updates) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    ...updates,
    lastActive: serverTimestamp(),
  });
};

/**
 * Add a new listing
 * @param {string} userId
 * @param {Object} listingData
 * @returns {Promise<string>} - The listing ID
 */
export const addListing = async (userId, listingData) => {
  const listingsRef = collection(db, 'users', userId, 'listings');
  const listingId = doc(listingsRef).id;
  const listingRef = doc(listingsRef, listingId);

  const listing = {
    ...listingData,
    id: listingId,
    userId,
    status: 'active',
    datePosted: serverTimestamp(),
    notificationsSent: [],
    createdAt: serverTimestamp(),
  };

  await setDoc(listingRef, listing);

  // Update user profile
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data() || {};
  const newListingsAdded = (userData.listingsAdded || 0) + 1;
  const newTier = calculateTier(newListingsAdded);

  await updateDoc(userRef, {
    listingsAdded: increment(1),
    tier: newTier,
    lastActive: serverTimestamp(),
  });

  // Add to market data aggregation collection
  await addToMarketData(listingData);

  return listingId;
};

/**
 * Get user listings
 * @param {string} userId
 * @param {string} [status] - Optional filter by status
 * @returns {Promise<Array>}
 */
export const getUserListings = async (userId, status) => {
  const listingsRef = collection(db, 'users', userId, 'listings');

  let q;
  if (status) {
    q = query(
      listingsRef,
      where('status', '==', status),
      orderBy('datePosted', 'desc'),
      limit(100)
    );
  } else {
    q = query(
      listingsRef,
      orderBy('datePosted', 'desc'),
      limit(100)
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      datePosted: data.datePosted?.toDate?.() || new Date(),
      dateSold: data.dateSold?.toDate?.() || null,
      dateRemoved: data.dateRemoved?.toDate?.() || null,
    };
  });
};

/**
 * Update listing status (sold or removed)
 * @param {string} userId
 * @param {string} listingId
 * @param {'sold' | 'removed'} status
 * @param {number} [soldPrice]
 */
export const updateListingStatus = async (userId, listingId, status, soldPrice) => {
  const listingRef = doc(db, 'users', userId, 'listings', listingId);
  const listingDoc = await getDoc(listingRef);

  if (!listingDoc.exists()) {
    throw new Error('Listing not found');
  }

  const listingData = listingDoc.data();
  const datePosted = listingData.datePosted?.toDate?.() || new Date();
  const now = new Date();
  const daysToSell = Math.floor(
    (now.getTime() - datePosted.getTime()) / (1000 * 60 * 60 * 24)
  );

  const updates = {
    status,
    ...(status === 'sold' && {
      soldPrice,
      dateSold: serverTimestamp(),
      daysToSell,
    }),
    ...(status === 'removed' && {
      dateRemoved: serverTimestamp(),
    }),
  };

  await updateDoc(listingRef, updates);

  // Update user profile
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    listingsUpdated: increment(1),
    lastActive: serverTimestamp(),
  });

  // Update market data if sold
  if (status === 'sold' && soldPrice) {
    await updateMarketDataWithSale({
      ...listingData,
      soldPrice,
      daysToSell,
    });
  }
};

/**
 * Add listing to market data collection for aggregation
 * @param {Object} listingData
 */
const addToMarketData = async (listingData) => {
  try {
    const marketRef = doc(
      db,
      'marketData',
      `${listingData.zipCode}_${listingData.category}`
    );
    const marketDoc = await getDoc(marketRef);

    if (marketDoc.exists()) {
      await updateDoc(marketRef, {
        activeListings: increment(1),
        lastUpdated: serverTimestamp(),
      });
    } else {
      await setDoc(marketRef, {
        zipCode: listingData.zipCode,
        category: listingData.category,
        avgSoldPrice: 0,
        avgDaysToSell: 0,
        soldListings: 0,
        activeListings: 1,
        totalSoldValue: 0,
        totalDaysToSell: 0,
        priceMin: null,
        priceMax: null,
        lastUpdated: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error updating market data:', error);
  }
};

/**
 * Update market data when an item sells
 * @param {Object} saleData
 */
const updateMarketDataWithSale = async (saleData) => {
  try {
    const marketRef = doc(
      db,
      'marketData',
      `${saleData.zipCode}_${saleData.category}`
    );
    const marketDoc = await getDoc(marketRef);

    if (marketDoc.exists()) {
      const data = marketDoc.data();
      const newSoldListings = (data.soldListings || 0) + 1;
      const newTotalSoldValue = (data.totalSoldValue || 0) + saleData.soldPrice;
      const newTotalDaysToSell = (data.totalDaysToSell || 0) + saleData.daysToSell;

      await updateDoc(marketRef, {
        soldListings: newSoldListings,
        totalSoldValue: newTotalSoldValue,
        totalDaysToSell: newTotalDaysToSell,
        avgSoldPrice: newTotalSoldValue / newSoldListings,
        avgDaysToSell: newTotalDaysToSell / newSoldListings,
        activeListings: increment(-1),
        priceMin:
          data.priceMin === null
            ? saleData.soldPrice
            : Math.min(data.priceMin, saleData.soldPrice),
        priceMax:
          data.priceMax === null
            ? saleData.soldPrice
            : Math.max(data.priceMax, saleData.soldPrice),
        lastUpdated: serverTimestamp(),
      });

      // Add to recent sales
      const recentSalesRef = collection(marketRef, 'recentSales');
      await setDoc(doc(recentSalesRef), {
        price: saleData.soldPrice,
        daysToSell: saleData.daysToSell,
        soldAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error updating market data with sale:', error);
  }
};

/**
 * Get market data for a ZIP code and category
 * @param {string} zipCode
 * @param {string} category
 * @returns {Promise<Object|null>}
 */
export const getMarketData = async (zipCode, category) => {
  try {
    const marketRef = doc(db, 'marketData', `${zipCode}_${category}`);
    const marketDoc = await getDoc(marketRef);

    if (!marketDoc.exists()) {
      return null;
    }

    const data = marketDoc.data();

    // Get recent sales
    const recentSalesRef = collection(marketRef, 'recentSales');
    const recentSalesQuery = query(
      recentSalesRef,
      orderBy('soldAt', 'desc'),
      limit(10)
    );
    const recentSalesSnap = await getDocs(recentSalesQuery);
    const recentSales = recentSalesSnap.docs.map((d) => d.data());

    // Calculate confidence
    let confidence = 'low';
    if (data.soldListings >= 20) confidence = 'high';
    else if (data.soldListings >= 5) confidence = 'medium';

    return {
      category,
      zipCode,
      avgSoldPrice: data.avgSoldPrice || 0,
      avgDaysToSell: data.avgDaysToSell || 0,
      soldListings: data.soldListings || 0,
      activeListings: data.activeListings || 0,
      confidence,
      sampleSize: data.soldListings || 0,
      priceRange: {
        min: data.priceMin || 0,
        max: data.priceMax || 0,
      },
      recentSales,
    };
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
};

/**
 * Search market data by ZIP code
 * @param {string} zipCode
 * @returns {Promise<Array>}
 */
export const searchMarketByZip = async (zipCode) => {
  try {
    const marketRef = collection(db, 'marketData');
    const q = query(
      marketRef,
      where('zipCode', '==', zipCode),
      where('soldListings', '>', 0),
      orderBy('soldListings', 'desc'),
      limit(20)
    );

    const snapshot = await getDocs(q);
    const results = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      // Get recent sales
      const recentSalesRef = collection(docSnap.ref, 'recentSales');
      const recentSalesQuery = query(
        recentSalesRef,
        orderBy('soldAt', 'desc'),
        limit(5)
      );
      const recentSalesSnap = await getDocs(recentSalesQuery);
      const recentSales = recentSalesSnap.docs.map((d) => d.data());

      // Calculate confidence
      let confidence = 'low';
      if (data.soldListings >= 20) confidence = 'high';
      else if (data.soldListings >= 5) confidence = 'medium';

      results.push({
        category: data.category,
        zipCode: data.zipCode,
        avgSoldPrice: data.avgSoldPrice || 0,
        avgDaysToSell: data.avgDaysToSell || 0,
        soldListings: data.soldListings || 0,
        activeListings: data.activeListings || 0,
        confidence,
        sampleSize: data.soldListings || 0,
        priceRange: {
          min: data.priceMin || 0,
          max: data.priceMax || 0,
        },
        recentSales,
      });
    }

    return results;
  } catch (error) {
    console.error('Error searching market:', error);
    return [];
  }
};

/**
 * Get trending categories for a ZIP code
 * @param {string} zipCode
 * @param {number} [maxResults=6]
 * @returns {Promise<Array>}
 */
export const getTrendingByZip = async (zipCode, maxResults = 6) => {
  try {
    const marketRef = collection(db, 'marketData');
    const q = query(
      marketRef,
      where('zipCode', '==', zipCode),
      where('soldListings', '>', 0),
      orderBy('soldListings', 'desc'),
      limit(maxResults)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        category: data.category,
        avgSoldPrice: data.avgSoldPrice || 0,
        avgDaysToSell: data.avgDaysToSell || 0,
        soldListings: data.soldListings || 0,
        activeListings: data.activeListings || 0,
      };
    });
  } catch (error) {
    console.error('Error fetching trending:', error);
    return [];
  }
};

/**
 * Get recent community sales across all categories
 * @param {string} [zipCode] - Optional filter by ZIP
 * @param {number} [maxResults=10]
 * @returns {Promise<Array>}
 */
export const getRecentCommunitySales = async (zipCode, maxResults = 10) => {
  try {
    const marketRef = collection(db, 'marketData');

    // Get market docs (optionally filtered by ZIP)
    let marketQuery;
    if (zipCode) {
      marketQuery = query(
        marketRef,
        where('zipCode', '==', zipCode),
        where('soldListings', '>', 0),
        limit(20)
      );
    } else {
      marketQuery = query(
        marketRef,
        where('soldListings', '>', 0),
        orderBy('soldListings', 'desc'),
        limit(20)
      );
    }

    const marketSnapshot = await getDocs(marketQuery);
    const allSales = [];

    // Collect recent sales from each market
    for (const marketDoc of marketSnapshot.docs) {
      const marketData = marketDoc.data();
      const recentSalesRef = collection(marketDoc.ref, 'recentSales');
      const recentSalesQuery = query(
        recentSalesRef,
        orderBy('soldAt', 'desc'),
        limit(5)
      );

      const salesSnap = await getDocs(recentSalesQuery);
      salesSnap.forEach((saleDoc) => {
        const saleData = saleDoc.data();
        allSales.push({
          category: marketData.category,
          zipCode: marketData.zipCode,
          price: saleData.price,
          daysToSell: saleData.daysToSell,
          soldAt: saleData.soldAt?.toDate?.() || new Date(),
        });
      });
    }

    // Sort by date and limit
    allSales.sort((a, b) => b.soldAt - a.soldAt);
    return allSales.slice(0, maxResults);
  } catch (error) {
    console.error('Error fetching community sales:', error);
    return [];
  }
};

/**
 * Search market data by item query and ZIP code
 * @param {string} searchQuery - Item name/type to search
 * @param {string} zipCode
 * @param {number} [radiusMiles=25] - Search radius (for future expansion)
 * @returns {Promise<Array>}
 */
export const searchMarketItems = async (searchQuery, zipCode, radiusMiles = 25) => {
  try {
    // For now, search by category match
    // In the future, this could use a full-text search service
    const normalizedQuery = searchQuery.toLowerCase().trim();

    const marketRef = collection(db, 'marketData');
    const q = query(
      marketRef,
      where('zipCode', '==', zipCode),
      orderBy('soldListings', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const results = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const category = (data.category || '').toLowerCase();

      // Simple matching - check if query is in category
      if (category.includes(normalizedQuery) || normalizedQuery.includes(category)) {
        // Get recent sales
        const recentSalesRef = collection(docSnap.ref, 'recentSales');
        const recentSalesQuery = query(
          recentSalesRef,
          orderBy('soldAt', 'desc'),
          limit(5)
        );
        const recentSalesSnap = await getDocs(recentSalesQuery);
        const recentSales = recentSalesSnap.docs.map((d) => d.data());

        let confidence = 'low';
        if (data.soldListings >= 20) confidence = 'high';
        else if (data.soldListings >= 5) confidence = 'medium';

        results.push({
          category: data.category,
          zipCode: data.zipCode,
          avgSoldPrice: data.avgSoldPrice || 0,
          avgDaysToSell: data.avgDaysToSell || 0,
          soldListings: data.soldListings || 0,
          activeListings: data.activeListings || 0,
          confidence,
          sampleSize: data.soldListings || 0,
          priceRange: {
            min: data.priceMin || 0,
            max: data.priceMax || 0,
          },
          recentSales,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error searching market items:', error);
    return [];
  }
};

/**
 * Save user's default ZIP code and search radius
 * @param {string} userId
 * @param {string} zipCode
 * @param {number} radiusMiles
 */
export const saveUserLocation = async (userId, zipCode, radiusMiles = 25) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      defaultZipCode: zipCode,
      searchRadius: radiusMiles,
      lastActive: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving user location:', error);
  }
};
