/**
 * PrecisionPrices – Sale Outcome Review
 * Swipe-card interface: SOLD / UNSOLD / SKIP  →  builds the data flywheel
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { ArrowLeft, CheckCircle, XCircle, SkipForward, ChevronRight, BarChart2, Loader2 } from 'lucide-react';
import {
  getSale,
  getSaleItems,
  updateItemOutcome,
  markRemainingUnsold,
  getSaleSummary,
} from '../lib/salesFirestore';

// ─── Number pad ───────────────────────────────────────────────────────────────
function NumberPad({ value, onChange, onConfirm }) {
  const press = (key) => {
    if (key === 'del') {
      onChange(value.slice(0, -1));
    } else if (key === '.' && value.includes('.')) {
      // no double dot
    } else if (value.length < 7) {
      onChange(value + key);
    }
  };

  const keys = ['1','2','3','4','5','6','7','8','9','.','0','del'];

  return (
    <div className="space-y-3">
      {/* Display */}
      <div className="bg-gray-800 rounded-xl px-4 py-4 text-center">
        <span className="text-gray-400 text-lg mr-1">$</span>
        <span className="text-4xl font-bold text-white">{value || '0'}</span>
      </div>

      {/* Keys */}
      <div className="grid grid-cols-3 gap-2">
        {keys.map(k => (
          <button
            key={k}
            onClick={() => press(k)}
            className={`
              py-4 rounded-xl text-xl font-semibold transition-colors
              ${k === 'del'
                ? 'bg-gray-700 hover:bg-gray-600 text-red-400'
                : 'bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white'}
            `}
          >
            {k === 'del' ? '⌫' : k}
          </button>
        ))}
      </div>

      <button
        onClick={onConfirm}
        disabled={!value || parseFloat(value) <= 0}
        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-bold text-xl py-5 rounded-2xl transition-colors"
      >
        Confirm Sold ✓
      </button>
    </div>
  );
}

// ─── Summary screen ───────────────────────────────────────────────────────────
function SaleSummary({ summary, saleName, onDone }) {
  const pct = (n, d) => d > 0 ? Math.round((n / d) * 100) : 0;
  const accuracy = summary.avgAccuracy
    ? `${Math.round(summary.avgAccuracy * 100)}%`
    : 'N/A';

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="text-6xl">🎉</div>
        <div>
          <h2 className="text-2xl font-bold">Sale Review Complete</h2>
          {saleName && <p className="text-gray-400 mt-1">{saleName}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3 text-left">
          <StatCard label="Items Logged" value={summary.reviewedItems} />
          <StatCard label="Items Sold" value={summary.soldItems} color="text-green-400" />
          <StatCard label="Total Revenue" value={`$${summary.totalRevenue}`} color="text-green-400" />
          <StatCard label="Sell-Through" value={`${pct(summary.soldItems, summary.reviewedItems)}%`} color="text-blue-400" />
          <StatCard label="AI Accuracy" value={accuracy} color="text-purple-400" />
          <StatCard label="Unsold Items" value={summary.unsoldItems} />
        </div>

        <div className="space-y-3">
          <button
            onClick={onDone}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg py-4 rounded-2xl"
          >
            Back to App
          </button>
        </div>

        <p className="text-gray-500 text-xs">
          This data helps improve pricing accuracy for your next sale.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-gray-800 rounded-xl p-3">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-gray-400 text-xs mt-0.5">{label}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SaleReviewPage() {
  const { saleId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sale, setSale] = useState(null);
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPad, setShowPad] = useState(false);
  const [soldPrice, setSoldPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  // Touch / swipe state
  const cardRef = useRef(null);
  const dragStart = useRef(null);
  const [dragX, setDragX] = useState(0);

  useEffect(() => {
    if (!saleId) return;
    (async () => {
      try {
        const [saleData, saleItems] = await Promise.all([
          getSale(saleId),
          getSaleItems(saleId),
        ]);
        setSale(saleData);
        // Only show items not yet reviewed
        const pending = saleItems.filter(i => !i.outcome || i.outcome === null);
        setItems(pending);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [saleId]);

  const currentItem = items[currentIndex];
  const isLast = currentIndex >= items.length - 1;

  const advance = () => {
    setShowPad(false);
    setSoldPrice('');
    setDragX(0);
    if (isLast) {
      finishReview();
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const recordOutcome = async (outcome, price = null) => {
    if (!currentItem || submitting) return;
    setSubmitting(true);
    try {
      await updateItemOutcome(saleId, currentItem.id, outcome, price);
      advance();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSold = () => {
    // Pre-fill with listed price
    setSoldPrice(String(currentItem?.aiPriceMedium || ''));
    setShowPad(true);
  };

  const confirmSold = () => {
    const price = parseFloat(soldPrice);
    if (!price || price <= 0) return;
    recordOutcome('sold', price);
  };

  const handleMarkAllUnsold = async () => {
    setMarkingAll(true);
    try {
      await markRemainingUnsold(saleId);
      finishReview();
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingAll(false);
    }
  };

  const finishReview = async () => {
    try {
      const s = await getSaleSummary(saleId);
      setSummary(s);
      setShowSummary(true);
    } catch (err) {
      console.error(err);
      navigate('/app');
    }
  };

  // ── Touch swipe handlers ──
  const onTouchStart = (e) => {
    dragStart.current = e.touches[0].clientX;
  };
  const onTouchMove = (e) => {
    if (dragStart.current === null) return;
    const delta = e.touches[0].clientX - dragStart.current;
    setDragX(delta);
  };
  const onTouchEnd = () => {
    if (Math.abs(dragX) > 80) {
      if (dragX > 0) {
        // Swipe right = SOLD
        handleSold();
      } else {
        // Swipe left = UNSOLD
        recordOutcome('unsold');
      }
    }
    dragStart.current = null;
    setDragX(0);
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-blue-400" />
      </div>
    );
  }

  // ── Summary ──
  if (showSummary && summary) {
    return (
      <SaleSummary
        summary={summary}
        saleName={sale?.saleName}
        onDone={() => navigate('/app')}
      />
    );
  }

  // ── No items ──
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle size={56} className="text-green-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">All items reviewed!</h2>
        <p className="text-gray-400 mb-6">No pending items for this sale.</p>
        <button onClick={() => navigate('/app')} className="bg-blue-600 text-white font-bold py-4 px-8 rounded-2xl">
          Back to App
        </button>
      </div>
    );
  }

  const progressPct = items.length > 0 ? (currentIndex / items.length) * 100 : 0;
  const swipeHint = dragX > 40 ? 'SOLD' : dragX < -40 ? 'UNSOLD' : null;
  const cardRotate = dragX / 20;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800 flex-shrink-0">
        <button onClick={() => navigate('/app')} className="text-gray-400 hover:text-white">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{sale?.saleName || 'Sale Review'}</h1>
          <p className="text-gray-400 text-sm">Item {currentIndex + 1} of {items.length}</p>
        </div>
        <button
          onClick={handleMarkAllUnsold}
          disabled={markingAll}
          className="text-xs text-gray-500 hover:text-red-400 transition-colors"
        >
          {markingAll ? <Loader2 size={14} className="animate-spin" /> : 'Mark rest unsold'}
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-800 h-1.5 flex-shrink-0">
        <div
          className="bg-blue-500 h-1.5 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
        {showPad ? (
          // Number pad for sold price
          <div className="w-full max-w-sm space-y-3">
            <div className="text-center mb-2">
              <p className="text-gray-300 font-semibold">{currentItem?.itemName}</p>
              <p className="text-gray-500 text-sm">AI suggested: ${currentItem?.aiPriceMedium}</p>
            </div>
            <p className="text-center text-white font-semibold">Sold for how much?</p>
            <NumberPad
              value={soldPrice}
              onChange={setSoldPrice}
              onConfirm={confirmSold}
            />
            <button
              onClick={() => { setShowPad(false); setSoldPrice(''); }}
              className="w-full text-gray-500 text-sm py-2"
            >
              Cancel
            </button>
          </div>
        ) : (
          // Swipe card
          <div
            ref={cardRef}
            className="w-full max-w-sm"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl transition-transform select-none"
              style={{
                transform: `translateX(${dragX}px) rotate(${cardRotate}deg)`,
              }}
            >
              {/* Photo */}
              {currentItem?.previewUrl ? (
                <img
                  src={currentItem.previewUrl}
                  alt={currentItem.itemName}
                  className="w-full aspect-square object-cover"
                  draggable={false}
                />
              ) : (
                <div className="w-full aspect-square bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-500 text-5xl">📦</span>
                </div>
              )}

              {/* Swipe overlay hints */}
              {swipeHint === 'SOLD' && (
                <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center rounded-2xl">
                  <span className="text-5xl font-black text-green-300 rotate-[-15deg] border-4 border-green-300 px-4 py-2 rounded-xl">SOLD</span>
                </div>
              )}
              {swipeHint === 'UNSOLD' && (
                <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center rounded-2xl">
                  <span className="text-5xl font-black text-red-300 rotate-[15deg] border-4 border-red-300 px-4 py-2 rounded-xl">UNSOLD</span>
                </div>
              )}

              {/* Info */}
              <div className="p-4">
                <h3 className="text-white font-bold text-lg leading-tight">
                  {currentItem?.itemName || 'Unknown item'}
                </h3>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-green-400 text-2xl font-bold">
                    ${currentItem?.aiPriceMedium}
                  </span>
                  <span className="text-gray-500 text-sm">
                    AI price · Range ${currentItem?.aiPriceLow}–${currentItem?.aiPriceHigh}
                  </span>
                </div>
                {currentItem?.notes && (
                  <p className="text-gray-400 text-sm mt-1">{currentItem.notes}</p>
                )}
              </div>
            </div>

            {/* Swipe hint text */}
            <p className="text-center text-gray-600 text-xs mt-3">
              ← swipe left = unsold · swipe right = sold →
            </p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!showPad && (
        <div className="p-4 flex-shrink-0">
          <div className="flex gap-3 max-w-sm mx-auto">
            <button
              onClick={() => recordOutcome('unsold')}
              disabled={submitting}
              className="flex-1 bg-red-900 hover:bg-red-800 active:bg-red-700 disabled:opacity-50 text-white font-bold py-5 rounded-2xl flex flex-col items-center gap-1 transition-colors"
            >
              <XCircle size={28} />
              <span className="text-sm">UNSOLD</span>
            </button>

            <button
              onClick={() => recordOutcome('skip')}
              disabled={submitting}
              className="flex-none bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-300 font-bold py-5 px-4 rounded-2xl flex flex-col items-center gap-1 transition-colors"
            >
              <SkipForward size={24} />
              <span className="text-xs">SKIP</span>
            </button>

            <button
              onClick={handleSold}
              disabled={submitting}
              className="flex-1 bg-green-700 hover:bg-green-600 active:bg-green-800 disabled:opacity-50 text-white font-bold py-5 rounded-2xl flex flex-col items-center gap-1 transition-colors"
            >
              <CheckCircle size={28} />
              <span className="text-sm">SOLD</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
