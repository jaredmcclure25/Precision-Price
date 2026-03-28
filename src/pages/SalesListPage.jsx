/**
 * PrecisionPrices – Sales List
 * Dashboard of all estate sales — the operator's home base
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getUserSales } from '../lib/salesFirestore';
import { Plus, ArrowLeft, ChevronRight, Loader2, Calendar, MapPin, Home, Clock } from 'lucide-react';

const STATUS_CONFIG = {
  drafting:   { label: 'Draft',      color: 'bg-gray-700 text-gray-300',       dot: 'bg-gray-400' },
  pricing:    { label: 'Pricing',    color: 'bg-blue-800 text-blue-200',        dot: 'bg-blue-400' },
  published:  { label: 'Published',  color: 'bg-purple-800 text-purple-200',    dot: 'bg-purple-400' },
  active:     { label: 'Active',     color: 'bg-green-800 text-green-200',      dot: 'bg-green-400' },
  closed:     { label: 'Closed',     color: 'bg-yellow-800 text-yellow-200',    dot: 'bg-yellow-400' },
  reviewed:   { label: 'Reviewed',   color: 'bg-gray-600 text-gray-300',        dot: 'bg-gray-500' },
};

const IN_PROGRESS = new Set(['drafting', 'pricing', 'published', 'active']);
const DONE = new Set(['closed', 'reviewed']);

function timeAgo(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d)) return null;
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60)     return 'just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SaleCard({ sale, onClick }) {
  const cfg = STATUS_CONFIG[sale.status] || STATUS_CONFIG.drafting;
  const date = sale.saleDate
    ? new Date(sale.saleDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  const lastActive = timeAgo(sale.updatedAt || sale.createdAt);
  const hasItems = (sale.totalItems || 0) > 0;

  return (
    <button
      onClick={onClick}
      className="w-full bg-gray-800 hover:bg-gray-750 active:bg-gray-700 rounded-2xl p-4 text-left transition-colors border border-gray-700 hover:border-gray-600"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-700 to-purple-700 flex items-center justify-center text-2xl flex-shrink-0">
          🏠
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + status */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-white truncate">{sale.saleName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1 ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>

          {/* Date + address */}
          <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap mb-2">
            {date && (
              <span className="flex items-center gap-1">
                <Calendar size={11} /> {date}
              </span>
            )}
            {sale.address && (
              <span className="flex items-center gap-1 truncate max-w-[160px]">
                <MapPin size={11} /> {sale.address.split(',')[0]}
              </span>
            )}
          </div>

          {/* Progress bar + stats */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="text-white font-semibold">{sale.totalRooms || 0}</span> rooms
            <span>·</span>
            <span className="text-white font-semibold">{sale.totalItems || 0}</span> items
            {sale.totalRevenue > 0 && (
              <>
                <span>·</span>
                <span className="text-green-400 font-semibold">${sale.totalRevenue.toLocaleString()}</span>
              </>
            )}
          </div>

          {/* Progress indicator for in-progress sales */}
          {IN_PROGRESS.has(sale.status) && (
            <div className="mt-2">
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div
                  className="bg-blue-500 h-1 rounded-full transition-all"
                  style={{ width: hasItems ? `${Math.min(100, ((sale.totalItems || 0) / Math.max(1, (sale.totalRooms || 1) * 8)) * 100)}%` : '5%' }}
                />
              </div>
              <p className="text-gray-600 text-xs mt-1 flex items-center gap-1">
                <Clock size={10} /> {lastActive ? `Updated ${lastActive}` : 'Just created'}
              </p>
            </div>
          )}
        </div>

        <ChevronRight size={18} className="text-gray-600 flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

export default function SalesListPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    getUserSales(currentUser.uid).then(s => {
      setSales(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    );
  }

  const inProgress = sales.filter(s => IN_PROGRESS.has(s.status));
  const done       = sales.filter(s => DONE.has(s.status));

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
        <button onClick={() => navigate('/app')} className="text-gray-400 hover:text-white p-1">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">My Estate Sales</h1>
          <p className="text-gray-400 text-sm">{sales.length} sale{sales.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto pb-8">
        {/* New Sale CTA */}
        <button
          onClick={() => navigate('/app/sale/new')}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-lg py-5 rounded-2xl flex items-center justify-center gap-3 mb-6 shadow-lg transition-all"
        >
          <Plus size={24} /> New Estate Sale
        </button>

        {sales.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="text-6xl">🏠</div>
            <h2 className="text-xl font-bold text-white">No sales yet</h2>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              Create a sale to start organizing rooms, scanning items with AI, and printing price labels.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* In-progress */}
            {inProgress.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide px-1">In Progress</p>
                {inProgress.map(sale => (
                  <SaleCard key={sale.id} sale={sale} onClick={() => navigate(`/app/sale/${sale.id}`)} />
                ))}
              </div>
            )}

            {/* Completed */}
            {done.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide px-1">Completed</p>
                {done.map(sale => (
                  <SaleCard key={sale.id} sale={sale} onClick={() => navigate(`/app/sale/${sale.id}`)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
