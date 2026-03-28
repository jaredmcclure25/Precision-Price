/**
 * PrecisionPrices – Sales List
 * Dashboard of all estate sales — the operator's home base
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getUserSales } from '../lib/salesFirestore';
import { Plus, ArrowLeft, Home, ChevronRight, Loader2, Calendar, MapPin, Package } from 'lucide-react';

const STATUS_CONFIG = {
  drafting:   { label: 'Draft',      color: 'bg-gray-700 text-gray-300' },
  pricing:    { label: 'Pricing',    color: 'bg-blue-800 text-blue-200' },
  published:  { label: 'Published',  color: 'bg-purple-800 text-purple-200' },
  active:     { label: 'Active',     color: 'bg-green-800 text-green-200' },
  closed:     { label: 'Closed',     color: 'bg-yellow-800 text-yellow-200' },
  reviewed:   { label: 'Reviewed',   color: 'bg-gray-600 text-gray-300' },
};

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

      <div className="p-4 max-w-2xl mx-auto">
        {/* New Sale CTA */}
        <button
          onClick={() => navigate('/app/sale/new')}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 active:from-blue-700 active:to-purple-700 text-white font-bold text-lg py-5 rounded-2xl flex items-center justify-center gap-3 mb-6 shadow-lg transition-all"
        >
          <Plus size={24} /> New Estate Sale
        </button>

        {/* Sales list */}
        {sales.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="text-6xl">🏠</div>
            <h2 className="text-xl font-bold text-white">No sales yet</h2>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              Create your first sale to start organizing items by room, pricing with AI, and publishing to multiple channels.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sales.map(sale => {
              const cfg = STATUS_CONFIG[sale.status] || STATUS_CONFIG.drafting;
              const date = sale.saleDate ? new Date(sale.saleDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
              return (
                <button
                  key={sale.id}
                  onClick={() => navigate(`/app/sale/${sale.id}`)}
                  className="w-full bg-gray-800 hover:bg-gray-750 active:bg-gray-700 rounded-2xl p-4 flex items-center gap-4 text-left transition-colors border border-gray-700 hover:border-gray-600"
                >
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-700 to-purple-700 flex items-center justify-center text-2xl flex-shrink-0">
                    🏠
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white truncate">{sale.saleName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      {date && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {date}
                        </span>
                      )}
                      {sale.address && (
                        <span className="flex items-center gap-1 truncate max-w-[140px]">
                          <MapPin size={11} /> {sale.address.split(',')[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span>{sale.totalRooms || 0} rooms</span>
                      <span>·</span>
                      <span>{sale.totalItems || 0} items</span>
                      {sale.totalRevenue > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-green-400">${sale.totalRevenue}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-600 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
