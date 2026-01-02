/**
 * Location Intelligence for Precision Prices
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 *
 * ZIP code database and location parser for regional pricing adjustments
 */

// Major US cities and metros with pricing multipliers
export const locationDatabase = {
  // New York Metro
  "10001": { city: "New York", state: "NY", metro: "NYC Metro", multiplier: 1.25, demand: "high" },
  "10002": { city: "New York", state: "NY", metro: "NYC Metro", multiplier: 1.25, demand: "high" },
  "10003": { city: "New York", state: "NY", metro: "NYC Metro", multiplier: 1.25, demand: "high" },
  "11201": { city: "Brooklyn", state: "NY", metro: "NYC Metro", multiplier: 1.22, demand: "high" },
  "11101": { city: "Queens", state: "NY", metro: "NYC Metro", multiplier: 1.20, demand: "high" },

  // San Francisco Bay Area
  "94102": { city: "San Francisco", state: "CA", metro: "SF Bay Area", multiplier: 1.28, demand: "high" },
  "94103": { city: "San Francisco", state: "CA", metro: "SF Bay Area", multiplier: 1.28, demand: "high" },
  "94104": { city: "San Francisco", state: "CA", metro: "SF Bay Area", multiplier: 1.28, demand: "high" },
  "94301": { city: "Palo Alto", state: "CA", metro: "SF Bay Area", multiplier: 1.30, demand: "high" },
  "94025": { city: "Menlo Park", state: "CA", metro: "SF Bay Area", multiplier: 1.30, demand: "high" },
  "94041": { city: "Mountain View", state: "CA", metro: "SF Bay Area", multiplier: 1.27, demand: "high" },
  "94043": { city: "Mountain View", state: "CA", metro: "SF Bay Area", multiplier: 1.27, demand: "high" },
  "95054": { city: "Santa Clara", state: "CA", metro: "SF Bay Area", multiplier: 1.25, demand: "high" },
  "94085": { city: "Sunnyvale", state: "CA", metro: "SF Bay Area", multiplier: 1.25, demand: "high" },
  "94087": { city: "Sunnyvale", state: "CA", metro: "SF Bay Area", multiplier: 1.25, demand: "high" },
  "94089": { city: "Sunnyvale", state: "CA", metro: "SF Bay Area", multiplier: 1.25, demand: "high" },
  "94501": { city: "Alameda", state: "CA", metro: "SF Bay Area", multiplier: 1.18, demand: "high" },
  "94601": { city: "Oakland", state: "CA", metro: "SF Bay Area", multiplier: 1.15, demand: "high" },

  // Los Angeles Metro
  "90001": { city: "Los Angeles", state: "CA", metro: "LA Metro", multiplier: 1.20, demand: "high" },
  "90012": { city: "Los Angeles", state: "CA", metro: "LA Metro", multiplier: 1.20, demand: "high" },
  "90028": { city: "Los Angeles", state: "CA", metro: "LA Metro", multiplier: 1.22, demand: "high" },
  "90210": { city: "Beverly Hills", state: "CA", metro: "LA Metro", multiplier: 1.35, demand: "high" },
  "90291": { city: "Venice", state: "CA", metro: "LA Metro", multiplier: 1.25, demand: "high" },
  "90401": { city: "Santa Monica", state: "CA", metro: "LA Metro", multiplier: 1.27, demand: "high" },

  // Seattle Metro
  "98101": { city: "Seattle", state: "WA", metro: "Seattle Metro", multiplier: 1.22, demand: "high" },
  "98102": { city: "Seattle", state: "WA", metro: "Seattle Metro", multiplier: 1.22, demand: "high" },
  "98103": { city: "Seattle", state: "WA", metro: "Seattle Metro", multiplier: 1.20, demand: "high" },
  "98004": { city: "Bellevue", state: "WA", metro: "Seattle Metro", multiplier: 1.23, demand: "high" },
  "98052": { city: "Redmond", state: "WA", metro: "Seattle Metro", multiplier: 1.21, demand: "high" },

  // Boston Metro
  "02108": { city: "Boston", state: "MA", metro: "Boston Metro", multiplier: 1.20, demand: "high" },
  "02109": { city: "Boston", state: "MA", metro: "Boston Metro", multiplier: 1.20, demand: "high" },
  "02138": { city: "Cambridge", state: "MA", metro: "Boston Metro", multiplier: 1.22, demand: "high" },
  "02139": { city: "Cambridge", state: "MA", metro: "Boston Metro", multiplier: 1.22, demand: "high" },
  "02140": { city: "Cambridge", state: "MA", metro: "Boston Metro", multiplier: 1.22, demand: "high" },
  "02141": { city: "Cambridge", state: "MA", metro: "Boston Metro", multiplier: 1.22, demand: "high" },
  "02142": { city: "Cambridge", state: "MA", metro: "Boston Metro", multiplier: 1.22, demand: "high" },

  // Washington DC Metro
  "20001": { city: "Washington", state: "DC", metro: "DC Metro", multiplier: 1.18, demand: "high" },
  "20002": { city: "Washington", state: "DC", metro: "DC Metro", multiplier: 1.18, demand: "high" },
  "22201": { city: "Arlington", state: "VA", metro: "DC Metro", multiplier: 1.17, demand: "high" },
  "22202": { city: "Arlington", state: "VA", metro: "DC Metro", multiplier: 1.17, demand: "high" },

  // Chicago Metro
  "60601": { city: "Chicago", state: "IL", metro: "Chicago Metro", multiplier: 1.12, demand: "high" },
  "60602": { city: "Chicago", state: "IL", metro: "Chicago Metro", multiplier: 1.12, demand: "high" },
  "60603": { city: "Chicago", state: "IL", metro: "Chicago Metro", multiplier: 1.12, demand: "high" },

  // Austin Metro
  "78701": { city: "Austin", state: "TX", metro: "Austin Metro", multiplier: 1.10, demand: "high" },
  "78702": { city: "Austin", state: "TX", metro: "Austin Metro", multiplier: 1.10, demand: "high" },
  "78703": { city: "Austin", state: "TX", metro: "Austin Metro", multiplier: 1.12, demand: "high" },

  // Denver Metro
  "80201": { city: "Denver", state: "CO", metro: "Denver Metro", multiplier: 1.10, demand: "high" },
  "80202": { city: "Denver", state: "CO", metro: "Denver Metro", multiplier: 1.10, demand: "high" },

  // Miami Metro
  "33101": { city: "Miami", state: "FL", metro: "Miami Metro", multiplier: 1.08, demand: "medium" },
  "33109": { city: "Miami Beach", state: "FL", metro: "Miami Metro", multiplier: 1.15, demand: "medium" },

  // Portland Metro
  "97201": { city: "Portland", state: "OR", metro: "Portland Metro", multiplier: 1.08, demand: "medium" },
  "97202": { city: "Portland", state: "OR", metro: "Portland Metro", multiplier: 1.08, demand: "medium" },

  // Phoenix Metro
  "85001": { city: "Phoenix", state: "AZ", metro: "Phoenix Metro", multiplier: 1.00, demand: "medium" },
  "85002": { city: "Phoenix", state: "AZ", metro: "Phoenix Metro", multiplier: 1.00, demand: "medium" },

  // Dallas Metro
  "75201": { city: "Dallas", state: "TX", metro: "Dallas Metro", multiplier: 1.02, demand: "medium" },
  "75202": { city: "Dallas", state: "TX", metro: "Dallas Metro", multiplier: 1.02, demand: "medium" },

  // Houston Metro
  "77001": { city: "Houston", state: "TX", metro: "Houston Metro", multiplier: 1.00, demand: "medium" },
  "77002": { city: "Houston", state: "TX", metro: "Houston Metro", multiplier: 1.00, demand: "medium" },

  // Philadelphia Metro
  "19101": { city: "Philadelphia", state: "PA", metro: "Philadelphia Metro", multiplier: 1.05, demand: "medium" },
  "19102": { city: "Philadelphia", state: "PA", metro: "Philadelphia Metro", multiplier: 1.05, demand: "medium" },

  // San Diego Metro
  "92101": { city: "San Diego", state: "CA", metro: "San Diego Metro", multiplier: 1.12, demand: "medium" },
  "92102": { city: "San Diego", state: "CA", metro: "San Diego Metro", multiplier: 1.10, demand: "medium" },

  // Atlanta Metro
  "30301": { city: "Atlanta", state: "GA", metro: "Atlanta Metro", multiplier: 1.02, demand: "medium" },
  "30302": { city: "Atlanta", state: "GA", metro: "Atlanta Metro", multiplier: 1.02, demand: "medium" },

  // Nashville Metro
  "37201": { city: "Nashville", state: "TN", metro: "Nashville Metro", multiplier: 1.03, demand: "medium" },
  "37202": { city: "Nashville", state: "TN", metro: "Nashville Metro", multiplier: 1.03, demand: "medium" },

  // Raleigh Metro
  "27601": { city: "Raleigh", state: "NC", metro: "Raleigh Metro", multiplier: 1.02, demand: "medium" },
  "27602": { city: "Raleigh", state: "NC", metro: "Raleigh Metro", multiplier: 1.02, demand: "medium" },

  // Salt Lake City Metro
  "84101": { city: "Salt Lake City", state: "UT", metro: "Salt Lake Metro", multiplier: 1.00, demand: "medium" },
  "84102": { city: "Salt Lake City", state: "UT", metro: "Salt Lake Metro", multiplier: 1.00, demand: "medium" }
};

// City name mappings for parsing location text
export const cityMappings = {
  // Major cities (case-insensitive matching)
  "new york": { state: "NY", metro: "NYC Metro", multiplier: 1.25, demand: "high" },
  "nyc": { state: "NY", metro: "NYC Metro", multiplier: 1.25, demand: "high" },
  "manhattan": { state: "NY", metro: "NYC Metro", multiplier: 1.25, demand: "high" },
  "brooklyn": { state: "NY", metro: "NYC Metro", multiplier: 1.22, demand: "high" },
  "queens": { state: "NY", metro: "NYC Metro", multiplier: 1.20, demand: "high" },

  "san francisco": { state: "CA", metro: "SF Bay Area", multiplier: 1.28, demand: "high" },
  "sf": { state: "CA", metro: "SF Bay Area", multiplier: 1.28, demand: "high" },
  "palo alto": { state: "CA", metro: "SF Bay Area", multiplier: 1.30, demand: "high" },
  "mountain view": { state: "CA", metro: "SF Bay Area", multiplier: 1.27, demand: "high" },
  "oakland": { state: "CA", metro: "SF Bay Area", multiplier: 1.15, demand: "high" },
  "san jose": { state: "CA", metro: "SF Bay Area", multiplier: 1.25, demand: "high" },

  "los angeles": { state: "CA", metro: "LA Metro", multiplier: 1.20, demand: "high" },
  "la": { state: "CA", metro: "LA Metro", multiplier: 1.20, demand: "high" },
  "beverly hills": { state: "CA", metro: "LA Metro", multiplier: 1.35, demand: "high" },
  "santa monica": { state: "CA", metro: "LA Metro", multiplier: 1.27, demand: "high" },
  "venice": { state: "CA", metro: "LA Metro", multiplier: 1.25, demand: "high" },

  "seattle": { state: "WA", metro: "Seattle Metro", multiplier: 1.22, demand: "high" },
  "bellevue": { state: "WA", metro: "Seattle Metro", multiplier: 1.23, demand: "high" },
  "redmond": { state: "WA", metro: "Seattle Metro", multiplier: 1.21, demand: "high" },

  "boston": { state: "MA", metro: "Boston Metro", multiplier: 1.20, demand: "high" },
  "cambridge": { state: "MA", metro: "Boston Metro", multiplier: 1.22, demand: "high" },

  "washington": { state: "DC", metro: "DC Metro", multiplier: 1.18, demand: "high" },
  "dc": { state: "DC", metro: "DC Metro", multiplier: 1.18, demand: "high" },
  "arlington": { state: "VA", metro: "DC Metro", multiplier: 1.17, demand: "high" },

  "chicago": { state: "IL", metro: "Chicago Metro", multiplier: 1.12, demand: "high" },
  "austin": { state: "TX", metro: "Austin Metro", multiplier: 1.10, demand: "high" },
  "denver": { state: "CO", metro: "Denver Metro", multiplier: 1.10, demand: "high" },
  "miami": { state: "FL", metro: "Miami Metro", multiplier: 1.08, demand: "medium" },
  "portland": { state: "OR", metro: "Portland Metro", multiplier: 1.08, demand: "medium" },
  "phoenix": { state: "AZ", metro: "Phoenix Metro", multiplier: 1.00, demand: "medium" },
  "dallas": { state: "TX", metro: "Dallas Metro", multiplier: 1.02, demand: "medium" },
  "houston": { state: "TX", metro: "Houston Metro", multiplier: 1.00, demand: "medium" },
  "philadelphia": { state: "PA", metro: "Philadelphia Metro", multiplier: 1.05, demand: "medium" },
  "philly": { state: "PA", metro: "Philadelphia Metro", multiplier: 1.05, demand: "medium" },
  "san diego": { state: "CA", metro: "San Diego Metro", multiplier: 1.12, demand: "medium" },
  "atlanta": { state: "GA", metro: "Atlanta Metro", multiplier: 1.02, demand: "medium" },
  "nashville": { state: "TN", metro: "Nashville Metro", multiplier: 1.03, demand: "medium" },
  "raleigh": { state: "NC", metro: "Raleigh Metro", multiplier: 1.02, demand: "medium" },
  "salt lake city": { state: "UT", metro: "Salt Lake Metro", multiplier: 1.00, demand: "medium" }
};

// State multipliers for general state-level pricing when city not found
export const stateMultipliers = {
  "NY": 1.15,
  "CA": 1.18,
  "MA": 1.12,
  "WA": 1.10,
  "DC": 1.15,
  "IL": 1.05,
  "TX": 1.00,
  "CO": 1.05,
  "FL": 1.00,
  "OR": 1.03,
  "AZ": 0.95,
  "PA": 1.00,
  "GA": 0.98,
  "TN": 0.95,
  "NC": 0.95,
  "UT": 0.95,
  // Rural/lower cost states
  "AL": 0.90, "AR": 0.88, "ID": 0.90, "IN": 0.92, "IA": 0.90,
  "KS": 0.90, "KY": 0.90, "LA": 0.92, "ME": 0.95, "MI": 0.95,
  "MN": 1.00, "MS": 0.85, "MO": 0.92, "MT": 0.92, "NE": 0.90,
  "NV": 1.00, "NH": 1.05, "NJ": 1.10, "NM": 0.90, "ND": 0.90,
  "OH": 0.95, "OK": 0.88, "RI": 1.05, "SC": 0.92, "SD": 0.88,
  "VT": 1.00, "VA": 1.05, "WV": 0.85, "WI": 0.95, "WY": 0.90
};

/**
 * Parse location string to extract city, state, and pricing multiplier
 * @param {string} locationText - User's location input
 * @returns {object} - Parsed location data with multiplier
 */
export function parseLocation(locationText) {
  if (!locationText || typeof locationText !== 'string') {
    return {
      city: null,
      state: null,
      metro: null,
      multiplier: 1.00,
      demand: "medium",
      confidence: "low"
    };
  }

  const text = locationText.toLowerCase().trim();

  // Try to extract ZIP code first (most accurate)
  const zipMatch = text.match(/\b(\d{5})\b/);
  if (zipMatch) {
    const zipData = locationDatabase[zipMatch[1]];
    if (zipData) {
      return {
        ...zipData,
        zipCode: zipMatch[1],
        confidence: "high"
      };
    }
  }

  // Try to match city name
  for (const [cityName, cityData] of Object.entries(cityMappings)) {
    if (text.includes(cityName)) {
      return {
        city: cityName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        ...cityData,
        confidence: "medium"
      };
    }
  }

  // Try to match state abbreviation or name
  const stateMatch = text.match(/\b([A-Z]{2})\b/);
  if (stateMatch && stateMultipliers[stateMatch[1]]) {
    return {
      city: null,
      state: stateMatch[1],
      metro: null,
      multiplier: stateMultipliers[stateMatch[1]],
      demand: "medium",
      confidence: "low"
    };
  }

  // No match found - use baseline
  return {
    city: null,
    state: null,
    metro: null,
    multiplier: 1.00,
    demand: "medium",
    confidence: "low"
  };
}

/**
 * Get location description for display to user
 * @param {object} locationData - Parsed location data
 * @returns {string} - Human-readable location description
 */
export function getLocationDescription(locationData) {
  if (locationData.city && locationData.state) {
    return `${locationData.city}, ${locationData.state}`;
  } else if (locationData.state) {
    return locationData.state;
  } else if (locationData.metro) {
    return locationData.metro;
  }
  return "General Market";
}

/**
 * Get pricing insight message based on location
 * @param {object} locationData - Parsed location data
 * @returns {string} - Message explaining regional pricing
 */
export function getLocationPricingInsight(locationData) {
  const multiplier = locationData.multiplier;
  const location = getLocationDescription(locationData);

  if (multiplier >= 1.20) {
    return `${location} is a premium market. Prices typically 20-30% higher than national average.`;
  } else if (multiplier >= 1.10) {
    return `${location} has above-average demand. Prices run 10-20% higher than typical markets.`;
  } else if (multiplier >= 1.00) {
    return `${location} has average market conditions. Standard pricing applies.`;
  } else {
    return `${location} is a value market. Prices tend to be 10-15% below major metros.`;
  }
}
