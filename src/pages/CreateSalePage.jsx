/**
 * PrecisionPrices – Create Sale Page
 * Single step: all fields optional with soft hints. Rooms are optional too.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { createSale, addRoom } from '../lib/salesFirestore';
import { ArrowLeft, Plus, X, Loader2, Home, CheckCircle } from 'lucide-react';

const ROOM_PRESETS = [
  { name: 'Living Room',    emoji: '🛋️' },
  { name: 'Kitchen',        emoji: '🍳' },
  { name: 'Master Bedroom', emoji: '🛏️' },
  { name: 'Bedroom',        emoji: '🛏️' },
  { name: 'Bathroom',       emoji: '🚿' },
  { name: 'Dining Room',    emoji: '🪑' },
  { name: 'Garage',         emoji: '🔧' },
  { name: 'Basement',       emoji: '📦' },
  { name: 'Attic',          emoji: '🏚️' },
  { name: 'Office',         emoji: '💼' },
  { name: 'Kids Room',      emoji: '🧸' },
  { name: 'Outdoor',        emoji: '🌿' },
];

export default function CreateSalePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [saleName, setSaleName]         = useState('');
  const [saleDate, setSaleDate]         = useState('');
  const [endDate, setEndDate]           = useState('');
  const [address, setAddress]           = useState('');
  const [rooms, setRooms]               = useState([]);
  const [customRoomName, setCustomRoomName] = useState('');
  const [saving, setSaving]             = useState(false);

  const addPresetRoom = (preset) => {
    if (rooms.find(r => r.name === preset.name)) return;
    setRooms(prev => [...prev, { ...preset, id: Date.now() + Math.random() }]);
  };

  const addCustomRoom = () => {
    const name = customRoomName.trim();
    if (!name) return;
    setRooms(prev => [...prev, { name, emoji: '📦', id: Date.now() + Math.random() }]);
    setCustomRoomName('');
  };

  const removeRoom = (id) => setRooms(prev => prev.filter(r => r.id !== id));

  const createAndGo = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const saleId = await createSale(currentUser.uid, {
        saleName: saleName.trim() || undefined,
        saleDate,
        endDate,
        address: address.trim(),
      });
      for (let i = 0; i < rooms.length; i++) {
        await addRoom(saleId, rooms[i].name, i);
      }
      await addRoom(saleId, 'Unsorted', rooms.length);
      navigate(`/app/sale/${saleId}`);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white p-1">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">New Estate Sale</h1>
          <p className="text-gray-400 text-sm">Everything is optional — fill in what you have</p>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6 pb-28">

        {/* Sale name */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-gray-300 text-sm font-medium">Sale name</label>
            <span className="text-xs text-blue-400/70">Recommended</span>
          </div>
          <input
            value={saleName}
            onChange={e => setSaleName(e.target.value)}
            placeholder="e.g. Johnson Estate"
            autoFocus
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3.5 text-base border border-gray-700 focus:outline-none focus:border-blue-500"
          />
          <p className="text-gray-600 text-xs mt-1">Auto-generates today's date if left blank</p>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-gray-300 text-sm font-medium">Start date</label>
              <span className="text-xs text-blue-400/70">Recommended</span>
            </div>
            <input
              type="date"
              value={saleDate}
              onChange={e => setSaleDate(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3.5 text-sm border border-gray-700 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-gray-300 text-sm font-medium">End date</label>
              <span className="text-xs text-gray-600">Optional</span>
            </div>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3.5 text-sm border border-gray-700 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-gray-300 text-sm font-medium">Address</label>
            <span className="text-xs text-blue-400/70">Recommended</span>
          </div>
          <input
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="123 Main St, Clarksville, TN"
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3.5 text-sm border border-gray-700 focus:outline-none focus:border-blue-500"
          />
          <p className="text-gray-600 text-xs mt-1">Helps with EstateSales.NET publishing and directions</p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800" />

        {/* Rooms section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-gray-300 font-medium text-sm">Rooms</p>
              <p className="text-gray-600 text-xs">Tap to add — you can add more later</p>
            </div>
            <span className="text-xs text-gray-600">Optional</span>
          </div>

          {/* Preset grid */}
          <div className="grid grid-cols-4 gap-2">
            {ROOM_PRESETS.map(preset => {
              const added = rooms.some(r => r.name === preset.name);
              return (
                <button
                  key={preset.name}
                  onClick={() => added ? removeRoom(rooms.find(r => r.name === preset.name)?.id) : addPresetRoom(preset)}
                  className={`rounded-xl py-2.5 px-1 flex flex-col items-center gap-1 transition-colors border ${
                    added
                      ? 'bg-blue-700 border-blue-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <span className="text-lg">{preset.emoji}</span>
                  <span className="text-xs font-medium text-center leading-tight">{preset.name}</span>
                  {added && <CheckCircle size={10} className="text-blue-300" />}
                </button>
              );
            })}
          </div>

          {/* Selected rooms list */}
          {rooms.length > 0 && (
            <div className="mt-3 bg-gray-800/60 rounded-2xl p-3 space-y-1">
              <p className="text-xs text-gray-500 font-semibold uppercase px-1 mb-1.5">{rooms.length} room{rooms.length !== 1 ? 's' : ''} selected</p>
              {rooms.map(room => (
                <div key={room.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
                  <span className="text-base">{room.emoji}</span>
                  <span className="flex-1 text-sm text-white">{room.name}</span>
                  <button onClick={() => removeRoom(room.id)} className="text-gray-600 hover:text-red-400 p-0.5">
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg opacity-40">
                <span className="text-base">📦</span>
                <span className="flex-1 text-sm text-gray-400">Unsorted</span>
                <span className="text-xs text-gray-600">auto</span>
              </div>
            </div>
          )}

          {/* Custom room */}
          <div className="flex gap-2 mt-3">
            <input
              value={customRoomName}
              onChange={e => setCustomRoomName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomRoom()}
              placeholder="Custom room (Sun Room, Wine Cellar…)"
              className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={addCustomRoom}
              disabled={!customRoomName.trim()}
              className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white px-4 rounded-xl transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={createAndGo}
            disabled={saving}
            className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:opacity-50 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-2 text-lg transition-colors"
          >
            {saving ? (
              <><Loader2 size={22} className="animate-spin" /> Creating sale…</>
            ) : (
              <><Home size={22} /> Create Sale</>
            )}
          </button>
          {rooms.length === 0 && (
            <p className="text-center text-gray-600 text-xs mt-2">
              An "Unsorted" room will be created automatically
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
