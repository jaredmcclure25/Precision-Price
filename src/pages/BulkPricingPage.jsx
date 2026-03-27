/**
 * PrecisionPrices – Bulk Pricing Page
 * Rapid-fire estate sale photo pricing: snap photos → AI prices all at once → grouped by tier
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Camera, Upload, X, DollarSign, Loader2, ChevronDown, ChevronUp, Download, ArrowLeft, CheckCircle, AlertCircle, Edit2, Save, Plus, FileSpreadsheet, LayoutGrid, Tag } from 'lucide-react';
import { createSale, addSaleItems, addRoomItems, getRoom, getSale } from '../lib/salesFirestore';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';

// ─── Price tier buckets ───────────────────────────────────────────────────────
const TIERS = [5, 10, 15, 20, 25, 50, 75, 100, 150, 200];

function snapToTier(price) {
  if (!price || price <= 0) return 5;
  for (const t of TIERS) {
    if (price <= t * 1.4) return t;
  }
  return 200;
}

// ─── Image helpers ────────────────────────────────────────────────────────────
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

function detectMediaType(base64) {
  try {
    const header = atob(base64.substring(0, 16));
    const b = [...header].map(c => c.charCodeAt(0));
    if (b[0] === 0x89 && b[1] === 0x50) return 'image/png';
    if (b[0] === 0xFF && b[1] === 0xD8) return 'image/jpeg';
    if (b[0] === 0x47 && b[1] === 0x49) return 'image/gif';
    if (b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45) return 'image/webp';
  } catch (_) {}
  return 'image/jpeg';
}

// ─── Claude Vision call ───────────────────────────────────────────────────────
const ESTATE_SALE_PROMPT = `You are an expert estate sale item pricer with deep knowledge of secondhand market values.

Given a photo, respond with ONLY a JSON object (no markdown, no explanation):
{
  "itemName": "Brief descriptive name",
  "category": "one of: furniture, kitchenware, collectibles, electronics, tools, clothing, books, art, jewelry, toys, outdoor, other",
  "condition": "one of: excellent, good, fair, poor",
  "priceLow": 5,
  "priceMedium": 15,
  "priceHigh": 25,
  "confidence": 0.85,
  "notes": "Optional brief note"
}

Pricing guidelines:
- Low = garage sale / quick-sell
- Medium = fair estate sale price (default display)
- High = collector / antique shop retail
- Round to nearest $5 for items under $50, nearest $10 for $50–200, nearest $25 over $200
- confidence is 0.0–1.0`;

async function priceOneImage(base64, mediaType) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
  const response = await fetch(`${backendUrl}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: ESTATE_SALE_PROMPT }
          ]
        }
      ]
    })
  });
  if (!response.ok) throw new Error('API error');
  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  // Strip markdown code fences if present
  const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

// ─── Excel export ─────────────────────────────────────────────────────────────
const CATEGORY_LABELS = {
  furniture: 'Furniture', kitchenware: 'Kitchenware', collectibles: 'Collectibles',
  electronics: 'Electronics', tools: 'Tools', clothing: 'Clothing',
  books: 'Books', art: 'Art', jewelry: 'Jewelry', toys: 'Toys',
  outdoor: 'Outdoor', other: 'Other',
};

function exportExcel(items, saleName) {
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const total   = items.reduce((s, i) => s + (i.selectedPrice ?? i.aiPriceMedium ?? 0), 0);

  // Sort by category then price
  const sorted = [...items].sort((a, b) => {
    const catCmp = (a.category || '').localeCompare(b.category || '');
    if (catCmp !== 0) return catCmp;
    return (a.selectedPrice ?? a.aiPriceMedium ?? 0) - (b.selectedPrice ?? b.aiPriceMedium ?? 0);
  });

  const rows = sorted.map((item, i) => ({
    '#':          i + 1,
    'Item Name':  item.itemName || 'Unknown Item',
    'Category':   CATEGORY_LABELS[item.category] || 'Other',
    'Condition':  item.condition ? item.condition.charAt(0).toUpperCase() + item.condition.slice(1) : 'Good',
    'Your Price': item.selectedPrice ?? item.aiPriceMedium ?? 0,
    'Price Low':  item.aiPriceLow ?? 0,
    'Price High': item.aiPriceHigh ?? 0,
    'Notes':      item.notes || '',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([]);

  // Title rows
  XLSX.utils.sheet_add_aoa(ws, [
    [saleName || 'Estate Sale Pricing Report'],
    [`Generated ${dateStr}  ·  ${items.length} items  ·  Est. total $${total}`],
    [],
  ]);

  // Data rows starting at row 4
  XLSX.utils.sheet_add_json(ws, rows, { origin: 'A4' });

  // Column widths
  ws['!cols'] = [
    { wch: 4 },   // #
    { wch: 32 },  // Item Name
    { wch: 14 },  // Category
    { wch: 12 },  // Condition
    { wch: 12 },  // Your Price
    { wch: 10 },  // Price Low
    { wch: 10 },  // Price High
    { wch: 36 },  // Notes
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Items');
  XLSX.writeFile(wb, `${(saleName || 'estate-sale').replace(/[^a-z0-9-_ ]/gi, '')}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// Keep a plain CSV builder for the ZIP bundle (EstateSales.NET compatibility)
function buildCSV(items) {
  const header = 'Item Name,Category,Condition,Your Price,Price Low,Price High,Notes\n';
  const rows = items.map(item => {
    const name  = (item.itemName || '').replace(/"/g, '""');
    const notes = (item.notes || '').replace(/"/g, '""');
    const cat   = CATEGORY_LABELS[item.category] || 'Other';
    const cond  = item.condition ? item.condition.charAt(0).toUpperCase() + item.condition.slice(1) : 'Good';
    const price = item.selectedPrice ?? item.aiPriceMedium ?? '';
    return `"${name}","${cat}","${cond}",${price},${item.aiPriceLow || ''},${item.aiPriceHigh || ''},"${notes}"`;
  });
  return header + rows.join('\n');
}

// ─── Category meta ────────────────────────────────────────────────────────────
const CATEGORY_ICONS = {
  furniture: '🛋️', kitchenware: '🍳', collectibles: '🏺', electronics: '📱',
  tools: '🔧', clothing: '👗', books: '📚', art: '🎨', jewelry: '💍',
  toys: '🧸', outdoor: '🌿', other: '📦',
};

// ─── CategoryGroup component ──────────────────────────────────────────────────
function CategoryGroup({ category, items, onEdit }) {
  const [expanded, setExpanded] = useState(true);
  const label = CATEGORY_LABELS[category] || 'Other';
  const icon  = CATEGORY_ICONS[category] || '📦';
  const catTotal = items.reduce((s, i) => s + (i.selectedPrice ?? i.aiPriceMedium ?? 0), 0);

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 mb-4 overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="text-lg font-bold text-white">{label}</span>
          <span className="text-gray-400 text-sm">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-green-400 font-semibold text-sm">${catTotal}</span>
          {expanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {items.map(item => (
            <ItemRow key={item.id} item={item} onEdit={onEdit} showPriceBadge />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TierGroup component ──────────────────────────────────────────────────────
function TierGroup({ tier, items, onEdit }) {
  const [expanded, setExpanded] = useState(true);
  const label = tier >= 200 ? '$200+' : `$${tier}`;
  const tierColors = {
    5:   'bg-gray-700 border-gray-500',
    10:  'bg-blue-900 border-blue-600',
    15:  'bg-blue-800 border-blue-500',
    20:  'bg-indigo-900 border-indigo-600',
    25:  'bg-purple-900 border-purple-600',
    50:  'bg-emerald-900 border-emerald-600',
    75:  'bg-yellow-900 border-yellow-600',
    100: 'bg-orange-900 border-orange-500',
    150: 'bg-red-900 border-red-500',
    200: 'bg-pink-900 border-pink-500',
  };
  const colorClass = tierColors[tier] || 'bg-gray-800 border-gray-600';

  return (
    <div className={`rounded-xl border ${colorClass} mb-4 overflow-hidden`}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-white">{label}</span>
          <span className="text-gray-300 text-sm">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </div>
        {expanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {items.map(item => (
            <ItemRow key={item.id} item={item} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ItemRow component ────────────────────────────────────────────────────────
function ItemRow({ item, onEdit, showPriceBadge = false }) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(item.itemName || '');

  // Which tier is currently selected: 'low' | 'medium' | 'high'
  const [selectedTier, setSelectedTier] = useState('medium');

  // Freeze original AI prices on mount — never let parent overwrites affect them
  const [prices] = useState({
    low:    item.aiPriceLow,
    medium: item.aiPriceMedium,
    high:   item.aiPriceHigh,
  });

  const saveName = () => {
    onEdit(item.id, { itemName: name });
    setEditingName(false);
  };

  const selectTier = (tier) => {
    setSelectedTier(tier);
    // Write to selectedPrice — does NOT overwrite the original AI price fields
    onEdit(item.id, { selectedPrice: prices[tier] });
  };

  const tierConfig = [
    { key: 'low',    label: 'Low',    color: 'bg-gray-600 text-gray-200',            active: 'bg-gray-400 text-white ring-2 ring-gray-300' },
    { key: 'medium', label: 'Target', color: 'bg-emerald-900 text-emerald-300',       active: 'bg-emerald-500 text-white ring-2 ring-emerald-300' },
    { key: 'high',   label: 'High',   color: 'bg-yellow-900 text-yellow-300',         active: 'bg-yellow-500 text-white ring-2 ring-yellow-300' },
  ];

  return (
    <div className="bg-black/20 rounded-xl px-3 py-3 space-y-2">
      {/* Top row: photo + name + edit */}
      <div className="flex items-center gap-3">
        {item.previewUrl && (
          <img src={item.previewUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex gap-2 items-center">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={saveName}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                autoFocus
                className="flex-1 bg-gray-700 text-white text-sm rounded px-2 py-1 min-w-0"
              />
              <button onClick={saveName} className="text-green-400"><Save size={16} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-white text-sm truncate flex-1">{item.itemName || 'Unknown item'}</span>
              <button onClick={() => setEditingName(true)} className="text-gray-600 hover:text-gray-300 flex-shrink-0">
                <Edit2 size={14} />
              </button>
            </div>
          )}
          {item.notes && <p className="text-gray-500 text-xs truncate">{item.notes}</p>}
        </div>
        {showPriceBadge && (
          <span className="flex-shrink-0 bg-emerald-700 text-emerald-100 text-sm font-bold px-2 py-1 rounded-lg">
            ${item.selectedPrice ?? item.aiPriceMedium}
          </span>
        )}
      </div>

      {/* Price tier selector */}
      <div className="flex gap-2">
        {tierConfig.map(({ key, label, color, active }) => (
          <button
            key={key}
            onClick={() => selectTier(key)}
            className={`flex-1 rounded-lg py-2 text-center transition-all ${selectedTier === key ? active : color}`}
          >
            <div className="text-xs font-medium opacity-80">{label}</div>
            <div className="text-base font-bold leading-tight">${prices[key]}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, label }) {
  const colors = {
    pending:    'bg-gray-700 text-gray-300',
    processing: 'bg-blue-800 text-blue-200',
    done:       'bg-green-800 text-green-200',
    error:      'bg-red-800 text-red-200',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[status] || colors.pending}`}>
      {label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BulkPricingPage() {
  const { currentUser, saveItemToHistory } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [searchParams] = useSearchParams();

  // Room context — when navigated from RoomDetailPage
  const contextSaleId = searchParams.get('saleId');
  const contextRoomId = searchParams.get('roomId');
  const isRoomMode = !!(contextSaleId && contextRoomId);

  const [photos, setPhotos] = useState([]); // { id, file, previewUrl, status, result, error }
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [items, setItems] = useState([]); // final priced items
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [saleName, setSaleName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [savedSaleId, setSavedSaleId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [zipping, setZipping] = useState(false);
  const [viewMode, setViewMode] = useState('price');       // 'price' | 'category'
  const [catFilter, setCatFilter] = useState('all');       // 'all' | category key

  // Load room/sale name when in room mode
  useEffect(() => {
    if (!isRoomMode) return;
    Promise.all([getSale(contextSaleId), getRoom(contextSaleId, contextRoomId)])
      .then(([sale, room]) => {
        if (sale) setSaleName(sale.saleName || '');
        if (room) setRoomName(room.name || '');
      })
      .catch(() => {});
  }, [isRoomMode, contextSaleId, contextRoomId]);

  // Add photos from file picker
  const handleFiles = useCallback((files) => {
    const newPhotos = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending',
      result: null,
      error: null,
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
    setDone(false);
  }, []);

  const removePhoto = (id) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo) URL.revokeObjectURL(photo.previewUrl);
      return prev.filter(p => p.id !== id);
    });
  };

  // Price all photos concurrently (max 5 at a time to avoid rate limits)
  const priceAll = async () => {
    if (photos.length === 0) return;
    setRunning(true);
    setDone(false);
    setProgress({ current: 0, total: photos.length });

    const CONCURRENCY = 5;
    const results = [];

    // Reset all to pending
    setPhotos(prev => prev.map(p => ({ ...p, status: 'pending', result: null, error: null })));

    const queue = [...photos];
    let completed = 0;

    const processOne = async (photo) => {
      setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, status: 'processing' } : p));
      try {
        const compressed = await compressImage(photo.file);
        const base64 = await toBase64(compressed);
        const mediaType = detectMediaType(base64);
        const result = await priceOneImage(base64, mediaType);
        const tier = snapToTier(result.priceMedium || result.aiPriceMedium || 15);
        const item = {
          id: photo.id,
          previewUrl: photo.previewUrl,
          itemName: result.itemName || 'Unknown item',
          category: result.category || 'other',
          condition: result.condition || 'good',
          aiPriceLow: result.priceLow || result.aiPriceLow || 5,
          aiPriceMedium: result.priceMedium || result.aiPriceMedium || 15,
          aiPriceHigh: result.priceHigh || result.aiPriceHigh || 25,
          aiConfidence: result.confidence || 0.7,
          notes: result.notes || '',
          suggestedTier: tier,
        };
        results.push(item);
        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, status: 'done', result: item } : p));
      } catch (err) {
        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, status: 'error', error: err.message } : p));
      }
      completed++;
      setProgress({ current: completed, total: photos.length });
    };

    // Batch process
    for (let i = 0; i < queue.length; i += CONCURRENCY) {
      const batch = queue.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(processOne));
    }

    results.sort((a, b) => a.suggestedTier - b.suggestedTier);
    setItems(results);
    setRunning(false);
    setDone(true);
  };

  const editItem = (id, updates) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, ...updates };
    }));
  };

  // Save to Firestore, then navigate appropriately
  const saveAndReview = async () => {
    if (!currentUser || items.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      let targetSaleId;

      if (isRoomMode) {
        // Room context: save items into the existing sale + room
        targetSaleId = contextSaleId;
        await addRoomItems(contextSaleId, contextRoomId, items);
      } else {
        // Flat mode: create a new sale and save items
        targetSaleId = await createSale(currentUser.uid, saleName.trim() || undefined);
        await addSaleItems(targetSaleId, items);
      }

      // Save each item into listing history (History tab)
      await Promise.all(items.map(item =>
        saveItemToHistory({
          itemName: item.itemName || 'Unknown item',
          condition: item.condition || 'good',
          suggestedPrice: item.selectedPrice ?? item.aiPriceMedium,
          priceRange: { min: item.aiPriceLow, max: item.aiPriceHigh },
          category: item.category,
          notes: item.notes,
          source: 'bulk',
          saleId: targetSaleId,
        })
      ));

      setSavedSaleId(targetSaleId);
      if (isRoomMode) {
        // Go back to the room
        navigate(`/app/sale/${contextSaleId}/room/${contextRoomId}`);
      } else {
        navigate(`/app/sale/${targetSaleId}/publish`);
      }
    } catch (err) {
      console.error('Save error:', err);
      setSaveError('Could not save — check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  // ZIP export: CSV + all photos bundled together
  const exportZip = async () => {
    if (items.length === 0) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      const folderName = (saleName.trim() || 'estate-sale-export').replace(/[^a-z0-9-_ ]/gi, '');
      const folder = zip.folder(folderName);

      // Add CSV
      folder.file('items.csv', buildCSV(items));

      // Add README
      folder.file('README.txt',
        'HOW TO USE WITH ESTATESALES.NET\n' +
        '================================\n' +
        '1. Open estatesales.net and go to your sale listing\n' +
        '2. Open items.csv to see names and prices\n' +
        '3. Upload matching photos from the photos/ folder\n' +
        '4. Use the item name, price, and description from the CSV\n\n' +
        `Generated by PrecisionPrices on ${new Date().toLocaleDateString()}`
      );

      // Add photos from blob URLs
      const photosFolder = folder.folder('photos');
      await Promise.all(
        items.map(async (item, idx) => {
          if (!item.previewUrl) return;
          try {
            const resp = await fetch(item.previewUrl);
            const blob = await resp.blob();
            const ext = blob.type.includes('png') ? 'png' : 'jpg';
            const safeName = (item.itemName || `item-${idx + 1}`).replace(/[^a-z0-9-_ ]/gi, '').slice(0, 40);
            photosFolder.file(`${String(idx + 1).padStart(3, '0')}-${safeName}.${ext}`, blob);
          } catch (_) {
            // blob URL expired or inaccessible — skip
          }
        })
      );

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP error:', err);
    } finally {
      setZipping(false);
    }
  };

  const totalValue = items.reduce((s, i) => s + (i.selectedPrice ?? i.aiPriceMedium ?? 0), 0);

  // All unique categories present in results
  const allCategories = [...new Set(items.map(i => i.category || 'other'))].sort();

  // Apply category filter
  const visibleItems = catFilter === 'all' ? items : items.filter(i => (i.category || 'other') === catFilter);

  // Group by price tier
  const byTier = visibleItems.reduce((acc, item) => {
    const t = item.suggestedTier;
    if (!acc[t]) acc[t] = [];
    acc[t].push(item);
    return acc;
  }, {});
  const sortedTiers = Object.keys(byTier).map(Number).sort((a, b) => a - b);

  // Group by category
  const byCategory = visibleItems.reduce((acc, item) => {
    const c = item.category || 'other';
    if (!acc[c]) acc[c] = [];
    acc[c].push(item);
    return acc;
  }, {});
  const sortedCategories = Object.keys(byCategory).sort();

  // ── Render: Upload phase ──
  if (!done) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-800">
          <button onClick={() => isRoomMode ? navigate(`/app/sale/${contextSaleId}/room/${contextRoomId}`) : navigate('/app')} className="text-gray-400 hover:text-white">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl font-bold">{isRoomMode && roomName ? `Add to ${roomName}` : 'Bulk Price Items'}</h1>
            <p className="text-gray-400 text-sm">{isRoomMode ? (saleName || 'Snap photos — AI prices everything') : 'Photo → AI price, no typing needed'}</p>
          </div>
        </div>

        <div className="p-4 max-w-2xl mx-auto space-y-5">
          {/* Sale name */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Sale name (optional)</label>
            <input
              value={saleName}
              onChange={e => setSaleName(e.target.value)}
              placeholder="e.g. Johnson Estate – March 2026"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-base border border-gray-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Photo grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map(photo => (
                <div key={photo.id} className="relative aspect-square">
                  <img
                    src={photo.previewUrl}
                    alt=""
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {/* Status overlay */}
                  {photo.status === 'processing' && (
                    <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                      <Loader2 size={24} className="text-blue-400 animate-spin" />
                    </div>
                  )}
                  {photo.status === 'done' && (
                    <div className="absolute inset-0 bg-black/40 rounded-lg flex items-end p-1">
                      <span className="bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                        ${photo.result?.aiPriceMedium}
                      </span>
                    </div>
                  )}
                  {photo.status === 'error' && (
                    <div className="absolute inset-0 bg-red-900/60 rounded-lg flex items-center justify-center">
                      <AlertCircle size={20} className="text-red-300" />
                    </div>
                  )}
                  {/* Remove button (only when not running) */}
                  {!running && (
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5 text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}

              {/* Add more tile */}
              {!running && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-300 transition-colors"
                >
                  <Plus size={28} />
                </button>
              )}
            </div>
          )}

          {/* Progress bar */}
          {running && (
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Pricing items…</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* CTA buttons */}
          {photos.length === 0 ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xl py-5 rounded-2xl flex items-center justify-center gap-3 transition-colors"
            >
              <Camera size={28} />
              Add Photos
            </button>
          ) : (
            <div className="space-y-3">
              {!running && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload size={20} />
                  Add More Photos ({photos.length} selected)
                </button>
              )}
              <button
                onClick={priceAll}
                disabled={running || photos.length === 0}
                className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xl py-5 rounded-2xl flex items-center justify-center gap-3 transition-colors"
              >
                {running ? (
                  <>
                    <Loader2 size={26} className="animate-spin" />
                    Pricing {progress.current} of {progress.total}…
                  </>
                ) : (
                  <>
                    <DollarSign size={26} />
                    Price All {photos.length} Items
                  </>
                )}
              </button>
            </div>
          )}
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

  // ── Render: Results phase ──
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800">
        <button onClick={() => setDone(false)} className="text-gray-400 hover:text-white">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{saleName || 'Pricing Results'}</h1>
          <p className="text-gray-400 text-sm">{items.length} items · ${totalValue} est.</p>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-white">{items.length}</div>
            <div className="text-gray-400 text-xs">Items priced</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green-400">${totalValue}</div>
            <div className="text-gray-400 text-xs">Est. value</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{allCategories.length}</div>
            <div className="text-gray-400 text-xs">Categories</div>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex gap-2 bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => setViewMode('price')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${viewMode === 'price' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Tag size={15} /> Price Tiers
          </button>
          <button
            onClick={() => setViewMode('category')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${viewMode === 'category' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <LayoutGrid size={15} /> By Category
          </button>
        </div>

        {/* Category filter chips */}
        {allCategories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setCatFilter('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${catFilter === 'all' ? 'bg-white text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              All ({items.length})
            </button>
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat === catFilter ? 'all' : cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${catFilter === cat ? 'bg-white text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat] || cat} ({items.filter(i => (i.category || 'other') === cat).length})
              </button>
            ))}
          </div>
        )}

        {/* Groups */}
        {viewMode === 'price'
          ? sortedTiers.map(tier => (
              <TierGroup key={tier} tier={tier} items={byTier[tier]} onEdit={editItem} />
            ))
          : sortedCategories.map(cat => (
              <CategoryGroup key={cat} category={cat} items={byCategory[cat]} onEdit={editItem} />
            ))
        }

        {/* Action buttons */}
        <div className="space-y-3 pb-8">
          <div className="flex gap-2">
            <button
              onClick={() => exportExcel(items, saleName)}
              className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
            >
              <FileSpreadsheet size={18} /> Excel
            </button>
            <button
              onClick={exportZip}
              disabled={zipping}
              className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
            >
              {zipping ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              {zipping ? 'Zipping…' : 'ZIP + Photos'}
            </button>
          </div>

          <p className="text-center text-gray-400 text-xs -mt-1">
            Excel: professional report · ZIP: photos + CSV for EstateSales.NET
          </p>

          {saveError && (
            <div className="bg-red-900/60 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              {saveError}
            </div>
          )}

          <button
            onClick={saveAndReview}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-bold text-lg py-5 rounded-2xl flex items-center justify-center gap-2 transition-colors"
          >
            {saving ? (
              <><Loader2 size={22} className="animate-spin" /> Saving…</>
            ) : isRoomMode ? (
              <><CheckCircle size={22} /> Save {items.length} Items to {roomName || 'Room'}</>
            ) : (
              <><CheckCircle size={22} /> Save Sale & Publish</>
            )}
          </button>

          <p className="text-center text-gray-500 text-xs">
            Next: push to Square catalog, print barcode labels, then run the sale.
          </p>
        </div>
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
