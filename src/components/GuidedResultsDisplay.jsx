/**
 * GuidedResultsDisplay Component
 * Progressive reveal results with step-by-step guidance and micro-feedback
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  TrendingUp, Search, CheckCircle, Share2, Package, Loader2,
  ChevronDown, Sparkles, ArrowRight
} from 'lucide-react';
import GuidedFlowStepper from './GuidedFlowStepper';
import InlineStepFeedback from './InlineStepFeedback';
import BullseyePriceTarget from './BullseyePriceTarget';
import FacebookMarketplaceButton from './FacebookMarketplaceButton';
import MicroFeedback from './MicroFeedback';
import TransactionOutcome from './TransactionOutcome';
import useGuidedFlow from '../hooks/useGuidedFlow';

export default function GuidedResultsDisplay({
  result,
  showFeedback,
  feedbackSubmitted,
  submitFeedback,
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
}) {
  const [showShare, setShowShare] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [listingCreated, setListingCreated] = useState(false);

  // Guided flow state
  const {
    currentStep,
    completedSteps,
    completeStep,
    skipStep,
    goToStep,
    recordFeedback,
    isStepVisible,
    isStepActive,
    registerStepRef,
    getFlowData,
  } = useGuidedFlow('pick-price'); // Start at pick-price since analysis is done

  // Refs for each step section
  const pickPriceRef = useRef(null);
  const trackRef = useRef(null);
  const shareRef = useRef(null);
  const feedbackRef = useRef(null);

  // Register refs
  useEffect(() => {
    registerStepRef('pick-price', pickPriceRef);
    registerStepRef('track', trackRef);
    registerStepRef('share', shareRef);
    registerStepRef('feedback', feedbackRef);
  }, [registerStepRef]);

  // Auto-advance when tier is selected
  useEffect(() => {
    if (selectedTier && !completedSteps.includes('pick-price')) {
      // Delay slightly so user sees their selection
      setTimeout(() => {
        completeStep('pick-price', { tier: selectedTier });
      }, 500);
    }
  }, [selectedTier, completedSteps, completeStep]);

  // Handle track listing completion
  const handleTrackAndAdvance = async () => {
    await handleTrackListing();
    completeStep('track', { tracked: true });
  };

  // Handle listing created
  const handleListingCreated = () => {
    setListingCreated(true);
    completeStep('share', { created: true });
  };

  const shareSuccess = () => {
    const text = `I just priced my ${result.itemIdentification.name} at $${result.suggestedPriceRange.optimal} using Precision Prices! 🎯`;
    if (navigator.share) {
      navigator.share({ title: 'Precision Prices Success', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    }
  };

  // Get price based on tier
  const getSelectedPrice = () => {
    if (selectedTier === 'quick') return result.suggestedPriceRange.min;
    if (selectedTier === 'premium') return result.suggestedPriceRange.max;
    return result.suggestedPriceRange.optimal;
  };

  return (
    <div className="space-y-6">
      {/* Progress Stepper */}
      <GuidedFlowStepper
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={goToStep}
      />

      {/* Step 1: Item Analysis (always visible - analyze is complete) */}
      <div ref={resultsRef} className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-full p-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Item Analysis</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={onNewAnalysis}
              className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg"
            >
              <Search className="w-4 h-4" />New Analysis
            </button>
            <button
              type="button"
              onClick={() => setShowTransactionModal(true)}
              className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-purple-500 hover:bg-purple-600 text-white rounded-lg"
            >
              <CheckCircle className="w-4 h-4" />
              Report Sale
            </button>
          </div>
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

      {/* Step 2: Pick Price (always visible, highlighted when active) */}
      <div
        ref={pickPriceRef}
        className={`bg-white rounded-2xl shadow-xl p-8 transition-all duration-500 ${
          isStepActive('pick-price')
            ? 'ring-4 ring-indigo-300 ring-offset-2'
            : ''
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

        {/* Inline feedback for pick-price step */}
        {selectedTier && isStepActive('pick-price') && (
          <InlineStepFeedback
            stepId="pick-price"
            onFeedback={recordFeedback}
            onContinue={() => completeStep('pick-price', { tier: selectedTier })}
            onSkip={() => skipStep('pick-price')}
            continueLabel="Continue to Track"
            showSkip={false}
          />
        )}
      </div>

      {/* Step 3: Track Listing (visible after price selected) */}
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
                <p className="text-sm text-green-600">We'll help you monitor this item.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isStepActive('track') && (
                      <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                        Step 3
                      </span>
                    )}
                    <h3 className={`text-xl font-bold ${isStepActive('track') ? 'text-white' : 'text-gray-800'}`}>
                      Track This Listing
                    </h3>
                  </div>
                  <p className={isStepActive('track') ? 'text-indigo-100' : 'text-gray-600'}>
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
                  className={`flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition shadow-lg ${
                    isStepActive('track')
                      ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  } disabled:opacity-50`}
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

              <p className={`text-sm mt-3 ${isStepActive('track') ? 'text-indigo-200' : 'text-gray-500'}`}>
                Track your listing to help improve our AI and see how your item performs!
              </p>

              {/* Skip option */}
              {isStepActive('track') && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <button
                    type="button"
                    onClick={() => skipStep('track', 'not_interested')}
                    className="text-sm text-indigo-200 hover:text-white flex items-center gap-1"
                  >
                    Skip for now <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Step 4: Create Listing Page (visible after track) */}
      {isStepVisible('share') && (
        <div
          ref={shareRef}
          className={`transition-all duration-500 ${
            isStepActive('share') ? 'ring-4 ring-indigo-300 ring-offset-2 rounded-2xl' : ''
          }`}
        >
          {isStepActive('share') && (
            <div className="bg-indigo-50 rounded-t-2xl px-6 py-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
              <span className="text-sm font-bold text-indigo-700">Step 4: Create a shareable listing page!</span>
            </div>
          )}
          <FacebookMarketplaceButton
            analysisResult={result}
            images={images}
            itemDetails={itemDetails}
            userId={currentUser?.uid || 'guest'}
            selectedTier={selectedTier}
            onListingCreated={handleListingCreated}
          />

          {/* Skip option */}
          {isStepActive('share') && !listingCreated && (
            <div className="bg-white rounded-b-2xl px-6 py-3 border-t">
              <button
                type="button"
                onClick={() => skipStep('share', 'not_needed')}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                Skip - I'll share it myself <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 5: Quick Feedback (visible at end) */}
      {isStepVisible('feedback') && (
        <div
          ref={feedbackRef}
          className={`bg-white rounded-2xl shadow-xl p-8 transition-all duration-500 ${
            isStepActive('feedback') ? 'ring-4 ring-indigo-300 ring-offset-2' : ''
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            {completedSteps.includes('feedback') ? (
              <div className="bg-green-100 rounded-full p-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            ) : (
              <div className="bg-purple-100 rounded-full p-2 animate-pulse">
                <span className="text-xl">🎉</span>
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-gray-800">Almost Done!</h3>
              <p className="text-sm text-gray-600">Quick feedback helps us improve pricing accuracy</p>
            </div>
          </div>

          {showFeedback && !feedbackSubmitted && currentListingId && (
            <MicroFeedback
              listingId={currentListingId}
              onFeedbackSubmit={async (feedbackData) => {
                await handleFeedbackSubmit(feedbackData, userProfile);
                completeStep('feedback', { submitted: true });
              }}
            />
          )}

          {feedbackSubmitted && (
            <div className="flex items-center gap-3 text-green-600 justify-center py-4">
              <CheckCircle className="w-8 h-8" />
              <p className="text-xl font-semibold">Thank you for your feedback!</p>
            </div>
          )}

          {/* Skip option */}
          {isStepActive('feedback') && !feedbackSubmitted && (
            <div className="mt-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  skipStep('feedback', 'skipped');
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Skip feedback
              </button>
            </div>
          )}
        </div>
      )}

      {/* Completion celebration */}
      {completedSteps.length >= 4 && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 text-white text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-2xl font-bold mb-2">You're a Pricing Pro!</h3>
          <p className="text-green-100 mb-4">
            Thanks for completing the flow. Your data helps us make pricing smarter for everyone.
          </p>
          <button
            type="button"
            onClick={onNewAnalysis}
            className="bg-white text-green-600 font-bold px-6 py-3 rounded-lg hover:bg-green-50 transition"
          >
            Analyze Another Item
          </button>
        </div>
      )}

      {/* Transaction Outcome Modal */}
      {showTransactionModal && currentListingId && (
        <TransactionOutcome
          listingId={currentListingId}
          suggestedPrice={result.suggestedPriceRange.optimal}
          onSubmit={async (outcomeData) => {
            const submitResult = await handleFeedbackSubmit(outcomeData, userProfile);
            if (submitResult.success) {
              setShowTransactionModal(false);
            }
          }}
          onClose={() => setShowTransactionModal(false)}
        />
      )}
    </div>
  );
}
