/**
 * Precision Prices - Listing Storage Service
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';

const COLLECTION_NAME = 'listings';

/**
 * Generate a unique listing ID
 */
export function generateListingId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Save a listing to Firestore
 * @param {Object} listing - The listing data
 * @param {string} userId - The user ID (optional, 'guest' if not provided)
 * @returns {Promise<string>} The listing ID
 */
export async function saveListing(listing, userId = 'guest') {
  try {
    const listingId = generateListingId();
    const timestamp = new Date().toISOString();

    const listingData = {
      id: listingId,
      userId: userId || 'guest',
      ...listing,
      createdAt: timestamp,
      updatedAt: timestamp,
      isPublic: true, // Make listings public by default for sharing
      viewCount: 0,
      shareCount: 0,
    };

    // Save to Firestore
    const listingRef = doc(db, COLLECTION_NAME, listingId);
    await setDoc(listingRef, listingData);

    return listingId;
  } catch (error) {
    console.error('Error saving listing to Firestore:', error);
    throw error;
  }
}

/**
 * Get a listing by ID (public access - no auth required)
 * @param {string} listingId - The listing ID
 * @returns {Promise<Object|null>} The listing data or null if not found
 */
export async function getListing(listingId) {
  try {
    const listingRef = doc(db, COLLECTION_NAME, listingId);
    const listingSnap = await getDoc(listingRef);

    if (!listingSnap.exists()) {
      return null;
    }

    const listingData = listingSnap.data();

    // Increment view count
    try {
      await updateDoc(listingRef, {
        viewCount: (listingData.viewCount || 0) + 1,
        lastViewedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Could not update view count:', e);
    }

    return listingData;
  } catch (error) {
    console.error('Error getting listing from Firestore:', error);
    return null;
  }
}

/**
 * Get all listings for a specific user
 * @param {string} userId - The user ID
 * @param {number} maxResults - Maximum number of results to return
 * @returns {Promise<Array>} Array of listings
 */
export async function getAllListings(userId, maxResults = 50) {
  try {
    const listingsRef = collection(db, COLLECTION_NAME);
    const q = query(
      listingsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );

    const querySnapshot = await getDocs(q);
    const listings = [];

    querySnapshot.forEach((doc) => {
      listings.push(doc.data());
    });

    return listings;
  } catch (error) {
    console.error('Error getting all listings from Firestore:', error);
    return [];
  }
}

/**
 * Update a listing
 * @param {string} listingId - The listing ID
 * @param {Object} updates - The updates to apply
 * @returns {Promise<boolean>} Success status
 */
export async function updateListing(listingId, updates) {
  try {
    const listingRef = doc(db, COLLECTION_NAME, listingId);

    await updateDoc(listingRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('Error updating listing in Firestore:', error);
    return false;
  }
}

/**
 * Delete a listing
 * @param {string} listingId - The listing ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteListing(listingId) {
  try {
    const listingRef = doc(db, COLLECTION_NAME, listingId);
    await deleteDoc(listingRef);
    return true;
  } catch (error) {
    console.error('Error deleting listing from Firestore:', error);
    return false;
  }
}

/**
 * Increment share count for a listing
 * @param {string} listingId - The listing ID
 * @returns {Promise<boolean>} Success status
 */
export async function incrementShareCount(listingId) {
  try {
    const listingRef = doc(db, COLLECTION_NAME, listingId);
    const listingSnap = await getDoc(listingRef);

    if (!listingSnap.exists()) return false;

    const currentCount = listingSnap.data().shareCount || 0;
    await updateDoc(listingRef, {
      shareCount: currentCount + 1,
      lastSharedAt: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('Error incrementing share count:', error);
    return false;
  }
}

/**
 * Format listing data for Facebook Marketplace
 * @param {Object} listing - The listing data
 * @returns {Object} Formatted data for Facebook
 */
export function formatForFacebookMarketplace(listing) {
  const { itemIdentification, pricingStrategy, optimizationTips } = listing;

  // Generate optimized title (max 100 chars for Facebook)
  const title = itemIdentification.name.substring(0, 100);

  // Generate optimized description
  const description = `${itemIdentification.observedCondition} condition ${itemIdentification.brand ? itemIdentification.brand + ' ' : ''}${itemIdentification.name}.

${optimizationTips?.slice(0, 3).map(tip => `✓ ${tip}`).join('\n') || ''}

${listing.additionalDetails || ''}

Priced using AI market analysis for optimal sell-through.`;

  return {
    title,
    description: description.trim(),
    price: Math.round(pricingStrategy.listingPrice),
    category: itemIdentification.category || '',
    condition: mapConditionToFacebook(itemIdentification.observedCondition),
    location: listing.location || '',
  };
}

/**
 * Map our condition format to Facebook's expected values
 * @param {string} condition - Our condition value
 * @returns {string} Facebook condition value
 */
function mapConditionToFacebook(condition) {
  const mapping = {
    'excellent': 'new',
    'good': 'used_like_new',
    'fair': 'used_good',
    'poor': 'used_fair',
  };

  return mapping[condition?.toLowerCase()] || 'used_good';
}
