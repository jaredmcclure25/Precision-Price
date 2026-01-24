/**
 * PrecisionPrices Types and Constants
 */

export const CATEGORIES = [
  'Electronics',
  'Furniture',
  'Vehicles',
  'Clothing',
  'Sports & Outdoors',
  'Home & Garden',
  'Toys & Games',
  'Books & Media',
  'Tools & Equipment',
  'Collectibles',
  'Baby & Kids',
  'Musical Instruments',
  'Appliances',
  'Art & Crafts',
  'Other',
];

export const TIERS = {
  bronze: {
    name: 'Bronze',
    minListings: 0,
    features: ['basic_search', 'view_averages'],
  },
  silver: {
    name: 'Silver',
    minListings: 3,
    features: ['basic_search', 'view_averages', 'trend_30_days'],
  },
  gold: {
    name: 'Gold',
    minListings: 10,
    features: ['basic_search', 'view_averages', 'trend_30_days', 'trend_90_days', 'price_alerts'],
  },
  platinum: {
    name: 'Platinum',
    minListings: 25,
    features: ['basic_search', 'view_averages', 'trend_30_days', 'trend_90_days', 'price_alerts', 'api_access', 'bulk_export'],
  },
};

/**
 * Calculate user tier based on listings added
 * @param {number} listingsAdded
 * @returns {string}
 */
export const calculateTier = (listingsAdded) => {
  if (listingsAdded >= 25) return 'platinum';
  if (listingsAdded >= 10) return 'gold';
  if (listingsAdded >= 3) return 'silver';
  return 'bronze';
};

/**
 * @typedef {Object} MarketData
 * @property {string} category
 * @property {string} zipCode
 * @property {number} avgSoldPrice
 * @property {number} avgDaysToSell
 * @property {number} soldListings
 * @property {number} activeListings
 * @property {string} confidence - 'high' | 'medium' | 'low'
 * @property {number} sampleSize
 * @property {{ min: number, max: number }} priceRange
 * @property {Array<{ price: number, daysToSell: number }>} [recentSales]
 */

/**
 * @typedef {Object} UserListing
 * @property {string} id
 * @property {string} userId
 * @property {string} title
 * @property {string} category
 * @property {string} [description]
 * @property {number} askingPrice
 * @property {number} [soldPrice]
 * @property {string} zipCode
 * @property {string} condition - 'new' | 'like-new' | 'good' | 'fair' | 'poor'
 * @property {string} status - 'active' | 'sold' | 'removed'
 * @property {Date} datePosted
 * @property {Date} [dateSold]
 * @property {Date} [dateRemoved]
 * @property {number} [daysToSell]
 * @property {string} [marketplace]
 * @property {string} [listingUrl]
 * @property {string[]} notificationsSent
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} tier - 'bronze' | 'silver' | 'gold' | 'platinum'
 * @property {number} listingsAdded
 * @property {number} listingsUpdated
 * @property {number} dataQualityScore
 * @property {string} [defaultZipCode]
 * @property {boolean} emailNotifications
 * @property {Date} createdAt
 * @property {Date} lastActive
 */
