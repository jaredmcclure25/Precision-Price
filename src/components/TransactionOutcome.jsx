/**
 * Precision Prices - Transaction Outcome Tracker
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 *
 * Collect actual sale data: sold price, days to sell, ghosting
 * Mobile-optimized with responsive design
 */

import React, { useState } from "react";
import { DollarSign, Calendar, Users, CheckCircle, X } from 'lucide-react';
import { FeedbackPurpose, FeedbackEffort, TransactionStage } from '../feedback/feedbackEnums';
import { useMobileDetect } from '../hooks/useMobileDetect';

export default function TransactionOutcome({ listingId, suggestedPrice, onSubmit, onClose }) {
  const { isMobile } = useMobileDetect();
  const [sold, setSold] = useState(null);
  const [finalPrice, setFinalPrice] = useState('');
  const [daysToSell, setDaysToSell] = useState('');
  const [ghosted, setGhosted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);

    const outcomeData = {
      listingId,
      purpose: FeedbackPurpose.TIME_TO_SELL,
      effort: FeedbackEffort.SHORT,
      stage: sold ? TransactionStage.SOLD : TransactionStage.NOT_SOLD,
      value: {
        sold: sold,
        finalPrice: finalPrice ? parseFloat(finalPrice) : null,
        suggestedPrice: suggestedPrice,
        daysToSell: daysToSell ? parseInt(daysToSell) : null,
        ghosted: ghosted,
        variance: finalPrice && suggestedPrice
          ? ((parseFloat(finalPrice) - suggestedPrice) / suggestedPrice * 100).toFixed(1)
          : null
      },
      variant: 'form'
    };

    if (onSubmit) {
      await onSubmit(outcomeData);
    }

    setSubmitting(false);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4 sm:p-5">
      <div className={`modal-mobile bg-white shadow-xl overflow-y-auto ${isMobile ? 'w-full h-full' : 'max-w-lg w-full max-h-[90vh] rounded-xl'}`}>
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 m-0">How did it go?</h3>
          <button
            onClick={onClose}
            className="btn-mobile bg-transparent border-0 cursor-pointer text-gray-500 hover:text-gray-700 p-2 transition-colors"
            aria-label="Close modal"
          >
            <X size={isMobile ? 24 : 20} />
          </button>
        </div>

        <div className="card-mobile touch-spacing">
          {/* Did it sell? */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Did your item sell?</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setSold(true)}
                className={`btn-mobile flex-1 border-2 rounded-lg cursor-pointer flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                  sold === true
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <CheckCircle size={18} />
                Yes, it sold!
              </button>
              <button
                onClick={() => setSold(false)}
                className={`btn-mobile flex-1 border-2 rounded-lg cursor-pointer flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                  sold === false
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <X size={18} />
                No, still listed
              </button>
            </div>
          </div>

          {/* If sold, collect details */}
          {sold === true && (
            <>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign size={16} className="inline mr-1" />
                  Final sale price
                </label>
                <input
                  type="number"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  placeholder="Enter amount"
                  className="input-mobile w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  min="0"
                  step="0.01"
                />
                {finalPrice && suggestedPrice && (
                  <div className="mt-2 text-xs sm:text-sm text-gray-600">
                    {parseFloat(finalPrice) > suggestedPrice
                      ? `🎉 ${(((parseFloat(finalPrice) - suggestedPrice) / suggestedPrice) * 100).toFixed(0)}% above suggestion!`
                      : parseFloat(finalPrice) < suggestedPrice
                      ? `📉 ${(((suggestedPrice - parseFloat(finalPrice)) / suggestedPrice) * 100).toFixed(0)}% below suggestion`
                      : '🎯 Right on target!'}
                  </div>
                )}
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  How many days to sell?
                </label>
                <input
                  type="number"
                  value={daysToSell}
                  onChange={(e) => setDaysToSell(e.target.value)}
                  placeholder="Number of days"
                  className="input-mobile w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  min="0"
                />
              </div>

              <div className="mb-5">
                <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ghosted}
                    onChange={(e) => setGhosted(e.target.checked)}
                    className="w-5 h-5 cursor-pointer accent-blue-500"
                  />
                  <Users size={16} className="ml-2 mr-1" />
                  I dealt with flaky buyers (ghosting/no-shows)
                </label>
              </div>
            </>
          )}

          {/* If not sold */}
          {sold === false && (
            <div className="text-xs sm:text-sm text-gray-600">
              Thanks for the update! This helps us understand market demand.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 sm:p-6 pb-safe border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-mobile px-5 py-2.5 border border-gray-300 rounded-lg bg-white cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={sold === null || submitting}
            className={`btn-mobile px-5 py-2.5 border-0 rounded-lg text-white cursor-pointer text-sm font-medium transition-colors ${
              sold === null || submitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}
