/**
 * InlineStepFeedback Component
 * Quick micro-feedback collection at each step of the guided flow
 */

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check, ChevronRight, SkipForward } from 'lucide-react';

// Different feedback types for each step
const STEP_FEEDBACK_CONFIG = {
  'pick-price': {
    question: 'Does this pricing feel right for your item?',
    type: 'thumbs',
  },
  'track': {
    question: 'Will you list this item for sale?',
    type: 'choice',
    options: [
      { value: 'yes', label: 'Yes, soon', emoji: '✅' },
      { value: 'maybe', label: 'Maybe later', emoji: '🤔' },
      { value: 'no', label: 'Just curious', emoji: '👀' },
    ],
  },
  'share': {
    question: 'How helpful is the listing page feature?',
    type: 'rating',
  },
  'feedback': {
    question: 'Would you use Precision Prices again?',
    type: 'thumbs',
  },
};

export default function InlineStepFeedback({
  stepId,
  onFeedback,
  onContinue,
  onSkip,
  showSkip = true,
  continueLabel = 'Continue',
  skipLabel = 'Skip',
}) {
  const [feedback, setFeedback] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const config = STEP_FEEDBACK_CONFIG[stepId];
  if (!config) return null;

  const handleFeedback = (value) => {
    setFeedback(value);
    onFeedback?.(stepId, config.type, value);
  };

  const handleContinue = () => {
    setSubmitted(true);
    onContinue?.(feedback);
  };

  const handleSkip = () => {
    onSkip?.();
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 animate-fade-in">
        <Check className="w-5 h-5 text-green-600" />
        <span className="text-green-700 text-sm font-medium">Thanks for your feedback!</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 mt-4">
      <p className="text-sm font-medium text-gray-700 mb-3">{config.question}</p>

      {/* Thumbs feedback */}
      {config.type === 'thumbs' && (
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => handleFeedback('positive')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              feedback === 'positive'
                ? 'bg-green-500 text-white scale-105'
                : 'bg-white text-gray-600 hover:bg-green-50 hover:text-green-600'
            }`}
          >
            <ThumbsUp className="w-5 h-5" />
            <span className="text-sm font-medium">Yes</span>
          </button>
          <button
            type="button"
            onClick={() => handleFeedback('negative')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              feedback === 'negative'
                ? 'bg-orange-500 text-white scale-105'
                : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600'
            }`}
          >
            <ThumbsDown className="w-5 h-5" />
            <span className="text-sm font-medium">Not quite</span>
          </button>
        </div>
      )}

      {/* Choice feedback */}
      {config.type === 'choice' && (
        <div className="flex flex-wrap gap-2 mb-4">
          {config.options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleFeedback(option.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                feedback === option.value
                  ? 'bg-indigo-500 text-white scale-105'
                  : 'bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              <span>{option.emoji}</span>
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Rating feedback (1-5) */}
      {config.type === 'rating' && (
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => handleFeedback(rating)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                feedback === rating
                  ? 'bg-indigo-500 text-white scale-110'
                  : feedback && rating <= feedback
                  ? 'bg-indigo-200 text-indigo-700'
                  : 'bg-white text-gray-400 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              {rating}
            </button>
          ))}
          <span className="text-xs text-gray-500 ml-2">
            {feedback === 5 && '🎉 Amazing!'}
            {feedback === 4 && '👍 Great!'}
            {feedback === 3 && '👌 Good'}
            {feedback === 2 && '😐 Okay'}
            {feedback === 1 && '😕 Needs work'}
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!feedback}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
            feedback
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {continueLabel}
          <ChevronRight className="w-4 h-4" />
        </button>

        {showSkip && (
          <button
            type="button"
            onClick={handleSkip}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <SkipForward className="w-4 h-4" />
            {skipLabel}
          </button>
        )}
      </div>
    </div>
  );
}
