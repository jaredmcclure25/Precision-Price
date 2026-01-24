/**
 * Precision Prices - Facebook Marketplace Integration Button
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import React, { useState } from 'react';
import { ExternalLink, Copy, CheckCircle, Share2, Loader2 } from 'lucide-react';
import { saveListing, formatForFacebookMarketplace } from '../listingStorage';

export default function FacebookMarketplaceButton({ analysisResult, images, itemDetails, userId, selectedTier = null }) {
  const [saving, setSaving] = useState(false);
  const [listingUrl, setListingUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  // Get the display price based on selected tier
  const getDisplayPrice = () => {
    if (selectedTier === 'quick') return analysisResult.suggestedPriceRange.min;
    if (selectedTier === 'premium') return analysisResult.suggestedPriceRange.max;
    return analysisResult.suggestedPriceRange.optimal; // Default to recommended
  };

  const handleCreateListing = async () => {
    try {
      setSaving(true);

      // Extract base64 preview strings from image objects
      // Images are stored as { file: File, preview: base64String }
      const imageUrls = images?.map(img => img.preview || img) || [];

      // Get the selected price for the listing
      const displayPrice = getDisplayPrice();

      // Prepare listing data - only show selected price if tier was selected
      const listingData = {
        itemIdentification: analysisResult.itemIdentification,
        pricingStrategy: selectedTier ? {
          ...analysisResult.pricingStrategy,
          listingPrice: displayPrice,
          displayTier: selectedTier,
        } : analysisResult.pricingStrategy,
        marketInsights: analysisResult.marketInsights,
        suggestedPriceRange: selectedTier ? {
          // When tier is selected, only show the selected price publicly
          min: displayPrice,
          max: displayPrice,
          optimal: displayPrice,
          selectedTier: selectedTier,
          // Keep original for reference
          _originalMin: analysisResult.suggestedPriceRange.min,
          _originalMax: analysisResult.suggestedPriceRange.max,
          _originalOptimal: analysisResult.suggestedPriceRange.optimal,
        } : analysisResult.suggestedPriceRange,
        optimizationTips: analysisResult.optimizationTips,
        comparableItems: analysisResult.comparableItems,
        images: imageUrls,
        location: itemDetails?.location || '',
        additionalDetails: itemDetails?.additionalDetails || '',
        condition: itemDetails?.condition || 'good',
        selectedTier: selectedTier,
      };

      // Save to Firebase
      const listingId = await saveListing(listingData, userId);

      // Generate shareable URL
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/item/${listingId}`;
      setListingUrl(url);

      setSaving(false);
    } catch (error) {
      console.error('Error creating listing:', error);
      setSaving(false);
      alert('Failed to create shareable listing. Please try again.');
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(listingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        const sharePrice = getDisplayPrice();
        await navigator.share({
          title: `${analysisResult.itemIdentification.name} - Precision Prices`,
          text: `Check out this ${analysisResult.itemIdentification.name} priced at $${Math.round(sharePrice)}!`,
          url: listingUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      copyLink();
    }
  };

  const openListingPage = () => {
    window.open(listingUrl, '_blank');
  };

  // If listing URL exists, show share options
  if (listingUrl) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-bold text-gray-900">Shareable Listing Created!</h3>
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 block mb-2">Your Listing URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={listingUrl}
              readOnly
              className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={copyLink}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={openListingPage}
            className="px-4 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2 font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Page</span>
          </button>

          <button
            onClick={shareLink}
            className="px-4 py-3 bg-white border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition flex items-center justify-center gap-2 font-medium"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>

          <button
            onClick={() => window.open('https://www.facebook.com/marketplace/create/item', '_blank')}
            className="px-4 py-3 bg-[#1877f2] text-white rounded-lg hover:bg-[#166fe5] transition flex items-center justify-center gap-2 font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Post to FB</span>
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-100 rounded-lg text-sm text-gray-700">
          <p className="font-medium mb-1">Next Steps:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click "View Page" to see your shareable listing</li>
            <li>Use "Copy All" on the listing page</li>
            <li>Click "Post to FB" and paste your content</li>
          </ol>
        </div>
      </div>
    );
  }

  // Initial state - show create listing button
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h3 className="text-xl font-bold mb-1">Ready to Post on Facebook Marketplace?</h3>
          <p className="text-blue-100 text-sm">
            Create a shareable listing with optimized copy & pricing
          </p>
        </div>

        <button
          onClick={handleCreateListing}
          disabled={saving}
          className="px-6 py-3 bg-white text-blue-600 rounded-lg font-bold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Creating...</span>
            </>
          ) : (
            <>
              <ExternalLink className="w-5 h-5" />
              <span>Create Listing Page</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-blue-400 text-sm text-blue-100">
        <p className="mb-2">What you'll get:</p>
        <ul className="space-y-1">
          <li>✓ Shareable link with your item details</li>
          <li>✓ Pre-formatted title, description, and pricing</li>
          <li>✓ One-click copy for Facebook Marketplace</li>
          <li>✓ Track views and shares</li>
        </ul>
      </div>
    </div>
  );
}
