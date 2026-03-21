/**
 * PrecisionPrices – Create Sale Wizard
 * Step 1: Name + date + address  →  Step 2: Add rooms  →  Done
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { createSale, addRoom } from '../lib/salesFirestore';
import { ArrowLeft, ArrowRight, Plus, X, Loader2, Home, CheckCircle } from 'lucide-react';

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

  const [step, setStep] = useState(1);
  const [saleName, setSaleName] = useState('');
  const [saleDate, setSaleDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [address, setAddress] = useState('');
  const [rooms, setRooms] = useState([]);
  const [customRoomName, setCustomRoomName] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  const addPresetRoom = (preset) => {
    if (rooms.find(r => r.name === preset.name)) return; // no duplicates
    setRooms(prev => [...prev, { ...preset, id: Date.now() + Math.random() }]);
  };

  const addCustomRoom = () => {
    const name = customRoomName.trim();
    if (!name) return;
    const emoji = '📦';
    setRooms(prev => [...prev, { name, emoji, id: Date.now() + Math.random() }]);
    setCustomRoomName('');
  };

  const removeRoom = (id) => setRooms(prev => prev.filter(r => r.id !== id));

  const goToStep2 = () => {
    if (!saleName.trim()) { setNameError('Sale name is required'); return; }
    setNameError('');
    setStep(2);
  };

  const createAndGo = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const saleId = await createSale(currentUser.uid, {
        saleName: saleName.trim(),
        saleDate,
        endDate,
        address: address.trim(),
      });
      // Add rooms in order
      for (let i = 0; i < rooms.length; i++) {
        await addRoom(saleId, rooms[i].name, i);
      }
      // Always add Unsorted room last
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
        <button
          onClick={() => step === 1 ? navigate(-1) : setStep(1)}
          className="text-gray-400 hover:text-white p-1"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">New Estate Sale</h1>
          <p className="text-gray-400 text-sm">Step {step} of 2</p>
        </div>
        {/* Step indicator */}
        <div className="flex gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-full ${step >= 1 ? 'bg-blue-400' : 'bg-gray-600'}`} />
          <div className={`w-2.5 h-2.5 rounded-full ${step >= 2 ? 'bg-blue-400' : 'bg-gray-600'}`} />
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">

        {/* ── Step 1: Sale details ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold mb-1">Sale details</h2>
              <p className="text-gray-400 text-sm">Add the basics. Only the name is required.</p>
            </div>

            {/* Sale name */}
            <div>
              <label className="text-gray-300 text-sm font-medium block mb-1.5">Sale name *</label>
              <input
                value={saleName}
                onChange={e => { setSaleName(e.target.value); setNameError(''); }}
                placeholder="e.g. Johnson Estate"
                autoFocus
                className={`w-full bg-gray-800 text-white rounded-xl px-4 py-3.5 text-base border ${nameError ? 'border-red-500' : 'border-gray-700'} focus:outline-none focus:border-blue-500`}
              />
              {nameError && <p className="text-red-400 text-xs mt-1">{nameError}</p>}
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1.5">Start date</label>
                <input
                  type="date"
                  value={saleDate}
                  onChange={e => setSaleDate(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3.5 text-sm border border-gray-700 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1.5">End date</label>
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
              <label className="text-gray-300 text-sm font-medium block mb-1.5">Address</label>
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="123 Main St, Clarksville, TN"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3.5 text-sm border border-gray-700 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={goToStep2}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-2 text-lg transition-colors mt-2"
            >
              Next: Add Rooms <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* ── Step 2: Rooms ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold mb-1">Add rooms</h2>
              <p className="text-gray-400 text-sm">Tap to add rooms. You can add more later.</p>
            </div>

            {/* Selected rooms */}
            {rooms.length > 0 && (
              <div className="bg-gray-800 rounded-2xl p-3 space-y-1">
                <p className="text-xs text-gray-500 font-semibold uppercase px-1 mb-2">{rooms.length} room{rooms.length !== 1 ? 's' : ''} added</p>
                {rooms.map(room => (
                  <div key={room.id} className="flex items-center gap-3 px-2 py-2 rounded-xl bg-black/20">
                    <span className="text-lg">{room.emoji}</span>
                    <span className="flex-1 text-sm font-medium text-white">{room.name}</span>
                    <button onClick={() => removeRoom(room.id)} className="text-gray-500 hover:text-red-400 transition-colors p-1">
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-black/20 opacity-50">
                  <span className="text-lg">📦</span>
                  <span className="flex-1 text-sm text-gray-400">Unsorted</span>
                  <span className="text-xs text-gray-600">auto-added</span>
                </div>
              </div>
            )}

            {/* Room presets */}
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Common rooms</p>
              <div className="grid grid-cols-3 gap-2">
                {ROOM_PRESETS.map(preset => {
                  const added = rooms.some(r => r.name === preset.name);
                  return (
                    <button
                      key={preset.name}
                      onClick={() => added ? removeRoom(rooms.find(r => r.name === preset.name)?.id) : addPresetRoom(preset)}
                      className={`rounded-xl py-3 px-2 flex flex-col items-center gap-1 transition-colors border ${
                        added
                          ? 'bg-blue-700 border-blue-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-750'
                      }`}
                    >
                      <span className="text-xl">{preset.emoji}</span>
                      <span className="text-xs font-medium text-center leading-tight">{preset.name}</span>
                      {added && <CheckCircle size={12} className="text-blue-300" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom room */}
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Custom room</p>
              <div className="flex gap-2">
                <input
                  value={customRoomName}
                  onChange={e => setCustomRoomName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomRoom()}
                  placeholder="e.g. Sun Room, Wine Cellar..."
                  className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={addCustomRoom}
                  disabled={!customRoomName.trim()}
                  className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white px-4 rounded-xl transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Create button */}
            <button
              onClick={createAndGo}
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:opacity-50 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-2 text-lg transition-colors mt-2"
            >
              {saving ? (
                <><Loader2 size={22} className="animate-spin" /> Creating sale…</>
              ) : (
                <><Home size={22} /> Create Sale</>
              )}
            </button>

            {rooms.length === 0 && (
              <p className="text-center text-gray-500 text-xs">
                No rooms selected — an "Unsorted" room will be created automatically.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
