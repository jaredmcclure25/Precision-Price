/**
 * PrecisionPrices – Sale Album Page
 * Command center for one sale: Rooms · Categories · All Items
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  getSale, getRooms, getSaleItems, addRoom, updateItemPrice,
} from '../lib/salesFirestore';
import {
  ArrowLeft, Plus, ChevronRight, Loader2, LayoutGrid, Tag, List,
  ScanLine, Camera, X,
} from 'lucide-react';

const ROOM_EMOJIS = {
  'Living Room': '🛋️', 'Kitchen': '🍳', 'Master Bedroom': '🛏️', 'Bedroom': '🛏️',
  'Bathroom': '🚿', 'Dining Room': '🪑', 'Garage': '🔧', 'Basement': '📦',
  'Attic': '🏚️', 'Office': '💼', 'Kids Room': '🧸', 'Outdoor': '🌿',
  'Unsorted': '📦',
};

const CATEGORY_META = {
  furniture:    { label: 'Furniture',   emoji: '🛋️' },
  kitchenware:  { label: 'Kitchenware', emoji: '🍳' },
  collectibles: { label: 'Collectibles',emoji: '🏺' },
  electronics:  { label: 'Electronics', emoji: '📱' },
  tools:        { label: 'Tools',       emoji: '🔧' },
  clothing:     { label: 'Clothing',    emoji: '👗' },
  books:        { label: 'Books',       emoji: '📚' },
  art:          { label: 'Art',         emoji: '🎨' },
  jewelry:      { label: 'Jewelry',     emoji: '💍' },
  toys:         { label: 'Toys',        emoji: '🧸' },
  outdoor:      { label: 'Outdoor',     emoji: '🌿' },
  other:        { label: 'Other',       emoji: '📦' },
};

const CATEGORY_COLORS = {
  furniture: 'bg-amber-900/60 text-amber-300', kitchenware: 'bg-orange-900/60 text-orange-300',
  collectibles: 'bg-purple-900/60 text-purple-300', electronics: 'bg-blue-900/60 text-blue-300',
  tools: 'bg-gray-700 text-gray-300', clothing: 'bg-pink-900/60 text-pink-300',
  books: 'bg-green-900/60 text-green-300', art: 'bg-rose-900/60 text-rose-300',
  jewelry: 'bg-yellow-900/60 text-yellow-300', toys: 'bg-lime-900/60 text-lime-300',
  outdoor: 'bg-emerald-900/60 text-emerald-300', other: 'bg-gray-800 text-gray-400',
};

const STATUS_CONFIG = {
  drafting:  { label: 'Draft',     color: 'bg-gray-700 text-gray-300' },
  pricing:   { label: 'Pricing',   color: 'bg-blue-800 text-blue-200' },
  published: { label: 'Published', color: 'bg-purple-800 text-purple-200' },
  active:    { label: 'Active',    color: 'bg-green-800 text-green-200' },
  closed:    { label: 'Closed',    color: 'bg-yellow-800 text-yellow-200' },
  reviewed:  { label: 'Reviewed',  color: 'bg-gray-600 text-gray-300' },
};

// ── Inline price tier selector (used in All Items tab) ────────────────────────
function TierSelector({ item, saleId, onUpdate }) {
  const prices = {
    low:    item.aiPriceLow    ?? null,
    medium: item.aiPriceMedium ?? null,
    high:   item.aiPriceHigh   ?? null,
  };
  const [tier, setTier] = useState(() => {
    if (item.selectedPrice == null) return 'medium';
    if (item.selectedPrice === prices.low)  return 'low';
    if (item.selectedPrice === prices.high) return 'high';
    return 'medium';
  });
  if (!prices.low || !prices.medium || !prices.high) {
    return <span className="text-white font-bold text-sm">${item.selectedPrice ?? item.aiPriceMedium ?? 0}</span>;
  }
  const select = async (t) => {
    const p = prices[t];
    setTier(t);
    onUpdate(item.id, p);
    try { await updateItemPrice(saleId, item.id, p); } catch (_) {}
  };
  return (
    <div className="flex gap-1">
      {[['low','L'], ['medium','T'], ['high','H']].map(([t, lbl]) => (
        <button
          key={t}
          onClick={e => { e.stopPropagation(); select(t); }}
          className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
            tier === t ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          {lbl}<span className="opacity-60 ml-0.5">${prices[t]}</span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SaleAlbumPage() {
  const { saleId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [sale, setSale]       = useState(null);
  const [rooms, setRooms]     = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('room'); // 'room' | 'category' | 'items'

  const [addingRoom, setAddingRoom]     = useState(false);
  const [newRoomName, setNewRoomName]   = useState('');
  const [savingRoom, setSavingRoom]     = useState(false);
  const [itemSearch, setItemSearch]     = useState('');

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
      setSale(prev => prev ? { ...prev, totalRooms: (prev.totalRooms || 0) + 1 } : prev);
    } catch (_) {}
    finally { setSavingRoom(false); setNewRoomName(''); setAddingRoom(false); }
  };

  const updateLocalItemPrice = (itemId, price) => {
    setAllItems(prev => prev.map(i => i.id === itemId ? { ...i, selectedPrice: price } : i));
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

  const totalValue     = allItems.reduce((s, i) => s + (i.selectedPrice ?? i.aiPriceMedium ?? 0), 0);
  const statusCfg      = STATUS_CONFIG[sale.status] || STATUS_CONFIG.drafting;

  // Category grouping
  const byCategory     = allItems.reduce((acc, item) => {
    const c = item.category || item.aiCategory || 'other';
    if (!acc[c]) acc[c] = [];
    acc[c].push(item);
    return acc;
  }, {});
  const sortedCategories = Object.keys(byCategory).sort();

  // Room name lookup for All Items tab
  const roomNameById = Object.fromEntries(rooms.map(r => [r.id, r.name]));

  // Filtered items for All Items tab
  const filteredItems = itemSearch.trim()
    ? allItems.filter(i => (i.itemName || i.aiItemName || '').toLowerCase().includes(itemSearch.toLowerCase()))
    : allItems;

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
          <span><span className="text-white font-semibold">{rooms.length}</span> rooms</span>
          <span><span className="text-white font-semibold">{allItems.length}</span> items</span>
          <span><span className="text-green-400 font-semibold">${totalValue.toLocaleString()}</span> est.</span>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-gray-800 rounded-xl p-1 mx-4 mb-3">
          {[
            { id: 'room',     icon: <LayoutGrid size={12} />, label: 'Rooms' },
            { id: 'category', icon: <Tag size={12} />,        label: 'Categories' },
            { id: 'items',    icon: <List size={12} />,       label: `All Items${allItems.length ? ` (${allItems.length})` : ''}` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === tab.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
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
              <div className="space-y-3">
                {rooms.map(room => {
                  const emoji = ROOM_EMOJIS[room.name] || '📦';
                  const itemsInRoom = allItems.filter(i => i.roomId === room.id);
                  const roomValue   = itemsInRoom.reduce((s, i) => s + (i.selectedPrice ?? i.aiPriceMedium ?? 0), 0);
                  const isEmpty     = itemsInRoom.length === 0;
                  return (
                    <div
                      key={room.id}
                      className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden"
                    >
                      {/* Main tap area */}
                      <button
                        onClick={() => navigate(`/app/sale/${saleId}/room/${room.id}`)}
                        className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-750 transition-colors"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${isEmpty ? 'bg-gray-700' : 'bg-gray-700'}`}>
                          {emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white">{room.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {isEmpty
                              ? <span className="text-yellow-500/80">No items yet</span>
                              : <>{itemsInRoom.length} item{itemsInRoom.length !== 1 ? 's' : ''}{roomValue > 0 ? ` · $${roomValue.toLocaleString()}` : ''}</>
                            }
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-gray-600 flex-shrink-0" />
                      </button>

                      {/* Quick action bar */}
                      <div className="flex border-t border-gray-700/60">
                        <button
                          onClick={() => navigate(`/app/sale/${saleId}/room/${room.id}/scan`)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-blue-400 hover:bg-blue-900/20 text-xs font-semibold transition-colors"
                        >
                          <ScanLine size={14} /> Scan Room
                        </button>
                        <div className="w-px bg-gray-700/60" />
                        <button
                          onClick={() => navigate(`/app/bulk?saleId=${saleId}&roomId=${room.id}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-gray-400 hover:bg-gray-700/40 text-xs font-semibold transition-colors"
                        >
                          <Camera size={14} /> Add Items
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add room tile */}
                {!addingRoom && (
                  <button
                    onClick={() => setAddingRoom(true)}
                    className="w-full bg-gray-800 border-2 border-dashed border-gray-600 hover:border-gray-400 rounded-2xl p-4 flex items-center justify-center gap-2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <Plus size={20} />
                    <span className="text-sm font-medium">Add Room</span>
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
                <p className="text-gray-400 text-sm">No items yet. Scan a room to start.</p>
              </div>
            ) : (
              sortedCategories.map(cat => {
                const meta     = CATEGORY_META[cat] || { label: cat, emoji: '📦' };
                const items    = byCategory[cat];
                const catValue = items.reduce((s, i) => s + (i.selectedPrice ?? i.aiPriceMedium ?? 0), 0);
                return (
                  <div key={cat} className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
                      <span className="text-xl">{meta.emoji}</span>
                      <span className="font-bold text-white flex-1">{meta.label}</span>
                      <span className="text-sm text-gray-400">{items.length} items</span>
                      <span className="text-sm text-green-400 font-semibold">${catValue.toLocaleString()}</span>
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

        {/* ── All Items View ── */}
        {viewMode === 'items' && (
          <div className="space-y-3">
            {allItems.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <div className="text-5xl">📦</div>
                <p className="text-gray-400 text-sm">No items yet. Go into a room and scan to add items.</p>
              </div>
            ) : (
              <>
                {/* Search */}
                <input
                  value={itemSearch}
                  onChange={e => setItemSearch(e.target.value)}
                  placeholder={`Search ${allItems.length} items…`}
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-blue-500"
                />

                {/* Items list */}
                <div className="space-y-2">
                  {filteredItems.map(item => {
                    const cat      = item.category || item.aiCategory || 'other';
                    const catColor = CATEGORY_COLORS[cat] || CATEGORY_COLORS.other;
                    const roomName = item.roomId ? (roomNameById[item.roomId] || 'Unknown room') : null;
                    return (
                      <div key={item.id} className="bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                          {item.thumbnailDataUrl ? (
                            <img src={item.thumbnailDataUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-base flex-shrink-0">📦</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {item.itemName || item.aiItemName || 'Unknown item'}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${catColor}`}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                              </span>
                              {roomName && (
                                <span className="text-xs text-gray-500">{roomName}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <TierSelector item={item} saleId={saleId} onUpdate={updateLocalItemPrice} />
                      </div>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <p className="text-center text-gray-500 text-sm py-6">No items match "{itemSearch}"</p>
                  )}
                </div>
              </>
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
