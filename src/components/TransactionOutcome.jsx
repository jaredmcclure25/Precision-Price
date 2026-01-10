/**
 * Precision Prices - Transaction Outcome Tracker
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 *
 * Collect actual sale data: sold price, days to sell, ghosting
 */

import React, { useState } from "react";
import { DollarSign, Calendar, Users, CheckCircle, X } from 'lucide-react';
import { FeedbackPurpose, FeedbackEffort, TransactionStage } from '../feedback/feedbackEnums';

export default function TransactionOutcome({ listingId, suggestedPrice, onSubmit, onClose }) {
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
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>How did it go?</h3>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div style={styles.content}>
          {/* Did it sell? */}
          <div style={styles.section}>
            <label style={styles.label}>Did your item sell?</label>
            <div style={styles.buttonGroup}>
              <button
                onClick={() => setSold(true)}
                style={{
                  ...styles.optionBtn,
                  ...(sold === true ? styles.optionBtnActive : {})
                }}
              >
                <CheckCircle size={18} />
                Yes, it sold!
              </button>
              <button
                onClick={() => setSold(false)}
                style={{
                  ...styles.optionBtn,
                  ...(sold === false ? styles.optionBtnActive : {})
                }}
              >
                <X size={18} />
                No, still listed
              </button>
            </div>
          </div>

          {/* If sold, collect details */}
          {sold === true && (
            <>
              <div style={styles.section}>
                <label style={styles.label}>
                  <DollarSign size={16} style={{ display: 'inline', marginRight: '4px' }} />
                  Final sale price
                </label>
                <input
                  type="number"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  placeholder="Enter amount"
                  style={styles.input}
                  min="0"
                  step="0.01"
                />
                {finalPrice && suggestedPrice && (
                  <div style={styles.hint}>
                    {parseFloat(finalPrice) > suggestedPrice
                      ? `🎉 ${(((parseFloat(finalPrice) - suggestedPrice) / suggestedPrice) * 100).toFixed(0)}% above suggestion!`
                      : parseFloat(finalPrice) < suggestedPrice
                      ? `📉 ${(((suggestedPrice - parseFloat(finalPrice)) / suggestedPrice) * 100).toFixed(0)}% below suggestion`
                      : '🎯 Right on target!'}
                  </div>
                )}
              </div>

              <div style={styles.section}>
                <label style={styles.label}>
                  <Calendar size={16} style={{ display: 'inline', marginRight: '4px' }} />
                  How many days to sell?
                </label>
                <input
                  type="number"
                  value={daysToSell}
                  onChange={(e) => setDaysToSell(e.target.value)}
                  placeholder="Number of days"
                  style={styles.input}
                  min="0"
                />
              </div>

              <div style={styles.section}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={ghosted}
                    onChange={(e) => setGhosted(e.target.checked)}
                    style={styles.checkbox}
                  />
                  <Users size={16} style={{ marginLeft: '8px', marginRight: '4px' }} />
                  I dealt with flaky buyers (ghosting/no-shows)
                </label>
              </div>
            </>
          )}

          {/* If not sold */}
          {sold === false && (
            <div style={styles.hint}>
              Thanks for the update! This helps us understand market demand.
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={sold === null || submitting}
            style={{
              ...styles.submitBtn,
              ...(sold === null || submitting ? styles.submitBtnDisabled : {})
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb'
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    margin: 0
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px'
  },
  content: {
    padding: '24px'
  },
  section: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px'
  },
  optionBtn: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    transition: 'all 0.2s ease'
  },
  optionBtnActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
    color: '#3b82f6'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  hint: {
    marginTop: '8px',
    fontSize: '13px',
    color: '#6b7280'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb'
  },
  cancelBtn: {
    padding: '10px 20px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  },
  submitBtn: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  submitBtnDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed'
  }
};
