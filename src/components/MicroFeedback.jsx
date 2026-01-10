/**
 * Precision Prices - Micro Feedback Component
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 *
 * Low-friction thumbs up/down feedback for price accuracy
 */

import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import { FeedbackPurpose, FeedbackEffort, TransactionStage } from '../feedback/feedbackEnums';

export default function MicroFeedback({ listingId, onFeedbackSubmit }) {
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
      <div className="micro-feedback submitted" style={styles.container}>
        <CheckCircle size={16} style={{ color: '#10b981' }} />
        <span style={styles.thankYou}>
          Thanks for your feedback! This helps us improve pricing for everyone.
        </span>
      </div>
    );
  }

  return (
    <div className="micro-feedback" style={styles.container}>
      <span style={styles.question}>Was this price accurate?</span>
      <div style={styles.buttons}>
        <button
          onClick={() => handleFeedback(true)}
          style={styles.button}
          className="micro-feedback-btn thumbs-up"
          aria-label="Price was accurate"
        >
          <ThumbsUp size={18} />
        </button>
        <button
          onClick={() => handleFeedback(false)}
          style={styles.button}
          className="micro-feedback-btn thumbs-down"
          aria-label="Price was not accurate"
        >
          <ThumbsDown size={18} />
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    marginTop: '16px'
  },
  question: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500'
  },
  buttons: {
    display: 'flex',
    gap: '8px'
  },
  button: {
    padding: '12px 16px',
    minHeight: '44px',
    minWidth: '44px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    color: '#6b7280',
    touchAction: 'manipulation'
  },
  thankYou: {
    fontSize: '14px',
    color: '#059669',
    fontWeight: '500'
  }
};
