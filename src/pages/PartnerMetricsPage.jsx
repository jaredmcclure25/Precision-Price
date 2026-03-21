/**
 * PrecisionPrices – Partner Metrics & Excel Export
 * Shows all the data measurables from the spec + exports to .xlsx
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { ArrowLeft, Download, Loader2, BarChart2, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';
import { getUserSales, getSaleItems } from '../lib/salesFirestore';
import * as XLSX from 'xlsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pct(n, d) { return d > 0 ? ((n / d) * 100).toFixed(1) + '%' : '—'; }
function dollar(n) { return n != null ? `$${Number(n).toFixed(2)}` : '—'; }
function round2(n) { return n != null ? Math.round(n * 100) / 100 : null; }

// ─── Excel export ─────────────────────────────────────────────────────────────
function exportToExcel(sales, allItems) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Sales Summary ──────────────────────────────────────────────────
  const summaryRows = sales.map(s => {
    const saleItems = allItems.filter(i => i.saleId === s.id);
    const reviewed  = saleItems.filter(i => i.outcome && i.outcome !== 'skip');
    const sold      = reviewed.filter(i => i.outcome === 'sold');
    const revenue   = sold.reduce((acc, i) => acc + (i.soldPrice || 0), 0);
    const aiPrices  = sold.filter(i => i.aiPriceMedium && i.soldPrice);
    const accuracy  = aiPrices.length
      ? aiPrices.reduce((a, i) => a + (i.soldPrice / i.aiPriceMedium), 0) / aiPrices.length
      : null;

    return {
      'Sale Name':          s.saleName || 'Unnamed Sale',
      'Date':               s.createdAt instanceof Date ? s.createdAt.toLocaleDateString() : String(s.createdAt || ''),
      'Total Items':        saleItems.length,
      'Items Reviewed':     reviewed.length,
      'Items Sold':         sold.length,
      'Items Unsold':       reviewed.filter(i => i.outcome === 'unsold').length,
      'Sell-Through Rate':  reviewed.length ? round2(sold.length / reviewed.length) : null,
      'Total Revenue':      round2(revenue),
      'Avg Revenue/Sale':   sold.length ? round2(revenue / sold.length) : null,
      'AI Accuracy (avg)':  accuracy ? round2(accuracy) : null,
      'Status':             s.status || 'pricing',
    };
  });

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [
    { wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
    { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 10 }
  ];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Sales Summary');

  // ── Sheet 2: All Items ──────────────────────────────────────────────────────
  const itemRows = allItems.map(item => {
    const sale = sales.find(s => s.id === item.saleId);
    const accuracy = item.soldPrice && item.aiPriceMedium
      ? round2(item.soldPrice / item.aiPriceMedium)
      : null;
    return {
      'Sale Name':       sale?.saleName || item.saleId,
      'Item Name':       item.itemName || 'Unknown',
      'Category':        item.category || '',
      'Condition':       item.condition || '',
      'AI Price Low':    item.aiPriceLow || '',
      'AI Price (Med)':  item.aiPriceMedium || '',
      'AI Price High':   item.aiPriceHigh || '',
      'AI Confidence':   item.aiConfidence ? round2(item.aiConfidence) : '',
      'Outcome':         item.outcome || 'pending',
      'Sold Price':      item.soldPrice || '',
      'AI Accuracy':     accuracy,
      'Notes':           item.notes || '',
    };
  });

  const itemSheet = XLSX.utils.json_to_sheet(itemRows);
  itemSheet['!cols'] = Array(12).fill({ wch: 16 });
  XLSX.utils.book_append_sheet(wb, itemSheet, 'All Items');

  // ── Sheet 3: Category Breakdown ─────────────────────────────────────────────
  const catMap = {};
  allItems.forEach(item => {
    const cat = item.category || 'other';
    if (!catMap[cat]) catMap[cat] = { total: 0, sold: 0, revenue: 0, accuracySum: 0, accuracyCount: 0 };
    catMap[cat].total++;
    if (item.outcome === 'sold') {
      catMap[cat].sold++;
      catMap[cat].revenue += item.soldPrice || 0;
      if (item.soldPrice && item.aiPriceMedium) {
        catMap[cat].accuracySum  += item.soldPrice / item.aiPriceMedium;
        catMap[cat].accuracyCount++;
      }
    }
  });

  const catRows = Object.entries(catMap).map(([cat, d]) => ({
    'Category':          cat,
    'Total Items':       d.total,
    'Items Sold':        d.sold,
    'Sell-Through Rate': d.total ? round2(d.sold / d.total) : null,
    'Total Revenue':     round2(d.revenue),
    'Avg Sold Price':    d.sold ? round2(d.revenue / d.sold) : null,
    'AI Accuracy (avg)': d.accuracyCount ? round2(d.accuracySum / d.accuracyCount) : null,
  })).sort((a, b) => b['Total Items'] - a['Total Items']);

  const catSheet = XLSX.utils.json_to_sheet(catRows);
  catSheet['!cols'] = Array(7).fill({ wch: 18 });
  XLSX.utils.book_append_sheet(wb, catSheet, 'Category Breakdown');

  // ── Sheet 4: Key Metrics (for presentations) ────────────────────────────────
  const reviewed  = allItems.filter(i => i.outcome && i.outcome !== 'skip');
  const sold      = reviewed.filter(i => i.outcome === 'sold');
  const revenue   = sold.reduce((a, i) => a + (i.soldPrice || 0), 0);
  const aiPairs   = sold.filter(i => i.aiPriceMedium && i.soldPrice);
  const avgAccuracy = aiPairs.length
    ? aiPairs.reduce((a, i) => a + (i.soldPrice / i.aiPriceMedium), 0) / aiPairs.length
    : null;

  const metricsRows = [
    { 'Metric': 'Sales Tracked',           'Value': sales.length,                                    'Unit': 'sales' },
    { 'Metric': 'Total Items Priced',       'Value': allItems.length,                                 'Unit': 'items' },
    { 'Metric': 'Items with Outcomes',      'Value': reviewed.length,                                 'Unit': 'items' },
    { 'Metric': 'Items Sold',               'Value': sold.length,                                     'Unit': 'items' },
    { 'Metric': 'Total Revenue',            'Value': round2(revenue),                                 'Unit': 'USD' },
    { 'Metric': 'Avg Revenue per Sale',     'Value': sales.length ? round2(revenue / sales.length) : null, 'Unit': 'USD' },
    { 'Metric': 'Sell-Through Rate',        'Value': reviewed.length ? round2(sold.length / reviewed.length * 100) : null, 'Unit': '%' },
    { 'Metric': 'AI Pricing Accuracy',      'Value': avgAccuracy ? round2(avgAccuracy * 100) : null,  'Unit': '%' },
    { 'Metric': 'Categories Tracked',       'Value': Object.keys(catMap).length,                      'Unit': 'categories' },
  ];

  const metricsSheet = XLSX.utils.json_to_sheet(metricsRows);
  metricsSheet['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, metricsSheet, 'Key Metrics');

  // Write and download
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `precision-prices-metrics-${date}.xlsx`);
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-gray-400 text-sm mt-0.5">{label}</div>
      {sub && <div className="text-gray-500 text-xs mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PartnerMetricsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading]       = useState(true);
  const [exporting, setExporting]   = useState(false);
  const [sales, setSales]           = useState([]);
  const [allItems, setAllItems]     = useState([]);
  const [error, setError]           = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const userSales = await getUserSales(currentUser.uid);
        setSales(userSales);

        const itemArrays = await Promise.all(
          userSales.map(async s => {
            const items = await getSaleItems(s.id);
            return items.map(i => ({ ...i, saleId: s.id }));
          })
        );
        setAllItems(itemArrays.flat());
      } catch (err) {
        setError('Could not load data — check your connection.');
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser]);

  const handleExport = async () => {
    setExporting(true);
    try { exportToExcel(sales, allItems); }
    catch (err) { console.error(err); }
    finally { setExporting(false); }
  };

  // ── Compute summary stats ──
  const reviewed    = allItems.filter(i => i.outcome && i.outcome !== 'skip');
  const sold        = reviewed.filter(i => i.outcome === 'sold');
  const revenue     = sold.reduce((a, i) => a + (i.soldPrice || 0), 0);
  const aiPairs     = sold.filter(i => i.aiPriceMedium && i.soldPrice);
  const avgAccuracy = aiPairs.length
    ? aiPairs.reduce((a, i) => a + (i.soldPrice / i.aiPriceMedium), 0) / aiPairs.length
    : null;

  // Category breakdown
  const catMap = {};
  allItems.forEach(item => {
    const cat = item.category || 'other';
    if (!catMap[cat]) catMap[cat] = { total: 0, sold: 0, accuracySum: 0, accuracyCount: 0 };
    catMap[cat].total++;
    if (item.outcome === 'sold') {
      catMap[cat].sold++;
      if (item.soldPrice && item.aiPriceMedium) {
        catMap[cat].accuracySum  += item.soldPrice / item.aiPriceMedium;
        catMap[cat].accuracyCount++;
      }
    }
  });
  const catList = Object.entries(catMap)
    .map(([cat, d]) => ({
      cat,
      total: d.total,
      sold: d.sold,
      sellThrough: d.total ? d.sold / d.total : 0,
      accuracy: d.accuracyCount ? d.accuracySum / d.accuracyCount : null,
    }))
    .sort((a, b) => b.total - a.total);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 size={36} className="text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800">
        <button onClick={() => navigate('/app')} className="text-gray-400 hover:text-white">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Partner Metrics</h1>
          <p className="text-gray-400 text-sm">Your pricing performance data</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || allItems.length === 0}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-2 text-sm transition-colors"
        >
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Export Excel
        </button>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {error && (
          <div className="bg-red-900/60 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm">{error}</div>
        )}

        {allItems.length === 0 && !error && (
          <div className="text-center py-16 text-gray-500">
            <BarChart2 size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No sale data yet</p>
            <p className="text-sm mt-1">Use Bulk Price to run a sale, then log outcomes to see metrics here.</p>
            <button onClick={() => navigate('/app/bulk')} className="mt-4 bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl">
              Go to Bulk Pricing
            </button>
          </div>
        )}

        {allItems.length > 0 && (
          <>
            {/* Key numbers */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Sales Tracked"     value={sales.length}                                                     color="text-white" />
              <StatCard label="Items Priced"       value={allItems.length}                                                  color="text-white" />
              <StatCard label="Total Revenue"      value={dollar(revenue)}                                                  color="text-green-400" />
              <StatCard label="Avg Revenue / Sale" value={sales.length ? dollar(revenue / sales.length) : '—'}             color="text-green-400" />
              <StatCard label="Sell-Through Rate"  value={pct(sold.length, reviewed.length)}                               color="text-blue-400"
                sub={`${sold.length} sold of ${reviewed.length} reviewed`} />
              <StatCard label="AI Accuracy"        value={avgAccuracy ? Math.round(avgAccuracy * 100) + '%' : '—'}         color="text-purple-400"
                sub="avg sold ÷ AI price" />
            </div>

            {/* Sales list */}
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700 font-semibold text-sm text-gray-300">Sales History</div>
              {sales.length === 0 ? (
                <p className="p-4 text-gray-500 text-sm">No sales yet.</p>
              ) : (
                <div className="divide-y divide-gray-700">
                  {sales.map(s => {
                    const sItems  = allItems.filter(i => i.saleId === s.id);
                    const sSold   = sItems.filter(i => i.outcome === 'sold');
                    const sRev    = sSold.reduce((a, i) => a + (i.soldPrice || 0), 0);
                    return (
                      <div key={s.id} className="flex items-center justify-between px-4 py-3 gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{s.saleName}</p>
                          <p className="text-gray-500 text-xs">
                            {sItems.length} items · {sSold.length} sold · {pct(sSold.length, sItems.filter(i=>i.outcome && i.outcome!=='skip').length)} sell-through
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-green-400 font-bold text-sm">{dollar(sRev)}</p>
                          <p className="text-gray-500 text-xs">{s.status}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category breakdown */}
            {catList.length > 0 && (
              <div className="bg-gray-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-700 font-semibold text-sm text-gray-300">Category Breakdown</div>
                <div className="divide-y divide-gray-700">
                  {catList.map(({ cat, total, sold: s, sellThrough, accuracy }) => (
                    <div key={cat} className="flex items-center justify-between px-4 py-3 gap-4">
                      <div className="flex-1">
                        <p className="text-white text-sm capitalize">{cat}</p>
                        <p className="text-gray-500 text-xs">{total} items · {s} sold</p>
                      </div>
                      <div className="flex gap-4 text-right text-xs flex-shrink-0">
                        <div>
                          <p className="text-blue-400 font-semibold">{pct(s, total)}</p>
                          <p className="text-gray-500">sell-thru</p>
                        </div>
                        <div>
                          <p className="text-purple-400 font-semibold">
                            {accuracy ? Math.round(accuracy * 100) + '%' : '—'}
                          </p>
                          <p className="text-gray-500">AI acc.</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pb-6 text-center">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold text-lg py-4 px-8 rounded-2xl flex items-center gap-2 mx-auto transition-colors"
              >
                {exporting ? <Loader2 size={22} className="animate-spin" /> : <Download size={22} />}
                Download Full Excel Report
              </button>
              <p className="text-gray-500 text-xs mt-2">
                4 sheets: Sales Summary · All Items · Category Breakdown · Key Metrics
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
