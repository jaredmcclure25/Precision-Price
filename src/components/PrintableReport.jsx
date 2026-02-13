// src/components/PrintableReport.jsx
// Copyright © 2025 PrecisionPrices.Com. All Rights Reserved.

import React from 'react';

const PrintableReport = ({ items, onClose }) => {
  const analyzedItems = items.filter(item => item.result);
  const totalMin = analyzedItems.reduce((sum, item) => sum + (item.result?.pricing?.prices?.[0] || 0), 0);
  const totalMax = analyzedItems.reduce((sum, item) => sum + (item.result?.pricing?.prices?.[2] || 0), 0);
  const totalTarget = analyzedItems.reduce((sum, item) => sum + (item.result?.pricing?.prices?.[1] || 0), 0);
  const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const reportId = `PP-${Date.now().toString(36).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-inside: avoid; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .report-container { max-width: 100% !important; padding: 0 !important; }
        }
        @media screen {
          .report-container { max-width: 900px; margin: 0 auto; padding: 24px; }
        }
      `}</style>

      {/* Action Bar - Hidden in Print */}
      <div className="no-print sticky top-0 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Report Preview</h2>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save as PDF
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="report-container">
        {/* Header */}
        <div className="border-b-2 border-emerald-500 pb-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Precision Prices" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Precision Prices</h1>
                <p className="text-sm text-gray-500">AI-Powered Pricing Report</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Report ID: {reportId}</p>
              <p className="text-sm text-gray-500">{reportDate}</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 print-break">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Summary</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Items Analyzed</p>
              <p className="text-3xl font-bold text-gray-900">{analyzedItems.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Est. Total Value (Target)</p>
              <p className="text-3xl font-bold text-emerald-600">${totalTarget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Value Range</p>
              <p className="text-xl font-bold text-gray-700">
                ${totalMin.toLocaleString()} — ${totalMax.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Items */}
        <h2 className="text-lg font-bold text-gray-900 mb-4">Item Details</h2>
        <div className="space-y-6">
          {items.map((item, index) => {
            const prices = item.result?.pricing?.prices || [];
            const hasResult = !!item.result;
            return (
              <div key={item.id} className="border border-gray-200 rounded-xl p-6 print-break">
                <div className="flex gap-6">
                  {/* Photo */}
                  {item.images?.[0]?.preview && (
                    <div className="flex-shrink-0">
                      <img
                        src={item.images[0].preview}
                        alt={item.itemName}
                        className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {index + 1}. {item.itemName || 'Unnamed Item'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Condition: <span className="capitalize">{item.condition}</span>
                          {item.location && ` · Location: ${item.location}`}
                        </p>
                      </div>
                      {hasResult && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-emerald-600">
                            ${prices[1]?.toLocaleString() || '—'}
                          </p>
                          <p className="text-xs text-gray-500">Target Price</p>
                        </div>
                      )}
                    </div>

                    {hasResult ? (
                      <div className="mt-3 flex gap-6 text-sm">
                        <div>
                          <span className="text-gray-500">Low: </span>
                          <span className="font-medium">${prices[0]?.toLocaleString() || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Target: </span>
                          <span className="font-medium text-emerald-600">${prices[1]?.toLocaleString() || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">High: </span>
                          <span className="font-medium">${prices[2]?.toLocaleString() || '—'}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 mt-2">Not analyzed</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-400">
            Generated by PrecisionPrices.com · {reportDate} · Report {reportId}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Prices are AI-generated estimates based on market data and are not guarantees of sale value.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrintableReport;
