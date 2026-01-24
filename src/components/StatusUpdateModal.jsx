/**
 * StatusUpdateModal Component
 * Modal for updating listing status (sold/removed)
 */

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuthAdapter';
import { updateListingStatus } from '../lib/firestore';

export const StatusUpdateModal = ({ listing, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [soldPrice, setSoldPrice] = useState(listing.askingPrice.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !status) return;

    if (status === 'sold' && (!soldPrice || parseFloat(soldPrice) <= 0)) {
      setError('Please enter the final sale price');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await updateListingStatus(
        user.uid,
        listing.id,
        status,
        status === 'sold' ? parseFloat(soldPrice) : undefined
      );
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const daysListed = Math.floor(
    (Date.now() - listing.datePosted.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Update Listing Status</h2>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-1">{listing.title}</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Asking Price: ${listing.askingPrice.toFixed(2)}</div>
            <div>Listed: {daysListed} days ago</div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              What happened with this listing?
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setStatus('sold')}
                className={`w-full p-4 rounded-lg border-2 text-left transition ${
                  status === 'sold'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      status === 'sold' ? 'border-green-500' : 'border-gray-300'
                    }`}
                  >
                    {status === 'sold' && (
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">It Sold!</div>
                    <div className="text-sm text-gray-600">
                      Congrats! Help others by sharing the final price
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatus('removed')}
                className={`w-full p-4 rounded-lg border-2 text-left transition ${
                  status === 'removed'
                    ? 'border-gray-500 bg-gray-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      status === 'removed' ? 'border-gray-500' : 'border-gray-300'
                    }`}
                  >
                    {status === 'removed' && (
                      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Removed Listing</div>
                    <div className="text-sm text-gray-600">
                      Decided not to sell or moved to another platform
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Sold Price Input */}
          {status === 'sold' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Final Sale Price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500">$</span>
                <input
                  type="number"
                  value={soldPrice}
                  onChange={(e) => setSoldPrice(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  autoFocus
                />
              </div>
              {parseFloat(soldPrice) !== listing.askingPrice && (
                <p className="text-sm text-gray-600 mt-2">
                  {parseFloat(soldPrice) > listing.askingPrice ? (
                    <span className="text-green-600">
                      Sold for ${(parseFloat(soldPrice) - listing.askingPrice).toFixed(2)} more than asking!
                    </span>
                  ) : (
                    <span className="text-orange-600">
                      Sold for ${(listing.askingPrice - parseFloat(soldPrice)).toFixed(2)} less than asking
                    </span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !status}
              className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>

        {status === 'sold' && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Thanks for contributing!</strong> Your sale data helps everyone in your
              area get better pricing insights.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusUpdateModal;
