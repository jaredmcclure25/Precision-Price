/**
 * PrecisionPrices – Publish Sale Page
 * After bulk pricing: Push items to Square catalog + generate barcode label PDF
 * Route: /app/sale/:saleId/publish
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getSaleItems } from '../lib/salesFirestore';
import {
  ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Loader2,
  Zap, Tag, Download, ExternalLink, Square, Printer
} from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || '';

export default function PublishSalePage() {
  const { currentUser } = useAuth();
  const { saleId } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [squareInfo, setSquareInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Action states
  const [squarePushing, setSquarePushing] = useState(false);
  const [squarePushed, setSquarePushed] = useState(false);
  const [squareError, setSquareError] = useState('');
  const [squarePushedCount, setSquarePushedCount] = useState(0);

  const [labelGenerating, setLabelGenerating] = useState(false);
  const [labelDone, setLabelDone] = useState(false);
  const [labelError, setLabelError] = useState('');

  // Load sale items and Square connection status
  useEffect(() => {
    if (!currentUser || !saleId) return;
    (async () => {
      try {
        const [saleItems, squareSnap] = await Promise.all([
          getSaleItems(saleId),
          getDoc(doc(db, 'users', currentUser.uid, 'integrations', 'square')),
        ]);
        setItems(saleItems);
        if (squareSnap.exists() && squareSnap.data().status === 'connected') {
          setSquareInfo(squareSnap.data());
        }
      } catch (_) {}
      finally { setLoading(false); }
    })();
  }, [currentUser, saleId]);

  // ── Push to Square catalog ──────────────────────────────────────────────────
  const pushToSquare = async () => {
    if (!currentUser || !squareInfo) return;
    setSquarePushing(true);
    setSquareError('');
    try {
      const res = await fetch(`${BACKEND}/api/square/push-catalog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          saleId,
          items: items.map(item => ({
            id: item.id,
            itemName: item.itemName || 'Unknown item',
            category: item.category || 'other',
            condition: item.condition || 'good',
            priceCents: Math.round((item.aiPriceMedium || item.selectedPrice || 5) * 100),
            notes: item.notes || '',
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Push failed');
      setSquarePushedCount(data.pushed || items.length);
      setSquarePushed(true);
    } catch (err) {
      setSquareError(err.message || 'Could not push to Square. Try again.');
    } finally {
      setSquarePushing(false);
    }
  };

  // ── Generate label PDF ──────────────────────────────────────────────────────
  const generateLabels = async () => {
    setLabelGenerating(true);
    setLabelError('');
    try {
      const res = await fetch(`${BACKEND}/api/generate-labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId,
          items: items.map(item => ({
            id: item.id,
            itemName: item.itemName || 'Unknown item',
            price: item.aiPriceMedium || item.selectedPrice || 5,
            category: item.category || '',
            condition: item.condition || '',
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Label generation failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `labels-${saleId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setLabelDone(true);
    } catch (err) {
      setLabelError(err.message || 'Could not generate labels. Try again.');
    } finally {
      setLabelGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    );
  }

  const totalValue = items.reduce((s, i) => s + (i.aiPriceMedium || i.selectedPrice || 0), 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Publish Sale</h1>
          <p className="text-gray-400 text-sm">{items.length} items · ${totalValue} est. value</p>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-5">

        {/* ── Step 1: Push to Square ─────────────────────────────────────── */}
        <div className="bg-gray-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${squarePushed ? 'bg-green-500' : 'bg-blue-600'}`}>
              {squarePushed ? <CheckCircle size={18} /> : '1'}
            </div>
            <h2 className="font-bold text-lg">Push to Square Catalog</h2>
          </div>

          {squareInfo ? (
            <>
              <div className="flex items-center gap-2 text-sm text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                Square connected · Merchant {squareInfo.merchantId?.slice(0, 12)}…
              </div>
              <p className="text-gray-400 text-sm">
                Creates all {items.length} items in your Square catalog with unique barcodes
                (<span className="font-mono text-gray-300">PP-id</span>). Ready to sell instantly.
              </p>

              {squareError && (
                <div className="bg-red-900/60 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm flex items-center gap-2">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {squareError}
                </div>
              )}

              {squarePushed ? (
                <div className="bg-green-900/60 border border-green-700 rounded-xl px-4 py-3 text-green-200 text-sm flex items-center gap-2">
                  <CheckCircle size={16} className="flex-shrink-0" />
                  {squarePushedCount} items pushed to Square catalog
                </div>
              ) : (
                <button
                  onClick={pushToSquare}
                  disabled={squarePushing}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  {squarePushing ? (
                    <><Loader2 size={20} className="animate-spin" /> Pushing {items.length} items…</>
                  ) : (
                    <><Zap size={20} /> Push {items.length} Items to Square</>
                  )}
                </button>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="bg-yellow-900/40 border border-yellow-700 rounded-xl px-4 py-3 text-yellow-300 text-sm">
                Square not connected. Connect Square to enable automatic catalog sync and webhook sales tracking.
              </div>
              <button
                onClick={() => navigate('/app/settings/square')}
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <ExternalLink size={18} /> Connect Square Account
              </button>
            </div>
          )}
        </div>

        {/* ── Step 2: Print Labels ───────────────────────────────────────── */}
        <div className="bg-gray-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${labelDone ? 'bg-green-500' : 'bg-purple-600'}`}>
              {labelDone ? <CheckCircle size={18} /> : '2'}
            </div>
            <h2 className="font-bold text-lg">Print Barcode Labels</h2>
          </div>

          <p className="text-gray-400 text-sm">
            Generates a printable PDF with {items.length} barcode labels — 32 per page, sorted by price tier.
            Each label has the item name, price, and a scannable CODE128 barcode.
          </p>

          {labelError && (
            <div className="bg-red-900/60 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              {labelError}
            </div>
          )}

          {labelDone ? (
            <div className="space-y-2">
              <div className="bg-green-900/60 border border-green-700 rounded-xl px-4 py-3 text-green-200 text-sm flex items-center gap-2">
                <CheckCircle size={16} className="flex-shrink-0" />
                Label PDF downloaded
              </div>
              <button
                onClick={generateLabels}
                disabled={labelGenerating}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <Download size={16} /> Download Again
              </button>
            </div>
          ) : (
            <button
              onClick={generateLabels}
              disabled={labelGenerating}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {labelGenerating ? (
                <><Loader2 size={20} className="animate-spin" /> Generating labels…</>
              ) : (
                <><Printer size={20} /> Generate & Download Labels</>
              )}
            </button>
          )}
        </div>

        {/* ── Step 3: How the loop closes ──────────────────────────────────── */}
        <div className="bg-gray-800/60 rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold text-sm text-gray-300 flex items-center gap-2">
            <Tag size={16} className="text-blue-400" /> How the sale loop closes automatically
          </h3>
          <div className="space-y-2 text-xs text-gray-400">
            {[
              ['🏷️', 'Stick barcode labels on items'],
              ['💳', 'Customers buy — cashier scans barcodes in Square POS'],
              ['🔄', 'Square webhook auto-records sold prices in PrecisionPrices'],
              ['🧠', 'AI pricing improves with every sale — zero manual entry'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-start gap-2">
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Continue to Post-Sale Review ─────────────────────────────────── */}
        <div className="space-y-2 pb-8">
          <button
            onClick={() => navigate(`/app/sale/${saleId}/review`)}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold text-lg py-5 rounded-2xl flex items-center justify-center gap-2 transition-colors"
          >
            Start Post-Sale Review <ArrowRight size={22} />
          </button>
          <p className="text-center text-gray-500 text-xs">
            After the sale, swipe cards to mark what sold and log actual prices.
          </p>
        </div>
      </div>
    </div>
  );
}
