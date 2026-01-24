/**
 * Precision Prices - Individual Listing Page
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, Package, MapPin, Eye, Share2, ExternalLink, Copy, CheckCircle, Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import { getListing, formatForFacebookMarketplace, incrementShareCount } from '../listingStorage';

export default function ListingPage() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copyField, setCopyField] = useState(null);

  useEffect(() => {
    loadListing();
    updateMetaTags();
  }, [listingId]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const data = await getListing(listingId);

      if (!data) {
        setError('Listing not found');
        setLoading(false);
        return;
      }

      setListing(data);
      setLoading(false);

      // Update meta tags with actual listing data
      updateMetaTags(data);
    } catch (err) {
      console.error('Error loading listing:', err);
      setError('Failed to load listing');
      setLoading(false);
    }
  };

  const updateMetaTags = (listingData = null) => {
    if (!listingData) return;

    const { itemIdentification, pricingStrategy } = listingData;
    const title = `${itemIdentification?.name || 'Item'} - $${Math.round(pricingStrategy?.listingPrice || 0)} | Precision Prices`;
    const description = `AI-priced ${itemIdentification?.condition || ''} ${itemIdentification?.name || 'item'} for sale. Optimal price: $${Math.round(pricingStrategy?.listingPrice || 0)}. Powered by Precision Prices AI.`;
    const url = window.location.href;

    // Update document title
    document.title = title;

    // Update or create meta tags
    updateMetaTag('description', description);
    updateMetaTag('og:title', title, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:url', url, 'property');
    updateMetaTag('og:type', 'product', 'property');
    updateMetaTag('og:image', listingData.images?.[0] || 'https://precisionprices.com/og-default.jpg', 'property');
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', listingData.images?.[0] || 'https://precisionprices.com/og-default.jpg');

    // Product-specific Open Graph tags
    updateMetaTag('product:price:amount', pricingStrategy?.listingPrice || 0, 'property');
    updateMetaTag('product:price:currency', 'USD', 'property');
    updateMetaTag('product:condition', itemIdentification?.observedCondition || 'used', 'property');
  };

  const updateMetaTag = (name, content, attribute = 'name') => {
    let element = document.querySelector(`meta[${attribute}="${name}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, name);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyField(field);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setCopyField(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyAllForFacebook = async () => {
    if (!listing) return;

    const fbData = formatForFacebookMarketplace(listing);
    const allText = `Title: ${fbData.title}\n\nPrice: $${fbData.price}\n\nDescription:\n${fbData.description}\n\nCategory: ${fbData.category}\nCondition: ${fbData.condition}`;

    await copyToClipboard(allText, 'all');
  };

  const openFacebookMarketplace = async () => {
    // Increment share count
    await incrementShareCount(listingId);

    // Open Facebook Marketplace in new tab
    window.open('https://www.facebook.com/marketplace/create/item', '_blank');
  };

  const handleShare = async () => {
    const url = window.location.href;

    await incrementShareCount(listingId);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${listing.itemIdentification.name} - Precision Prices`,
          text: `Check out this ${listing.itemIdentification.name} priced at $${Math.round(listing.pricingStrategy.listingPrice)} using AI!`,
          url: url,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      // Fallback: copy link
      await copyToClipboard(url, 'share');
    }
  };

  // Navigate back to analysis with listing data to enable feedback
  const handleBackToAnalysis = () => {
    navigate('/', {
      state: {
        returnFromListing: true,
        listingId: listingId,
        listingData: listing
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This listing doesn\'t exist or has been removed.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const fbData = formatForFacebookMarketplace(listing);
  const { itemIdentification, pricingStrategy, marketInsights, optimizationTips } = listing;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
          >
            ← Back to Precision Prices
          </button>
          <div className="flex items-center gap-3">
            {/* Back to Analysis button - allows providing feedback */}
            <button
              onClick={handleBackToAnalysis}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 transition"
              title="Return to your analysis to provide feedback"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Give Feedback</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Item Details */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {itemIdentification.name}
            </h1>

            {/* Images */}
            {listing.images && listing.images.length > 0 && (
              <div className="mb-6 grid grid-cols-2 gap-2">
                {listing.images.slice(0, 4).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${itemIdentification.name} ${idx + 1}`}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            {/* Item Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-gray-700">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Condition:</span>
                <span className="capitalize">{itemIdentification.observedCondition}</span>
              </div>

              {itemIdentification.brand && (
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-medium">Brand:</span>
                  <span>{itemIdentification.brand}</span>
                </div>
              )}

              {itemIdentification.category && (
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-medium">Category:</span>
                  <span>{itemIdentification.category}</span>
                </div>
              )}

              {listing.location && (
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>{listing.location}</span>
                </div>
              )}
            </div>

            {/* Precision Prices */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Precision Prices</h2>
              </div>

              <div className="text-center">
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  ${Math.round(pricingStrategy.listingPrice)}
                </div>
                <div className="text-sm text-gray-600">Optimal Listing Price</div>
              </div>
            </div>

            {/* Market Insights */}
            {marketInsights && (
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Market Insights
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Demand Level:</span>
                    <span className="font-medium capitalize">{marketInsights.demandLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Competition:</span>
                    <span className="font-medium capitalize">{marketInsights.competitionLevel}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{listing.viewCount || 0} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Share2 className="w-4 h-4" />
                <span>{listing.shareCount || 0} shares</span>
              </div>
            </div>
          </div>

          {/* Right Column - Facebook Marketplace Post */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Post to Facebook Marketplace
              </h2>
              <p className="text-gray-600 text-sm">
                Copy the optimized listing details below and paste them into Facebook Marketplace.
              </p>
            </div>

            {/* Copy All Button */}
            <button
              onClick={copyAllForFacebook}
              className="w-full mb-6 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg flex items-center justify-center gap-2"
            >
              {copied && copyField === 'all' ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copy All</span>
                </>
              )}
            </button>

            {/* Individual Fields */}
            <div className="space-y-4 mb-6">
              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Title</label>
                  <button
                    onClick={() => copyToClipboard(fbData.title, 'title')}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {copied && copyField === 'title' ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  {fbData.title}
                </div>
              </div>

              {/* Price */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Price</label>
                  <button
                    onClick={() => copyToClipboard(fbData.price.toString(), 'price')}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {copied && copyField === 'price' ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-sm font-bold text-blue-600">
                  ${fbData.price}
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <button
                    onClick={() => copyToClipboard(fbData.description, 'description')}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {copied && copyField === 'description' ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {fbData.description}
                </div>
              </div>

              {/* Category & Condition */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Category</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    {fbData.category}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Condition</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm capitalize">
                    {fbData.condition.replace('_', ' ')}
                  </div>
                </div>
              </div>
            </div>

            {/* Open Facebook Marketplace Button */}
            <button
              onClick={openFacebookMarketplace}
              className="w-full px-6 py-4 bg-[#1877f2] text-white rounded-xl font-bold hover:bg-[#166fe5] transition shadow-lg flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Open Facebook Marketplace</span>
            </button>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
              <h4 className="font-bold mb-2">How to Post:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click "Copy All" or copy individual fields</li>
                <li>Click "Open Facebook Marketplace"</li>
                <li>Paste the copied content into each field</li>
                <li>Upload your photos</li>
                <li>Hit Publish!</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Optimization Tips */}
        {optimizationTips && optimizationTips.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Optimization Tips</h3>
            <ul className="space-y-2">
              {optimizationTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <div className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Want AI pricing for your items?</h3>
          <p className="mb-6 text-blue-100">
            Get instant, accurate pricing powered by advanced AI market analysis.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-white text-blue-600 rounded-lg font-bold hover:bg-gray-100 transition"
          >
            Try Precision Prices Free
          </button>
        </div>
      </div>
    </div>
  );
}
