/**
 * Dashboard Component
 * User dashboard for managing listings and viewing stats
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuthAdapter';
import { getUserListings } from '../lib/firestore';
import { AddListingForm } from './AddListingForm';
import { StatusUpdateModal } from './StatusUpdateModal';

export const Dashboard = () => {
  const { user, userProfile, signOut } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadListings();
  }, [user, filter]);

  const loadListings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await getUserListings(
        user.uid,
        filter === 'all' ? undefined : filter
      );
      setListings(data);
    } catch (error) {
      console.error('Failed to load listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getDaysListed = (listing) => {
    const end = listing.dateSold || listing.dateRemoved || new Date();
    const start = listing.datePosted;
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getTierBadge = (tier) => {
    const tiers = {
      bronze: { color: 'bg-orange-100 text-orange-800', emoji: '' },
      silver: { color: 'bg-gray-100 text-gray-800', emoji: '' },
      gold: { color: 'bg-yellow-100 text-yellow-800', emoji: '' },
      platinum: { color: 'bg-purple-100 text-purple-800', emoji: '' },
    };
    return tiers[tier] || tiers.bronze;
  };

  const getStatusBadge = (status) => {
    const statuses = {
      active: 'bg-green-100 text-green-800',
      sold: 'bg-blue-100 text-blue-800',
      removed: 'bg-gray-100 text-gray-800',
    };
    return statuses[status];
  };

  const activeListings = listings.filter((l) => l.status === 'active');
  const soldListings = listings.filter((l) => l.status === 'sold');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">PrecisionPrices</h1>
              {userProfile && (
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      getTierBadge(userProfile.tier).color
                    }`}
                  >
                    {getTierBadge(userProfile.tier).emoji} {(userProfile.tier || 'bronze').toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              {user?.photoURL && (
                <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full" />
              )}
              <span className="text-gray-700">{user?.displayName}</span>
              <button
                onClick={signOut}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Total Listings</div>
            <div className="text-3xl font-bold text-gray-900">
              {userProfile?.listingsAdded || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Active</div>
            <div className="text-3xl font-bold text-green-600">{activeListings.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Sold</div>
            <div className="text-3xl font-bold text-blue-600">{soldListings.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Avg Days to Sell</div>
            <div className="text-3xl font-bold text-indigo-600">
              {soldListings.length > 0
                ? Math.round(
                    soldListings.reduce((sum, l) => sum + (l.daysToSell || 0), 0) /
                      soldListings.length
                  )
                : '-'}
            </div>
          </div>
        </div>

        {/* Tier Progress */}
        {userProfile && userProfile.tier !== 'platinum' && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow p-6 mb-8 border-2 border-indigo-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Progress to Next Tier
            </h3>
            <div className="space-y-2">
              {userProfile.tier === 'bronze' && (
                <p className="text-gray-700">
                  Add <strong>{3 - (userProfile.listingsAdded || 0)}</strong> more listings to
                  reach Silver tier and unlock 30-day market trends!
                </p>
              )}
              {userProfile.tier === 'silver' && (
                <p className="text-gray-700">
                  Add <strong>{10 - (userProfile.listingsAdded || 0)}</strong> more listings and
                  keep updating their status to reach Gold tier!
                </p>
              )}
              {userProfile.tier === 'gold' && (
                <p className="text-gray-700">
                  Add <strong>{25 - (userProfile.listingsAdded || 0)}</strong> more quality
                  listings to reach Platinum tier and unlock API access!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Add Listing Button */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All ({listings.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'active'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Active ({activeListings.length})
            </button>
            <button
              onClick={() => setFilter('sold')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'sold'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Sold ({soldListings.length})
            </button>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-md"
          >
            + Add Listing
          </button>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-gray-600 mt-4">Loading your listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">&#128230;</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No listings yet</h3>
            <p className="text-gray-600 mb-6">
              Add your first listing to start tracking prices and getting market insights!
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
              Add Your First Listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 border-2 border-gray-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {listing.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(
                      listing.status
                    )}`}
                  >
                    {listing.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-medium text-gray-900">{listing.category}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Asking Price:</span>
                    <span className="font-semibold text-indigo-600">
                      {formatPrice(listing.askingPrice)}
                    </span>
                  </div>
                  {listing.soldPrice && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Sold Price:</span>
                      <span className="font-semibold text-green-600">
                        {formatPrice(listing.soldPrice)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Posted:</span>
                    <span className="text-gray-900">{formatDate(listing.datePosted)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Days Listed:</span>
                    <span className="text-gray-900">{getDaysListed(listing)} days</span>
                  </div>
                </div>

                {listing.status === 'active' && (
                  <button
                    onClick={() => setSelectedListing(listing)}
                    className="w-full py-2 bg-indigo-50 text-indigo-600 font-medium rounded-lg hover:bg-indigo-100 transition"
                  >
                    Update Status
                  </button>
                )}

                {listing.marketplace && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500">Listed on {listing.marketplace}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddForm && (
        <AddListingForm
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            loadListings();
          }}
        />
      )}

      {selectedListing && (
        <StatusUpdateModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onSuccess={() => {
            setSelectedListing(null);
            loadListings();
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
