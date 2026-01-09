/**
 * Precision Prices - Micro Feedback Component
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 *
 * Low-friction thumbs up/down feedback for price accuracy
 * Mobile-optimized with touch-friendly buttons
 */

import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import { FeedbackPurpose, FeedbackEffort, TransactionStage } from '../feedback/feedbackEnums';
import { useMobileDetect } from '../hooks/useMobileDetect';

export default function MicroFeedback({ listingId, onFeedbackSubmit }) {
  const { isMobile } = useMobileDetect();
  const [submitted, setSubmitted] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);

  const handleFeedback = async (value) => {
    setSelectedValue(value);
    setSubmitted(true);

    const feedbackData = {
      listingId,
      purpose: FeedbackPurpose.PRICE_ACCURACY,
      effort: FeedbackEffort.MICRO,
      stage: TransactionStage.PRE_LISTING,
      value: value, // true for thumbs up, false for thumbs down
      variant: 'button'
    };

    // Call parent callback
    if (onFeedbackSubmit) {
      await onFeedbackSubmit(feedbackData);
    }
  };

  if (submitted) {
    return (
      <div className="micro-feedback submitted flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 mt-4">
        <CheckCircle size={isMobile ? 20 : 16} className="text-green-600 flex-shrink-0" />
        <span className="text-sm sm:text-base text-green-700 font-medium">
          Thanks for your feedback! This helps us improve pricing for everyone.
        </span>
      </div>
    );
  }

  return (
    <div className="micro-feedback flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 mt-4">
      <span className="text-sm sm:text-base text-gray-700 font-medium">Was this price accurate?</span>
      <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
        <button
          onClick={() => handleFeedback(true)}
          className="btn-mobile flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 rounded-lg bg-white cursor-pointer flex items-center justify-center transition-all hover:border-green-500 hover:bg-green-50 hover:text-green-600 text-gray-600"
          aria-label="Price was accurate"
        >
          <ThumbsUp size={isMobile ? 20 : 18} />
        </button>
        <button
          onClick={() => handleFeedback(false)}
          className="btn-mobile flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 rounded-lg bg-white cursor-pointer flex items-center justify-center transition-all hover:border-red-500 hover:bg-red-50 hover:text-red-600 text-gray-600"
          aria-label="Price was not accurate"
        >
          <ThumbsDown size={isMobile ? 20 : 18} />
        </button>
      </div>
    </div>
  );
}
