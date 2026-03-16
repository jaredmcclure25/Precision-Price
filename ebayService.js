/**
 * eBay Browse API Integration
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 *
 * Fetches real sold/listed price data from eBay to enhance AI pricing accuracy.
 * Requires EBAY_APP_ID and EBAY_CERT_ID environment variables.
 */

// --- OAuth Token Management ---

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const appId = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;

  if (!appId || !certId) {
    return null;
  }

  const credentials = Buffer.from(`${appId}:${certId}`).toString('base64');

  const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
  });

  if (!response.ok) {
    console.error('eBay OAuth error:', response.status, await response.text());
    return null;
  }

  const data = await response.json();
  cachedToken = data.access_token;
  // Refresh 60 seconds before actual expiry
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

// --- Search Cache ---

const searchCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Clean up expired cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of searchCache) {
    if (now - entry.timestamp > CACHE_TTL) {
      searchCache.delete(key);
    }
  }
}, 10 * 60 * 1000);

// --- Condition Mapping ---

const CONDITION_MAP = {
  'new': 'NEW',
  'like new': 'LIKE_NEW',
  'open box': 'LIKE_NEW',
  'excellent': 'VERY_GOOD',
  'very good': 'VERY_GOOD',
  'good': 'GOOD',
  'fair': 'ACCEPTABLE',
  'acceptable': 'ACCEPTABLE',
  'used': 'GOOD',
  'for parts': 'FOR_PARTS_OR_NOT_WORKING'
};

function mapCondition(condition) {
  if (!condition) return null;
  return CONDITION_MAP[condition.toLowerCase().trim()] || null;
}

// --- Main Search Function ---

/**
 * Search eBay for comparable items
 * @param {string} itemName - Item to search for
 * @param {string} condition - Item condition (optional)
 * @param {string} category - Item category (optional)
 * @returns {Promise<object|null>} - Search results with stats
 */
export async function searchEbaySoldItems(itemName, condition, category) {
  if (!itemName) return null;

  // Check cache
  const cacheKey = `${itemName.toLowerCase().trim()}|${condition || ''}|${category || ''}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Get OAuth token
  const token = await getAccessToken();
  if (!token) {
    return null; // eBay not configured
  }

  try {
    // Build search parameters
    const params = new URLSearchParams({
      q: itemName,
      limit: '20',
      sort: 'price'
    });

    // Add condition filter if provided
    const ebayCondition = mapCondition(condition);
    if (ebayCondition) {
      params.set('filter', `conditions:{${ebayCondition}}`);
    }

    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('eBay search error:', response.status);
      // If token expired, clear it so next call refreshes
      if (response.status === 401) {
        cachedToken = null;
        tokenExpiry = 0;
      }
      return null;
    }

    const data = await response.json();
    const items = (data.itemSummaries || []).map(item => ({
      title: item.title,
      price: parseFloat(item.price?.value || 0),
      currency: item.price?.currency || 'USD',
      condition: item.condition || 'Unknown',
      imageUrl: item.image?.imageUrl || null,
      itemUrl: item.itemWebUrl || null,
      buyingOptions: item.buyingOptions || []
    })).filter(item => item.price > 0);

    if (items.length === 0) {
      const emptyResult = { items: [], totalCount: 0, avgPrice: null, priceRange: null };
      searchCache.set(cacheKey, { data: emptyResult, timestamp: Date.now() });
      return emptyResult;
    }

    // Calculate stats
    const prices = items.map(i => i.price);
    const avgPrice = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const median = sortedPrices[Math.floor(sortedPrices.length / 2)];

    const result = {
      items,
      totalCount: data.total || items.length,
      avgPrice,
      median: Math.round(median),
      priceRange: {
        min: Math.round(Math.min(...prices)),
        max: Math.round(Math.max(...prices))
      }
    };

    // Cache the result
    searchCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.error('eBay search failed:', error.message);
    return null;
  }
}
