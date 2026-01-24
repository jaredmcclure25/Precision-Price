/**
 * GuidedResultsDisplay Component
 * Progressive reveal results with step-by-step guidance
 * Flow: Analyze → Pick Price → Track → Create Listing Page → Celebration
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  TrendingUp, Search, CheckCircle, Share2, Package, Loader2,
  Sparkles, Copy, ExternalLink, Clock, Tag, MapPin
} from 'lucide-react';
import GuidedFlowStepper from './GuidedFlowStepper';
import BullseyePriceTarget from './BullseyePriceTarget';
import TransactionOutcome from './TransactionOutcome';
import useGuidedFlow from '../hooks/useGuidedFlow';
import { saveListing, formatForFacebookMarketplace } from '../listingStorage';

export default function GuidedResultsDisplay({
  result,
  resultsRef,
  onNewAnalysis,
  currentListingId,
  handleFeedbackSubmit,
  userProfile,
  images,
  itemDetails,
  currentUser,
  selectedTier,
  setSelectedTier,
  trackingListing,
  handleTrackListing,
  onViewListingHistory,
}) {
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [trackSuccess, setTrackSuccess] = useState(false);

  // Listing page state
  const [creatingListing, setCreatingListing] = useState(false);
  const [listingData, setListingData] = useState(null);
  const [listingUrl, setListingUrl] = useState(null);
  const [copied, setCopied] = useState(null);

  // Guided flow state
  const {
    currentStep,
    completedSteps,
    completeStep,
    goToStep,
    isStepVisible,
    isStepActive,
    registerStepRef,
  } = useGuidedFlow('pick-price');

  // Refs for each step section
  const pickPriceRef = useRef(null);
  const trackRef = useRef(null);
  const shareRef = useRef(null);

  // Register refs
  useEffect(() => {
    registerStepRef('pick-price', pickPriceRef);
    registerStepRef('track', trackRef);
    registerStepRef('share', shareRef);
  }, [registerStepRef]);

  // Auto-advance when tier is selected
  useEffect(() => {
    if (selectedTier && !completedSteps.includes('pick-price')) {
      setTimeout(() => {
        completeStep('pick-price', { tier: selectedTier });
      }, 500);
    }
  }, [selectedTier, completedSteps, completeStep]);

  // Get price based on tier
  const getSelectedPrice = () => {
    if (selectedTier === 'quick') return result.suggestedPriceRange.min;
    if (selectedTier === 'premium') return result.suggestedPriceRange.max;
    return result.suggestedPriceRange.optimal;
  };

  // Handle track listing - stay in flow
  const handleTrackAndAdvance = async () => {
    const trackResult = await handleTrackListing();
    if (trackResult?.success) {
      setTrackSuccess(true);
      completeStep('track', { tracked: true, isGuest: trackResult.isGuest });
    }
  };

  // Create listing page inline
  const handleCreateListingPage = async () => {
    try {
      setCreatingListing(true);

      const imageUrls = images?.map(img => img.preview || img) || [];
      const displayPrice = getSelectedPrice();
      const effectiveTier = selectedTier || 'recommended';

      const listingPayload = {
        itemIdentification: result.itemIdentification,
        pricingStrategy: {
          ...result.pricingStrategy,
          listingPrice: displayPrice,
          displayTier: effectiveTier,
        },
        marketInsights: result.marketInsights,
        suggestedPriceRange: {
          min: displayPrice,
          max: displayPrice,
          optimal: displayPrice,
          selectedTier: effectiveTier,
          _originalMin: result.suggestedPriceRange.min,
          _originalMax: result.suggestedPriceRange.max,
          _originalOptimal: result.suggestedPriceRange.optimal,
        },
        optimizationTips: result.optimizationTips,
        comparableItems: result.comparableItems,
        images: imageUrls,
        location: itemDetails?.location || '',
        additionalDetails: itemDetails?.additionalDetails || '',
        condition: itemDetails?.condition || 'good',
        selectedTier: effectiveTier,
      };

      const listingId = await saveListing(listingPayload, currentUser?.uid || 'guest');
      const url = `${window.location.origin}/item/${listingId}`;

      setListingUrl(url);
      setListingData({
        ...listingPayload,
        id: listingId,
        fbData: formatForFacebookMarketplace(listingPayload)
      });

      completeStep('share', { created: true, listingId });
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Failed to create listing page. Please try again.');
    } finally {
      setCreatingListing(false);
    }
  };

  // Copy helpers
  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyAllForFacebook = () => {
    if (!listingData?.fbData) return;
    const fb = listingData.fbData;
    const allText = `Title: ${fb.title}\n\nPrice: $${fb.price}\n\nDescription:\n${fb.description}\n\nCategory: ${fb.category}\nCondition: ${fb.condition}`;
    copyToClipboard(allText, 'all');
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${result.itemIdentification.name} - Precision Prices`,
          text: `Check out this ${result.itemIdentification.name} priced at $${Math.round(getSelectedPrice())}!`,
          url: listingUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard(listingUrl, 'link');
        }
      }
    } else {
      copyToClipboard(listingUrl, 'link');
    }
  };

  const isFlowComplete = completedSteps.includes('share');

  return (
    <div className="space-y-6">
      {/* Progress Stepper */}
      <GuidedFlowStepper
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={goToStep}
      />

      {/* Step 1: Item Analysis (always visible) */}
      <div ref={resultsRef} className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-full p-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Item Analysis</h2>
          </div>
          <button
            type="button"
            onClick={onNewAnalysis}
            className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg"
          >
            <Search className="w-4 h-4" />New Analysis
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Identified As</p>
            <p className="text-lg font-semibold">{result.itemIdentification.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Category</p>
            <p className="text-lg font-semibold">{result.itemIdentification.category}</p>
          </div>
        </div>
        {result.imageAnalysis && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Image Analysis</p>
            <p className="text-blue-800">{result.imageAnalysis}</p>
          </div>
        )}
      </div>

      {/* Step 2: Pick Price */}
      <div
        ref={pickPriceRef}
        className={`bg-white rounded-2xl shadow-xl p-8 transition-all duration-500 ${
          isStepActive('pick-price') ? 'ring-4 ring-indigo-300 ring-offset-2' : ''
        }`}
      >
        <div className="flex items-center gap-2 mb-6">
          {completedSteps.includes('pick-price') ? (
            <div className="bg-green-100 rounded-full p-1.5">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          ) : (
            <div className="bg-indigo-100 rounded-full p-1.5">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
          )}
          <TrendingUp className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-bold">Pick Your Price</h2>
          {isStepActive('pick-price') && (
            <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
              Your turn!
            </span>
          )}
        </div>

        <BullseyePriceTarget
          min={result.suggestedPriceRange.min}
          max={result.suggestedPriceRange.max}
          optimal={result.suggestedPriceRange.optimal}
          confidence={result.confidenceScore || 70}
          locationData={result.locationData}
          dataCount={result.dataCount || 0}
          selectedTier={selectedTier}
          onTierSelect={setSelectedTier}
        />
      </div>

      {/* Step 3: Track Listing */}
      {isStepVisible('track') && (
        <div
          ref={trackRef}
          className={`rounded-2xl shadow-xl p-6 transition-all duration-500 ${
            isStepActive('track')
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white ring-4 ring-indigo-300 ring-offset-2'
              : completedSteps.includes('track')
              ? 'bg-green-50 border-2 border-green-200'
              : 'bg-gray-50 border-2 border-gray-200'
          }`}
        >
          {completedSteps.includes('track') ? (
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="text-lg font-bold text-green-800">Listing Tracked!</h3>
                <p className="text-sm text-green-600">
                  {trackSuccess ? "Your item is now being monitored." : "We'll help you monitor this item."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                      Step 3
                    </span>
                    <h3 className="text-xl font-bold text-white">
                      Track This Listing
                    </h3>
                  </div>
                  <p className="text-indigo-100">
                    Your selected price:{' '}
                    <span className="font-bold text-2xl">${getSelectedPrice()}</span>
                    <span className="text-sm ml-2">
                      ({selectedTier === 'quick' ? 'Quick Sale' : selectedTier === 'recommended' ? 'Recommended' : 'Premium'})
                    </span>
                  </p>
                </div>
                <button
                  onClick={handleTrackAndAdvance}
                  disabled={trackingListing}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition shadow-lg"
                >
                  {trackingListing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Package className="w-5 h-5" />
                      Track This Listing
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm mt-3 text-indigo-200">
                Track your listing to help improve our AI and see how your item performs!
              </p>
            </>
          )}
        </div>
      )}

      {/* Step 4: Create Listing Page (Inline) */}
      {isStepVisible('share') && (
        <div
          ref={shareRef}
          className={`bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-500 ${
            isStepActive('share') ? 'ring-4 ring-indigo-300 ring-offset-2' : ''
          }`}
        >
          {/* Header */}
          <div className={`px-6 py-4 ${
            completedSteps.includes('share')
              ? 'bg-green-50'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600'
          }`}>
            <div className="flex items-center gap-3">
              {completedSteps.includes('share') ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-bold text-green-800">Listing Page Created!</h3>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                  <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">Step 4</span>
                  <h3 className="text-lg font-bold text-white">Create Your Listing Page</h3>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!listingData ? (
              // Before creation - show create button
              <div className="text-center py-6">
                <p className="text-gray-600 mb-4">
                  Create a shareable listing page with all your item details, optimized for Facebook Marketplace.
                </p>
                <button
                  onClick={handleCreateListingPage}
                  disabled={creatingListing}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition shadow-lg text-lg"
                >
                  {creatingListing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-6 h-6" />
                      Create Listing Page
                    </>
                  )}
                </button>
              </div>
            ) : (
              // After creation - show inline preview
              <div className="space-y-6">
                {/* Listing URL */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-sm font-medium text-gray-700 block mb-2">Your Listing URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={listingUrl}
                      readOnly
                      className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(listingUrl, 'link')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      {copied === 'link' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span className="hidden sm:inline">{copied === 'link' ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={shareLink}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                  </div>
                </div>

                {/* Listing Preview */}
                <div className="border rounded-xl overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b">
                    <span className="text-sm font-medium text-gray-600">Facebook Marketplace Preview</span>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Title */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 uppercase tracking-wide">Title</label>
                        <p className="font-semibold text-lg">{listingData.fbData?.title}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(listingData.fbData?.title, 'title')}
                        className="text-gray-400 hover:text-blue-600 p-1"
                      >
                        {copied === 'title' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-green-600" />
                        <span className="text-2xl font-bold text-green-600">${listingData.fbData?.price}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{listingData.fbData?.condition}</span>
                      </div>
                      {itemDetails?.location && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{itemDetails.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 uppercase tracking-wide">Description</label>
                        <p className="text-gray-700 whitespace-pre-line text-sm mt-1">{listingData.fbData?.description}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(listingData.fbData?.description, 'desc')}
                        className="text-gray-400 hover:text-blue-600 p-1 flex-shrink-0"
                      >
                        {copied === 'desc' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={copyAllForFacebook}
                    className="flex-1 min-w-[140px] px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 font-medium"
                  >
                    {copied === 'all' ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied === 'all' ? 'Copied All!' : 'Copy All'}
                  </button>
                  <button
                    onClick={() => window.open(listingUrl, '_blank')}
                    className="flex-1 min-w-[140px] px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2 font-medium"
                  >
                    <ExternalLink className="w-5 h-5" />
                    View Full Page
                  </button>
                  <button
                    onClick={() => window.open('https://www.facebook.com/marketplace/create/item', '_blank')}
                    className="flex-1 min-w-[140px] px-4 py-3 bg-[#1877f2] text-white rounded-lg hover:bg-[#166fe5] transition flex items-center justify-center gap-2 font-medium"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Post to FB
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completion Celebration */}
      {isFlowComplete && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 text-white text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-2xl font-bold mb-2">You're All Set!</h3>
          <p className="text-green-100 mb-6 max-w-md mx-auto">
            Your listing is tracked and ready to share. When you sell it, come back to report the sale so we can improve our pricing accuracy!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={() => setShowTransactionModal(true)}
              className="bg-white text-green-600 font-bold px-6 py-3 rounded-lg hover:bg-green-50 transition flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Report a Sale
            </button>
            <button
              type="button"
              onClick={onViewListingHistory}
              className="bg-green-700 text-white font-bold px-6 py-3 rounded-lg hover:bg-green-800 transition flex items-center gap-2"
            >
              <Package className="w-5 h-5" />
              View Listing History
            </button>
            <button
              type="button"
              onClick={onNewAnalysis}
              className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg hover:bg-white/10 transition"
            >
              Analyze Another Item
            </button>
          </div>
        </div>
      )}

      {/* Transaction Outcome Modal */}
      {showTransactionModal && currentListingId && (
        <TransactionOutcome
          listingId={currentListingId}
          suggestedPrice={result.suggestedPriceRange.optimal}
          onSubmit={async (outcomeData) => {
            const submitResult = await handleFeedbackSubmit(outcomeData, userProfile);
            if (submitResult?.success) {
              setShowTransactionModal(false);
            }
          }}
          onClose={() => setShowTransactionModal(false)}
        />
      )}
    </div>
  );
}
