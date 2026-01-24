/**
 * AddListingForm Component
 * Modal form for adding new listings
 */

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuthAdapter';
import { addListing } from '../lib/firestore';
import { CATEGORIES } from '../types';

export const AddListingForm = ({ onClose, onSuccess }) => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    askingPrice: '',
    zipCode: userProfile?.defaultZipCode || '',
    condition: 'good',
    marketplace: '',
    listingUrl: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) return;

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.category) {
      setError('Category is required');
      return;
    }
    if (!formData.askingPrice || parseFloat(formData.askingPrice) <= 0) {
      setError('Valid price is required');
      return;
    }
    if (!formData.zipCode || formData.zipCode.length !== 5) {
      setError('Valid 5-digit ZIP code is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addListing(user.uid, {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim() || undefined,
        askingPrice: parseFloat(formData.askingPrice),
        zipCode: formData.zipCode,
        condition: formData.condition,
        marketplace: formData.marketplace || undefined,
        listingUrl: formData.listingUrl.trim() || undefined,
      });

      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to add listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Add Listing</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
          >
            x
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Item Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., iPhone 13 Pro 128GB"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              maxLength={100}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Price & ZIP */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Asking Price *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.askingPrice}
                  onChange={(e) => setFormData({ ...formData, askingPrice: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ZIP Code *
              </label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    zipCode: e.target.value.replace(/\D/g, '').slice(0, 5),
                  })
                }
                placeholder="37040"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Condition *
            </label>
            <div className="grid grid-cols-5 gap-2">
              {['new', 'like-new', 'good', 'fair', 'poor'].map((condition) => (
                <button
                  key={condition}
                  type="button"
                  onClick={() => setFormData({ ...formData, condition })}
                  className={`py-2 px-3 rounded-lg font-medium text-sm transition ${
                    formData.condition === condition
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {condition.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add any additional details..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none resize-none"
              maxLength={500}
            />
          </div>

          {/* Marketplace */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Where is it listed? (Optional)
            </label>
            <select
              value={formData.marketplace}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  marketplace: e.target.value,
                })
              }
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Select marketplace</option>
              <option value="facebook">Facebook Marketplace</option>
              <option value="offerup">OfferUp</option>
              <option value="craigslist">Craigslist</option>
              <option value="mercari">Mercari</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Listing URL */}
          {formData.marketplace && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Listing URL (Optional)
              </label>
              <input
                type="url"
                value={formData.listingUrl}
                onChange={(e) => setFormData({ ...formData, listingUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              />
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
              disabled={loading}
              className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Adding...' : 'Add Listing'}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> We'll remind you in 7 days to update the status. The more you
            update, the better insights you get!
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddListingForm;
