/**
 * PrecisionPrices – Room Scan Page
 * Take up to 4 room photos → AI identifies every item → auto-saves to room
 * Route: /app/sale/:saleId/room/:roomId/scan
 */
import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addRoomItems } from '../lib/salesFirestore';
import { useAuth } from '../AuthContext';
import { Camera, X, Zap, ArrowLeft, AlertCircle, Plus, ScanLine } from 'lucide-react';

const MAX_PHOTOS = 4;
const BACKEND = import.meta.env.VITE_BACKEND_URL || '';

// ─── Image helpers ─────────────────────────────────────────────────────────────
async function compressImage(file, maxWidth = 1200) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(resolve, 'image/jpeg', 0.75);
    };
    img.src = url;
  });
}

async function toBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Generate a small square thumbnail data URL (100×100 JPEG) from a File
async function generateThumbnail(file, size = 100) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.5));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

// ─── Room scan prompt ──────────────────────────────────────────────────────────
function buildScanPrompt(photoCount) {
  return `You are an expert estate sale pricer analyzing ${photoCount} photo${photoCount > 1 ? 's' : ''} of the same room${photoCount > 1 ? ' from different angles' : ''}.

Identify EVERY distinct item visible that could be sold at an estate sale. Look for:
- Furniture: sofas, chairs, tables, dressers, shelves, cabinets, beds, desks
- Lighting: lamps, floor lamps, chandeliers
- Art & Decor: paintings, sculptures, vases, mirrors, rugs, clocks, plants
- Collectibles: figurines, china sets, crystal, records, coins, books, antiques
- Electronics: TVs, stereos, computers, cameras, appliances
- Kitchenware: dishes, cookware, small appliances, glassware
- Tools: power tools, hand tools, garden equipment
- Clothing & Jewelry: visible clothing racks, jewelry boxes, accessories
${photoCount > 1 ? '\nIf multiple photos show the same item, count it ONCE. Combine what you see across all angles into one comprehensive list.' : ''}
For clustered items (shelf of figurines, set of dishes, box of records), list each type as its own entry.

Respond with ONLY a valid JSON array — no markdown, no explanation, no code fences:
[
  {
    "itemName": "Brief descriptive name (3-6 words)",
    "category": "furniture|kitchenware|collectibles|electronics|tools|clothing|books|art|jewelry|toys|outdoor|other",
    "condition": "excellent|good|fair|poor",
    "priceLow": 5,
    "priceMedium": 15,
    "priceHigh": 25,
    "confidence": 0.8,
    "notes": ""
  }
]

Be comprehensive — identify every sellable item. Aim for 5–30 items depending on room density.
Pricing tiers: Low = garage sale / quick-sell, Medium = fair estate price, High = retail/collector.
Round prices: under $50 → nearest $5, $50–$200 → nearest $10, over $200 → nearest $25.`;
}

// ─── Scanning animation dots ───────────────────────────────────────────────────
function ScanDots() {
  return (
    <div className="flex gap-1.5 items-center justify-center">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-full bg-blue-400"
          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
      <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.5} 40%{transform:scale(1);opacity:1} }`}</style>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function RoomScanPage() {
  const { saleId, roomId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [photos, setPhotos] = useState([]); // { id, file, previewUrl }
  const [scanning, setScanning] = useState(false);
  const [scanStage, setScanStage] = useState(''); // status message during scan
  const [error, setError] = useState('');

  const handleFiles = useCallback((files) => {
    const incoming = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
    const newPhotos = incoming.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos(prev => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
    setError('');
  }, [photos.length]);

  const removePhoto = (id) => {
    setPhotos(prev => {
      const p = prev.find(x => x.id === id);
      if (p) URL.revokeObjectURL(p.previewUrl);
      return prev.filter(x => x.id !== id);
    });
  };

  const scanRoom = async () => {
    if (photos.length === 0 || scanning) return;
    setScanning(true);
    setError('');

    try {
      // ── Step 1: compress all photos + generate thumbnail from first ──
      setScanStage(`Preparing ${photos.length} photo${photos.length > 1 ? 's' : ''}…`);
      const [imageBlocks, thumbnailDataUrl] = await Promise.all([
        Promise.all(
          photos.map(async (photo) => {
            const compressed = await compressImage(photo.file);
            const base64 = await toBase64(compressed);
            return { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } };
          })
        ),
        generateThumbnail(photos[0].file),
      ]);

      // ── Step 2: call Claude with ALL photos in one message ──
      setScanStage(`AI is scanning your room${photos.length > 1 ? ' from all angles' : ''}…`);
      const response = await fetch(`${BACKEND}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: [
              ...imageBlocks,
              { type: 'text', text: buildScanPrompt(photos.length) },
            ],
          }],
        }),
      });

      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      const text = data.content?.[0]?.text || '';

      // ── Step 3: parse JSON array ──
      setScanStage('Pricing items…');
      const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();

      // Handle both array and single object responses
      let parsed;
      if (cleaned.startsWith('[')) {
        parsed = JSON.parse(cleaned);
      } else if (cleaned.startsWith('{')) {
        parsed = [JSON.parse(cleaned)]; // single item edge case
      } else {
        // Try to extract array from somewhere in the string
        const match = cleaned.match(/\[[\s\S]*\]/);
        if (!match) throw new Error('AI did not return a valid item list');
        parsed = JSON.parse(match[0]);
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('No items identified — try a clearer photo or different angle');
      }

      // ── Step 4: normalise items ──
      const items = parsed.map(item => ({
        id: `scan-${Date.now()}-${Math.random()}`,
        itemName: item.itemName || 'Unknown item',
        category: item.category || 'other',
        condition: item.condition || 'good',
        aiPriceLow:    item.priceLow    || item.aiPriceLow    || 5,
        aiPriceMedium: item.priceMedium || item.aiPriceMedium || 15,
        aiPriceHigh:   item.priceHigh   || item.aiPriceHigh   || 25,
        aiConfidence:  item.confidence  || 0.7,
        notes: item.notes || '',
        source: 'room-scan',
        thumbnailDataUrl: thumbnailDataUrl || null,
      }));

      // ── Step 5: save to room ──
      setScanStage(`Saving ${items.length} items to room…`);
      await addRoomItems(saleId, roomId, items);

      // ── Done: back to room with scanned count ──
      navigate(`/app/sale/${saleId}/room/${roomId}?scanned=${items.length}`, { replace: true });

    } catch (err) {
      console.error('Room scan error:', err);
      setError(err.message || 'Scan failed — check your connection and try again');
      setScanning(false);
      setScanStage('');
    }
  };

  const photoSlots = [...photos, ...Array(MAX_PHOTOS - photos.length).fill(null)];
  const canScan = photos.length > 0 && !scanning;
  const canAddMore = photos.length < MAX_PHOTOS && !scanning;

  // ── Scanning overlay ──
  if (scanning) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-8 p-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-blue-600/20 border-2 border-blue-500/40 flex items-center justify-center">
            <ScanLine size={40} className="text-blue-400" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
          {/* Rotating ring */}
          <div
            className="absolute inset-0 rounded-3xl border-2 border-transparent border-t-blue-400"
            style={{ animation: 'spin 1s linear infinite' }}
          />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:0.6}50%{opacity:1}}`}</style>
        </div>

        <div className="text-center space-y-3">
          <h2 className="text-xl font-bold text-white">Scanning Room</h2>
          <p className="text-gray-400 text-sm max-w-xs">{scanStage}</p>
          <ScanDots />
        </div>

        {/* Photo thumbnails during scan */}
        <div className="flex gap-2">
          {photos.map(p => (
            <img key={p.id} src={p.previewUrl} alt="" className="w-14 h-14 rounded-xl object-cover opacity-60" />
          ))}
        </div>
      </div>
    );
  }

  // ── Photo capture UI ──
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
        <button
          onClick={() => navigate(`/app/sale/${saleId}/room/${roomId}`)}
          className="text-gray-400 hover:text-white p-1"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Scan Room</h1>
          <p className="text-gray-400 text-sm">AI identifies every item from your photos</p>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6">

        {/* How it works tip */}
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-2xl p-4 space-y-2">
          <p className="text-blue-300 font-semibold text-sm flex items-center gap-2">
            <Zap size={16} className="text-yellow-400" /> How room scanning works
          </p>
          <ul className="text-gray-300 text-sm space-y-1.5 list-none">
            <li>📸 Take up to 4 photos — wide shots or shelf/table close-ups</li>
            <li>🧠 AI identifies every visible sellable item across all your photos</li>
            <li>💰 Each item gets priced with Low, Target, and High ranges</li>
            <li>✅ Everything auto-saves to this room — edit prices in the room view</li>
          </ul>
          <p className="text-blue-400/80 text-xs pt-1">
            More photos = better coverage. Try a doorway shot + close-ups of shelves or tables.
          </p>
        </div>

        {/* Photo counter */}
        <div className="flex items-center justify-between">
          <p className="text-gray-300 font-semibold">
            {photos.length === 0
              ? 'No photos yet'
              : `${photos.length} photo${photos.length > 1 ? 's' : ''} added`}
          </p>
          <div className="flex gap-1">
            {Array(MAX_PHOTOS).fill(null).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${i < photos.length ? 'bg-blue-400' : 'bg-gray-700'}`}
              />
            ))}
          </div>
        </div>

        {/* 2×2 photo grid */}
        <div className="grid grid-cols-2 gap-3">
          {photoSlots.map((photo, idx) => (
            photo ? (
              <div key={photo.id} className="relative aspect-square">
                <img
                  src={photo.previewUrl}
                  alt={`Room photo ${idx + 1}`}
                  className="w-full h-full object-cover rounded-2xl"
                />
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-2 right-2 bg-black/70 rounded-full p-1 text-white hover:bg-red-600/80 transition-colors"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/60 rounded-lg px-2 py-0.5 text-white text-xs font-medium">
                  Photo {idx + 1}
                </div>
              </div>
            ) : (
              <button
                key={`empty-${idx}`}
                onClick={() => canAddMore && fileInputRef.current?.click()}
                disabled={!canAddMore}
                className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
                  canAddMore
                    ? 'border-gray-600 hover:border-blue-500 text-gray-500 hover:text-blue-400 cursor-pointer'
                    : 'border-gray-800 text-gray-800 cursor-not-allowed'
                }`}
              >
                {canAddMore && (
                  <>
                    <Camera size={28} />
                    <span className="text-xs font-medium">
                      {idx === 0 ? 'Add photo' : `Add angle ${idx + 1}`}
                    </span>
                  </>
                )}
              </button>
            )
          ))}
        </div>

        {/* Hint text below grid */}
        {photos.length > 0 && photos.length < MAX_PHOTOS && (
          <p className="text-center text-blue-400/70 text-xs -mt-2">
            Add {MAX_PHOTOS - photos.length} more photo{MAX_PHOTOS - photos.length > 1 ? 's' : ''} for better AI coverage
          </p>
        )}
        {photos.length === MAX_PHOTOS && (
          <p className="text-center text-green-400/70 text-xs -mt-2">
            Maximum photos added — ready for best results
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Add photos button (when grid isn't the only CTA) */}
        {photos.length === 0 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-5 rounded-2xl flex items-center justify-center gap-3 text-lg border-2 border-dashed border-gray-600 hover:border-gray-500 transition-colors"
          >
            <Camera size={26} /> Take Room Photo
          </button>
        )}

        {/* Scan CTA */}
        <button
          onClick={scanRoom}
          disabled={!canScan}
          className={`w-full font-bold py-5 rounded-2xl flex items-center justify-center gap-3 text-xl transition-all shadow-lg ${
            canScan
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 active:from-blue-700 active:to-purple-700 text-white'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          <ScanLine size={26} />
          {photos.length === 0
            ? 'Add a photo to scan'
            : `Scan Room — ${photos.length} Photo${photos.length > 1 ? 's' : ''}`}
        </button>

        <p className="text-center text-gray-500 text-xs pb-4">
          AI will identify and price every sellable item it can see.
          Results auto-save — you can edit prices in the room view.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  );
}
