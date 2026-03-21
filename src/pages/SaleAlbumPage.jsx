/**
 * PrecisionPrices – Sale Album Page
 * Room cards + category toggle — the operator's command center for one sale
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  getSale, getRooms, getSaleItems, addRoom, updateRoom, deleteRoom
} from '../lib/salesFirestore';
import {
  ArrowLeft, Plus, ChevronRight, Loader2, LayoutGrid, Tag,
  MoreHorizontal, Edit2, Trash2, CheckCircle, X, Settings
} from 'lucide-react';

const ROOM_EMOJIS = {
  'Living Room': '🛋️', 'Kitchen': '🍳', 'Master Bedroom': '🛏️', 'Bedroom': '🛏️',
  'Bathroom': '🚿', 'Dining Room': '🪑', 'Garage': '🔧', 'Basement': '📦',
  'Attic': '🏚️', 'Office': '💼', 'Kids Room': '🧸', 'Outdoor': '🌿',
  'Unsorted': '📦',
};

const CATEGORY_META = {
  furniture: { label: 'Furniture', emoji: '🛋️' },
  kitchenware: { label: 'Kitchenware', emoji: '🍳' },
  collectibles: { label: 'Collectibles', emoji: '🏺' },
  electronics: { label: 'Electronics', emoji: '📱' },
  tools: { label: 'Tools', emoji: '🔧' },
  clothing: { label: 'Clothing', emoji: '👗' },
  books: { label: 'Books', emoji: '📚' },
  art: { label: 'Art', emoji: '🎨' },
  jewelry: { label: 'Jewelry', emoji: '💍' },
  toys: { label: 'Toys', emoji: '🧸' },
  outdoor: { label: 'Outdoor', emoji: '🌿' },
  other: { label: 'Other', emoji: '📦' },
};

const STATUS_CONFIG = {
  drafting:  { label: 'Draft',     color: 'bg-gray-700 text-gray-300' },
  pricing:   { label: 'Pricing',   color: 'bg-blue-800 text-blue-200' },
  published: { label: 'Published', color: 'bg-purple-800 text-purple-200' },
  active:    { label: 'Active',    color: 'bg-green-800 text-green-200' },
  closed:    { label: 'Closed',    color: 'bg-yellow-800 text-yellow-200' },
  reviewed:  { label: 'Reviewed',  color: 'bg-gray-600 text-gray-300' },
};

export default function SaleAlbumPage() {
  const { saleId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [sale, setSale] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('room'); // 'room' | 'category'

  // Add room UI state
  const [addingRoom, setAddingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [savingRoom, setSavingRoom] = useState(false);

  const load = useCallback(async () => {
    if (!saleId) return;
    try {
      const [saleData, roomsData, itemsData] = await Promise.all([
        getSale(saleId),
        getRooms(saleId),
        getSaleItems(saleId),
      ]);
      setSale(saleData);
      setRooms(roomsData);
      setAllItems(itemsData);
    } catch (_) {}
    finally { setLoading(false); }
  }, [saleId]);

  useEffect(() => { load(); }, [load]);

  const handleAddRoom = async () => {
    const name = newRoomName.trim();
    if (!name || !saleId) return;
    setSavingRoom(true);
    try {
      const roomId = await addRoom(saleId, name, rooms.length);
      setRooms(prev => [...prev, { id: roomId, name, sortOrder: rooms.length, itemCount: 0, totalValue: 0 }]);
      // Update local sale room count
      setSale(prev => prev ? { ...prev, totalRooms: (prev.totalRooms || 0) + 1 } : prev);
    } catch (_) {}
    finally {
      setSavingRoom(false);
      setNewRoomName('');
      setAddingRoom(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4 text-white">
        <p className="text-gray-400">Sale not found</p>
        <button onClick={() => navigate('/app/sales')} className="text-blue-400">← Back to sales</button>
      </div>
    );
  }

  const totalValue = allItems.reduce((s, i) => s + (i.selectedPrice ?? i.aiPriceMedium ?? 0), 0);
  const statusCfg = STATUS_CONFIG[sale.status] || STATUS_CONFIG.drafting;

  // Category grouping
  const byCategory = allItems.reduce((acc, item) => {
    const c = item.category || item.aiCategory || 'other';
    if (!acc[c]) acc[c] = [];
    acc[c].push(item);
    return acc;
  }, {});
  const sortedCategories = Object.keys(byCategory).sort();

  const dateStr = sale.saleDate
    ? new Date(sale.saleDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;
  const endDateStr = sale.endDate && sale.endDate !== sale.saleDate
    ? '–' + new Date(sale.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : sale.saleDate
    ? new Date(sale.saleDate + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900 z-10 border-b border-gray-800">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => navigate('/app/sales')} className="text-gray-400 hover:text-white p-1">
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold truncate">{sale.saleName}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusCfg.color}`}>{statusCfg.label}</span>
            </div>
            {(dateStr || sale.address) && (
              <p className="text-gray-400 text-xs truncate">
                {dateStr && `${dateStr}${endDateStr ? ' ' + endDateStr : ''}`}
                {dateStr && sale.address && ' · '}
                {sale.address && sale.address.split(',')[0]}
              </p>
            )}
          </div>
          <button
            onClick={() => navigate(`/app/sale/${saleId}/publish`)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors flex-shrink-0"
          >
            Publish
          </button>
        </div>

        {/* Stats row */}
        <div className="flex gap-4 px-4 pb-3 text-sm text-gray-400">
          <span><span className="text-white font-semibold">{sale.totalRooms || rooms.length}</span> rooms</span>
          <span><span className="text-white font-semibold">{sale.totalItems || allItems.length}</span> items</span>
          <span><span className="text-green-400 font-semibold">${totalValue}</span> est.</span>
        </div>

        {/* View toggle */}
        <div className="flex gap-2 px-4 pb-3">
          <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('room')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${viewMode === 'room' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <LayoutGrid size={13} /> Rooms
            </button>
            <button
              onClick={() => setViewMode('category')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${viewMode === 'category' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Tag size={13} /> Categories
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto pb-24">

        {/* ── Room View ── */}
        {viewMode === 'room' && (
          <div className="space-y-3">
            {rooms.length === 0 && !addingRoom ? (
              <div className="text-center py-10 space-y-3">
                <div className="text-5xl">🏠</div>
                <p className="text-gray-400 text-sm">No rooms yet. Add rooms to start organizing items.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {rooms.map(room => {
                  const emoji = ROOM_EMOJIS[room.name] || '📦';
                  const itemsInRoom = allItems.filter(i => i.roomId === room.id);
                  const roomValue = itemsInRoom.reduce((s, i) => s + (i.selectedPrice ?? i.aiPriceMedium ?? 0), 0);
                  return (
                    <button
                      key={room.id}
                      onClick={() => navigate(`/app/sale/${saleId}/room/${room.id}`)}
                      className="bg-gray-800 hover:bg-gray-750 active:bg-gray-700 rounded-2xl p-4 text-left transition-colors border border-gray-700 hover:border-gray-600 space-y-2"
                    >
                      <div className="text-3xl">{emoji}</div>
                      <div>
                        <p className="font-bold text-sm text-white leading-tight">{room.name}</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {itemsInRoom.length} item{itemsInRoom.length !== 1 ? 's' : ''}
                          {roomValue > 0 && ` · $${roomValue}`}
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-gray-600" />
                    </button>
                  );
                })}

                {/* Add room tile */}
                {!addingRoom && (
                  <button
                    onClick={() => setAddingRoom(true)}
                    className="bg-gray-800 border-2 border-dashed border-gray-600 hover:border-gray-400 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-gray-300 transition-colors min-h-[120px]"
                  >
                    <Plus size={24} />
                    <span className="text-xs font-medium">Add Room</span>
                  </button>
                )}
              </div>
            )}

            {/* Add room inline */}
            {addingRoom && (
              <div className="bg-gray-800 rounded-2xl p-4 space-y-3 border border-blue-600">
                <p className="text-sm font-semibold text-blue-300">Add a room</p>
                <input
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddRoom()}
                  placeholder="e.g. Sun Room, Library..."
                  autoFocus
                  className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddRoom}
                    disabled={savingRoom || !newRoomName.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {savingRoom ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Add Room
                  </button>
                  <button
                    onClick={() => { setAddingRoom(false); setNewRoomName(''); }}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 rounded-xl transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Category View ── */}
        {viewMode === 'category' && (
          <div className="space-y-3">
            {allItems.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <div className="text-5xl">📦</div>
                <p className="text-gray-400 text-sm">No items priced yet. Go into a room to add photos.</p>
              </div>
            ) : (
              sortedCategories.map(cat => {
                const meta = CATEGORY_META[cat] || { label: cat, emoji: '📦' };
                const items = byCategory[cat];
                const catValue = items.reduce((s, i) => s + (i.selectedPrice ?? i.aiPriceMedium ?? 0), 0);
                return (
                  <div key={cat} className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
                      <span className="text-xl">{meta.emoji}</span>
                      <span className="font-bold text-white flex-1">{meta.label}</span>
                      <span className="text-sm text-gray-400">{items.length} items</span>
                      <span className="text-sm text-green-400 font-semibold">${catValue}</span>
                    </div>
                    <div className="divide-y divide-gray-700/50">
                      {items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{item.itemName || item.aiItemName || 'Unknown item'}</p>
                            <p className="text-xs text-gray-500">{item.condition || item.aiCondition}</p>
                          </div>
                          <span className="text-sm font-bold text-white flex-shrink-0">
                            ${item.selectedPrice ?? item.aiPriceMedium ?? 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={() => navigate(`/app/sale/${saleId}/publish`)}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-colors text-sm"
          >
            Publish & Print Labels
          </button>
          <button
            onClick={() => navigate(`/app/sale/${saleId}/review`)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 rounded-2xl transition-colors text-sm"
          >
            Post-Sale Review
          </button>
        </div>
      </div>
    </div>
  );
}
