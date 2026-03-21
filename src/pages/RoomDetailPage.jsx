/**
 * PrecisionPrices – Room Detail Page
 * Photo grid of items in one room + Add Photos CTA
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getSale, getRoom, getRoomItems, updateRoom, deleteRoom
} from '../lib/salesFirestore';
import {
  ArrowLeft, Plus, Camera, DollarSign, Loader2, Edit2, Save, X, Trash2
} from 'lucide-react';

const CATEGORY_COLORS = {
  furniture: 'bg-amber-900/60 text-amber-300',
  kitchenware: 'bg-orange-900/60 text-orange-300',
  collectibles: 'bg-purple-900/60 text-purple-300',
  electronics: 'bg-blue-900/60 text-blue-300',
  tools: 'bg-gray-700 text-gray-300',
  clothing: 'bg-pink-900/60 text-pink-300',
  books: 'bg-green-900/60 text-green-300',
  art: 'bg-rose-900/60 text-rose-300',
  jewelry: 'bg-yellow-900/60 text-yellow-300',
  toys: 'bg-lime-900/60 text-lime-300',
  outdoor: 'bg-emerald-900/60 text-emerald-300',
  other: 'bg-gray-800 text-gray-400',
};

export default function RoomDetailPage() {
  const { saleId, roomId } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [sale, setSale] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const load = useCallback(async () => {
    try {
      const [saleData, roomData, itemsData] = await Promise.all([
        getSale(saleId),
        getRoom(saleId, roomId),
        getRoomItems(saleId, roomId),
      ]);
      setSale(saleData);
      setRoom(roomData);
      setRoomName(roomData?.name || '');
      setItems(itemsData);
    } catch (_) {}
    finally { setLoading(false); }
  }, [saleId, roomId]);

  useEffect(() => { load(); }, [load]);

  const saveRoomName = async () => {
    if (!roomName.trim() || roomName === room?.name) { setEditingName(false); return; }
    setSavingName(true);
    try {
      await updateRoom(saleId, roomId, { name: roomName.trim() });
      setRoom(prev => prev ? { ...prev, name: roomName.trim() } : prev);
    } catch (_) {}
    finally { setSavingName(false); setEditingName(false); }
  };

  const totalValue = items.reduce((s, i) => s + (i.selectedPrice ?? i.aiPriceMedium ?? 0), 0);

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
        <button onClick={() => navigate(`/app/sale/${saleId}`)} className="text-gray-400 hover:text-white p-1">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveRoomName()}
                autoFocus
                className="flex-1 bg-gray-800 text-white text-lg font-bold rounded-lg px-3 py-1 border border-blue-500 focus:outline-none"
              />
              <button onClick={saveRoomName} disabled={savingName} className="text-green-400">
                {savingName ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              </button>
              <button onClick={() => { setRoomName(room?.name || ''); setEditingName(false); }} className="text-gray-500">
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold truncate">{room?.name || 'Room'}</h1>
              <button onClick={() => setEditingName(true)} className="text-gray-600 hover:text-gray-300 flex-shrink-0">
                <Edit2 size={15} />
              </button>
            </div>
          )}
          <p className="text-gray-400 text-xs">{sale?.saleName} · {items.length} items{totalValue > 0 ? ` · $${totalValue}` : ''}</p>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto pb-28">

        {/* Add Photos CTA — always at top */}
        <button
          onClick={() => navigate(`/app/bulk?saleId=${saleId}&roomId=${roomId}`)}
          className="w-full mb-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 active:from-blue-700 active:to-purple-700 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 text-lg shadow-lg transition-all"
        >
          <Camera size={24} /> Add Photos to Room
        </button>

        {/* Items grid */}
        {items.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="text-5xl">📸</div>
            <h3 className="text-white font-bold">No items yet</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              Tap "Add Photos to Room" to snap photos. AI will identify and price everything automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => {
              const cat = item.category || item.aiCategory || 'other';
              const catColor = CATEGORY_COLORS[cat] || CATEGORY_COLORS.other;
              const price = item.selectedPrice ?? item.aiPriceMedium ?? 0;
              return (
                <div key={item.id} className="bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-3 border border-gray-700">
                  {item.previewUrl && (
                    <img src={item.previewUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" onError={e => e.target.style.display='none'} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.itemName || item.aiItemName || 'Unknown item'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${catColor}`}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </span>
                      {item.condition && <span className="text-xs text-gray-500">{item.condition}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-white font-bold">${price}</div>
                    <div className="text-xs text-gray-500">${item.aiPriceLow}–${item.aiPriceHigh}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(`/app/bulk?saleId=${saleId}&roomId=${roomId}`)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
          >
            <Camera size={20} /> Add Photos to this Room
          </button>
        </div>
      </div>
    </div>
  );
}
