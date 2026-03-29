/**
 * PrecisionPrices – Room Scan Page
 * Take up to 4 room photos → AI identifies every item → auto-saves to room
 * Route: /app/sale/:saleId/room/:roomId/scan
 */
import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addRoomItems } from '../lib/salesFirestore';
import { useAuth } from '../AuthContext';
import { Camera, X, Zap, ArrowLeft, AlertCircle, ScanLine, CheckCircle, Loader2 } from 'lucide-react';

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

// Generate a small square thumbnail from the full photo (fallback when no bbox)
async function generateThumbnail(file, size = 120) {
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
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

// Crop a specific item's bounding box from a photo (normalized 0–1 coords)
// Adds 8% padding on all sides so the item isn't cropped too tight
async function cropBoundingBox(file, bbox, size = 120) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const pad = 0.08;
      const rawX = bbox.x - bbox.width * pad;
      const rawY = bbox.y - bbox.height * pad;
      const rawW = bbox.width * (1 + 2 * pad);
      const rawH = bbox.height * (1 + 2 * pad);

      const sx = Math.max(0, rawX * img.width);
      const sy = Math.max(0, rawY * img.height);
      const sw = Math.min(img.width - sx, rawW * img.width);
      const sh = Math.min(img.height - sy, rawH * img.height);

      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
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
${photoCount > 1 ? '\nIf multiple photos show the same item, count it ONCE. Use photoIndex (0-based) for whichever photo shows it most clearly.' : ''}
For clustered items (shelf of figurines, set of dishes), list each type as its own entry.

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
    "notes": "",
    "photoIndex": 0,
    "boundingBox": { "x": 0.1, "y": 0.2, "width": 0.5, "height": 0.4 }
  }
]

boundingBox uses normalized coordinates (0.0–1.0): x/y = top-left corner, width/height = size of the box.
photoIndex is the 0-based index of which photo shows this item most clearly.

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

// Confidence pill color
function confidenceColor(score) {
  if (score >= 0.8) return 'text-green-400';
  if (score >= 0.6) return 'text-yellow-400';
  return 'text-red-400';
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
  const [scannedItems, setScannedItems] = useState(null); // null = not scanned yet
  const [saving, setSaving] = useState(false);

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

  const removeScannedItem = (id) => {
    setScannedItems(prev => prev.filter(item => item.id !== id));
  };

  const scanRoom = async () => {
    if (photos.length === 0 || scanning) return;
    setScanning(true);
    setError('');

    try {
      // ── Step 1: compress all photos ──
      setScanStage(`Preparing ${photos.length} photo${photos.length > 1 ? 's' : ''}…`);
      const imageBlocks = await Promise.all(
        photos.map(async (photo) => {
          const compressed = await compressImage(photo.file);
          const base64 = await toBase64(compressed);
          return { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } };
        })
      );

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

      let parsed;
      if (cleaned.startsWith('[')) {
        parsed = JSON.parse(cleaned);
      } else if (cleaned.startsWith('{')) {
        parsed = [JSON.parse(cleaned)];
      } else {
        const match = cleaned.match(/\[[\s\S]*\]/);
        if (!match) throw new Error('AI did not return a valid item list');
        parsed = JSON.parse(match[0]);
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('No items identified — try a clearer photo or different angle');
      }

      // ── Step 4: crop item thumbnails from bounding boxes ──
      setScanStage('Cropping item thumbnails…');
      const items = await Promise.all(parsed.map(async (item) => {
        const photoIdx = typeof item.photoIndex === 'number' ? item.photoIndex : 0;
        const sourcePhoto = photos[Math.min(photoIdx, photos.length - 1)];
        let thumbnailDataUrl = null;

        if (item.boundingBox &&
            typeof item.boundingBox.x === 'number' &&
            typeof item.boundingBox.y === 'number' &&
            typeof item.boundingBox.width === 'number' &&
            typeof item.boundingBox.height === 'number' &&
            item.boundingBox.width > 0.01 &&
            item.boundingBox.height > 0.01) {
          thumbnailDataUrl = await cropBoundingBox(sourcePhoto.file, item.boundingBox);
        }

        // Fall back to a center-crop of the source photo if bbox crop failed
        if (!thumbnailDataUrl) {
          thumbnailDataUrl = await generateThumbnail(sourcePhoto.file);
        }

        return {
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
          thumbnailDataUrl,
        };
      }));

      // ── Step 5: show results for user review ──
      setScanStage('Done!');
      setScannedItems(items);
      setScanning(false);

    } catch (err) {
      console.error('Room scan error:', err);
      setError(err.message || 'Scan failed — check your connection and try again');
      setScanning(false);
      setScanStage('');
    }
  };

  const saveToRoom = async () => {
    if (!scannedItems || saving) return;
    setSaving(true);
    try {
      await addRoomItems(saleId, roomId, scannedItems);
      navigate(`/app/sale/${saleId}/room/${roomId}?scanned=${scannedItems.length}`, { replace: true });
    } catch (err) {
      console.error('Save error:', err);
      setSaving(false);
    }
  };

  const photoSlots = [...photos, ...Array(MAX_PHOTOS - photos.length).fill(null)];
  const canScan = photos.length > 0 && !scanning;
  const canAddMore = photos.length < MAX_PHOTOS && !scanning;

  // ── Results screen ──
  if (scannedItems) {
    const CATEGORY_COLORS = {
      furniture: 'bg-amber-900/60 text-amber-300', kitchenware: 'bg-orange-900/60 text-orange-300',
      collectibles: 'bg-purple-900/60 text-purple-300', electronics: 'bg-blue-900/60 text-blue-300',
      tools: 'bg-gray-700 text-gray-300', clothing: 'bg-pink-900/60 text-pink-300',
      books: 'bg-green-900/60 text-green-300', art: 'bg-rose-900/60 text-rose-300',
      jewelry: 'bg-yellow-900/60 text-yellow-300', toys: 'bg-lime-900/60 text-lime-300',
      outdoor: 'bg-emerald-900/60 text-emerald-300', other: 'bg-gray-800 text-gray-400',
    };
    const total = scannedItems.reduce((s, i) => s + (i.aiPriceMedium || 0), 0);

    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <button onClick={() => setScannedItems(null)} className="text-gray-400 hover:text-white p-1">
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">AI Found {scannedItems.length} Items</h1>
            <p className="text-gray-400 text-sm">Est. total value ~${total.toLocaleString()}</p>
          </div>
        </div>

        <div className="p-4 max-w-lg mx-auto space-y-3 pb-32">
          {/* Success callout */}
          <div className="bg-green-900/40 border border-green-700/50 rounded-2xl px-4 py-3 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
            <div>
              <p className="text-green-200 font-semibold text-sm">Scan complete — review items below</p>
              <p className="text-green-300/70 text-xs">Tap × to remove items you don't want. Tap Save when ready.</p>
            </div>
          </div>

          {scannedItems.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              All items removed. Tap Rescan to start over.
            </div>
          )}

          {/* Item list */}
          {scannedItems.map((item) => {
            const cat = item.category || 'other';
            const catColor = CATEGORY_COLORS[cat] || CATEGORY_COLORS.other;
            const confScore = item.aiConfidence || 0.7;
            return (
              <div key={item.id} className="bg-gray-800 rounded-xl px-4 py-3 border border-gray-700 flex items-center gap-3">
                {item.thumbnailDataUrl ? (
                  <img src={item.thumbnailDataUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0 text-lg">📦</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.itemName}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${catColor}`}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">{item.condition}</span>
                    <span className={`text-xs font-medium ${confidenceColor(confScore)}`}>
                      {Math.round(confScore * 100)}% confident
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 mr-1">
                  <div className="text-white font-bold">${item.aiPriceMedium}</div>
                  <div className="text-xs text-gray-500">${item.aiPriceLow}–${item.aiPriceHigh}</div>
                </div>
                <button
                  onClick={() => removeScannedItem(item.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 p-1"
                  aria-label="Remove item"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Sticky save bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
          <div className="max-w-lg mx-auto flex gap-2">
            <button
              onClick={() => setScannedItems(null)}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-5 rounded-2xl transition-colors text-sm"
            >
              Rescan
            </button>
            <button
              onClick={saveToRoom}
              disabled={saving || scannedItems.length === 0}
              className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-lg transition-colors"
            >
              {saving ? (
                <><Loader2 size={20} className="animate-spin" /> Saving…</>
              ) : (
                <><CheckCircle size={20} /> Save {scannedItems.length} Items to Room</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Scanning overlay ──
  if (scanning) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-8 p-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-blue-600/20 border-2 border-blue-500/40 flex items-center justify-center">
            <ScanLine size={40} className="text-blue-400" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
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
            <li>✅ Review the list, remove items you don't want, then save</li>
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
          AI identifies and prices every visible item. Review results before saving.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  );
}
