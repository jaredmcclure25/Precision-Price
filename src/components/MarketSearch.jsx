/**
 * MarketSearch Component
 * Search bar for finding market data by item type and location
 */

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { searchMarketItems, saveUserLocation } from '../lib/firestore';
import { useAuth } from '../AuthContext';

const MarketSearch = ({
  defaultZipCode = '',
  defaultRadius = 25,
  onSearch,
  onZipChange
}) => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [zipCode, setZipCode] = useState(defaultZipCode);
  const [radius, setRadius] = useState(defaultRadius);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (defaultZipCode) {
      setZipCode(defaultZipCode);
    }
  }, [defaultZipCode]);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!zipCode || zipCode.length !== 5) {
      return;
    }

    setLoading(true);
    try {
      // Save ZIP preference if logged in
      if (currentUser && zipCode !== defaultZipCode) {
        await saveUserLocation(currentUser.uid, zipCode, radius);
        if (onZipChange) onZipChange(zipCode, radius);
      }

      if (searchQuery.trim()) {
        const data = await searchMarketItems(searchQuery, zipCode, radius);
        setResults(data);
        setShowResults(true);
        if (onSearch) onSearch(data, searchQuery, zipCode);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleZipChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setZipCode(value);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items (e.g., iPhone, couch, PS5)..."
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-base"
          />
        </div>

        {/* ZIP Code */}
        <div className="w-full sm:w-28">
          <input
            type="text"
            value={zipCode}
            onChange={handleZipChange}
            placeholder="ZIP"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-center text-base"
          />
        </div>

        {/* Radius Dropdown */}
        <div className="w-full sm:w-32">
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-base bg-white"
          >
            <option value={5}>5 miles</option>
            <option value={10}>10 miles</option>
            <option value={25}>25 miles</option>
            <option value={50}>50 miles</option>
          </select>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          disabled={loading || !zipCode || zipCode.length !== 5}
          className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Search Results */}
      {showResults && results && (
        <div className="mt-4">
          {results.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No results found for "{searchQuery}" in {zipCode}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                Found {results.length} matching {results.length === 1 ? 'category' : 'categories'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{item.category}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.confidence === 'high' ? 'bg-green-100 text-green-800' :
                        item.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.confidence}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-indigo-600 mb-2">
                      {formatPrice(item.avgSoldPrice)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="text-gray-400">Sold:</span> {item.soldListings}
                      </div>
                      <div>
                        <span className="text-gray-400">Avg days:</span> {Math.round(item.avgDaysToSell)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowResults(false)}
                className="text-sm text-indigo-600 hover:underline"
              >
                Close results
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarketSearch;
