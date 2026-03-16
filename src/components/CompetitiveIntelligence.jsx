/**
 * Competitive Intelligence Agent
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 *
 * Three-tab tool: Review Sentiment Analysis, Ad Copy Generator, Pricing Strategy
 */

import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { MessageSquare, Edit2, TrendingUp, Loader2, Copy, Check, Search, Sparkles, BarChart3, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function CompetitiveIntelligence() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('sentiment');

  const tabs = [
    { id: 'sentiment', label: 'Review Analysis', icon: MessageSquare },
    { id: 'adcopy', label: 'Ad Copy Generator', icon: Edit2 },
    { id: 'strategy', label: 'Pricing Strategy', icon: TrendingUp },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Competitive Intelligence</h2>
          <p className="text-gray-500 mt-1">Analyze competitors, generate ad copy, and discover pricing gaps</p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 pb-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'sentiment' && <SentimentAnalysis />}
        {activeTab === 'adcopy' && <AdCopyGenerator />}
        {activeTab === 'strategy' && <PricingStrategy />}
      </div>
    </div>
  );
}

// --- Helper: Call competitive analysis API ---
async function callCompetitiveAPI(type, prompt) {
  const apiUrl = import.meta.env.VITE_BACKEND_URL
    ? `${import.meta.env.VITE_BACKEND_URL}/api/competitive/analyze`
    : import.meta.env.DEV
    ? `http://${window.location.hostname}:3001/api/competitive/analyze`
    : '/api/competitive/analyze';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) throw new Error('Analysis failed. Please try again.');

  const data = await response.json();
  const text = data.content?.find(c => c.type === 'text')?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse response.');
  return JSON.parse(jsonMatch[0]);
}

// --- Helper: Copy button ---
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-indigo-600 bg-gray-100 hover:bg-indigo-50 rounded-lg transition">
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// ============================================================================
// TAB 1: Review Sentiment Analysis
// ============================================================================

function SentimentAnalysis() {
  const [input, setInput] = useState('');
  const [sourceType, setSourceType] = useState('reviews');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const analyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const prompt = `You are a competitive intelligence analyst specializing in marketplace and e-commerce analysis. Analyze the following ${sourceType === 'reviews' ? 'product reviews' : sourceType === 'listing' ? 'competitor listing' : 'feedback'} and provide actionable insights.

=== INPUT DATA ===
${input}

Respond with ONLY valid JSON:
{
  "overallSentiment": "positive" or "neutral" or "negative",
  "sentimentScore": number (0-100, where 100 is most positive),
  "painPoints": [{"issue": "string describing the pain point", "frequency": "high" or "medium" or "low", "quote": "relevant quote from input"}],
  "buyingTriggers": [{"trigger": "string describing what motivates purchase", "importance": "high" or "medium" or "low"}],
  "opportunities": ["actionable opportunity based on analysis"],
  "competitorWeaknesses": ["weakness you could exploit"],
  "customerLanguage": ["key phrases customers use that you should mirror in your listings"],
  "summary": "2-3 sentence executive summary"
}`;

      const data = await callCompetitiveAPI('sentiment', prompt);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Source Type</label>
        <div className="flex gap-2">
          {[
            { id: 'reviews', label: 'Product Reviews' },
            { id: 'listing', label: 'Competitor Listing' },
            { id: 'feedback', label: 'General Feedback' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setSourceType(s.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                sourceType === s.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste competitor reviews, listing descriptions, or customer feedback
        </label>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={8}
          placeholder="Paste reviews, competitor product descriptions, customer comments, or any text you want analyzed for market insights..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y text-sm"
        />
      </div>

      <button
        onClick={analyze}
        disabled={loading || !input.trim()}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg transition-all"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        {loading ? 'Analyzing...' : 'Analyze Sentiment'}
      </button>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {result && <SentimentResults data={result} />}
    </div>
  );
}

function SentimentResults({ data }) {
  const sentimentColor = data.overallSentiment === 'positive' ? 'green' : data.overallSentiment === 'negative' ? 'red' : 'yellow';

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className={`p-4 bg-${sentimentColor}-50 border border-${sentimentColor}-200 rounded-xl`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-bold text-${sentimentColor}-700 uppercase`}>{data.overallSentiment} Sentiment</span>
          <span className={`text-2xl font-bold text-${sentimentColor}-700`}>{data.sentimentScore}/100</span>
        </div>
        <p className="text-sm text-gray-700">{data.summary}</p>
      </div>

      {/* Pain Points */}
      {data.painPoints?.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <h4 className="font-semibold text-red-900 mb-3">Pain Points</h4>
          <div className="space-y-2">
            {data.painPoints.map((p, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`px-2 py-0.5 text-xs rounded font-medium mt-0.5 ${
                  p.frequency === 'high' ? 'bg-red-200 text-red-800' : p.frequency === 'medium' ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-700'
                }`}>{p.frequency}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.issue}</p>
                  {p.quote && <p className="text-xs text-gray-500 italic mt-0.5">"{p.quote}"</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buying Triggers */}
      {data.buyingTriggers?.length > 0 && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <h4 className="font-semibold text-green-900 mb-3">Buying Triggers</h4>
          <div className="space-y-2">
            {data.buyingTriggers.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                  t.importance === 'high' ? 'bg-green-200 text-green-800' : t.importance === 'medium' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-700'
                }`}>{t.importance}</span>
                <p className="text-sm text-gray-800">{t.trigger}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opportunities & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-4">
        {data.opportunities?.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Opportunities</h4>
            <ul className="space-y-1">
              {data.opportunities.map((o, i) => (
                <li key={i} className="text-sm text-blue-800 flex items-start gap-1.5">
                  <Sparkles className="w-3 h-3 mt-1 flex-shrink-0" />
                  {o}
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.competitorWeaknesses?.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <h4 className="font-semibold text-amber-900 mb-2">Competitor Weaknesses</h4>
            <ul className="space-y-1">
              {data.competitorWeaknesses.map((w, i) => (
                <li key={i} className="text-sm text-amber-800 flex items-start gap-1.5">
                  <AlertCircle className="w-3 h-3 mt-1 flex-shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Customer Language */}
      {data.customerLanguage?.length > 0 && (
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
          <h4 className="font-semibold text-purple-900 mb-2">Key Customer Language (Use These in Listings)</h4>
          <div className="flex flex-wrap gap-2">
            {data.customerLanguage.map((phrase, i) => (
              <span key={i} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium">
                "{phrase}"
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TAB 2: Ad Copy Generator
// ============================================================================

function AdCopyGenerator() {
  const [itemName, setItemName] = useState('');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('professional');
  const [sellingPoints, setSellingPoints] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const generate = async () => {
    if (!itemName.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const prompt = `Generate compelling marketplace listing copy and marketing messages for this item. Focus on conversion and urgency.

Item: ${itemName}
Target Audience: ${audience || 'General marketplace buyers'}
Tone: ${tone}
Key Selling Points: ${sellingPoints || 'Not specified'}

Respond with ONLY valid JSON:
{
  "listingTitle": "string (under 80 chars, compelling and searchable)",
  "listingDescription": "string (200-400 words, formatted with line breaks for readability, includes call to action)",
  "emailSubject": "string (under 60 chars)",
  "emailBody": "string (short promotional email, 100-200 words)",
  "socialPost": "string (under 280 chars, engaging with emoji)",
  "smsMessage": "string (under 160 chars)",
  "hashtags": ["relevant", "hashtags", "for", "social"],
  "seoKeywords": ["search", "terms", "buyers", "use"]
}`;

      const data = await callCompetitiveAPI('adcopy', prompt);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
          <input
            type="text"
            value={itemName}
            onChange={e => setItemName(e.target.value)}
            placeholder="e.g., Vintage Mid-Century Teak Dresser"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
          <input
            type="text"
            value={audience}
            onChange={e => setAudience(e.target.value)}
            placeholder="e.g., Home decorators, vintage lovers"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
        <div className="flex gap-2">
          {[
            { id: 'professional', label: 'Professional' },
            { id: 'casual', label: 'Casual' },
            { id: 'urgent', label: 'Urgent/FOMO' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTone(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tone === t.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Key Selling Points</label>
        <textarea
          value={sellingPoints}
          onChange={e => setSellingPoints(e.target.value)}
          rows={3}
          placeholder="e.g., Excellent condition, original hardware, solid wood, rare design..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y text-sm"
        />
      </div>

      <button
        onClick={generate}
        disabled={loading || !itemName.trim()}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg transition-all"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        {loading ? 'Generating...' : 'Generate Ad Copy'}
      </button>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {result && <AdCopyResults data={result} />}
    </div>
  );
}

function AdCopyResults({ data }) {
  const sections = [
    { label: 'Listing Title', content: data.listingTitle, color: 'indigo' },
    { label: 'Listing Description', content: data.listingDescription, color: 'blue' },
    { label: 'Email Subject', content: data.emailSubject, color: 'green' },
    { label: 'Email Body', content: data.emailBody, color: 'green' },
    { label: 'Social Media Post', content: data.socialPost, color: 'purple' },
    { label: 'SMS Message', content: data.smsMessage, color: 'amber' },
  ];

  return (
    <div className="space-y-4">
      {sections.map((section, i) => (
        section.content && (
          <div key={i} className={`bg-${section.color}-50 border border-${section.color}-100 rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 text-sm">{section.label}</h4>
              <CopyButton text={section.content} />
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-line">{section.content}</p>
          </div>
        )
      ))}

      {data.hashtags?.length > 0 && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900 text-sm">Hashtags</h4>
            <CopyButton text={data.hashtags.map(h => `#${h}`).join(' ')} />
          </div>
          <div className="flex flex-wrap gap-2">
            {data.hashtags.map((tag, i) => (
              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">#{tag}</span>
            ))}
          </div>
        </div>
      )}

      {data.seoKeywords?.length > 0 && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900 text-sm">SEO Keywords</h4>
            <CopyButton text={data.seoKeywords.join(', ')} />
          </div>
          <div className="flex flex-wrap gap-2">
            {data.seoKeywords.map((kw, i) => (
              <span key={i} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">{kw}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TAB 3: Pricing Strategy
// ============================================================================

function PricingStrategy() {
  const [itemName, setItemName] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [ebayData, setEbayData] = useState(null);

  const analyze = async () => {
    if (!itemName.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch eBay data first
      const ebayApiUrl = import.meta.env.VITE_BACKEND_URL
        ? `${import.meta.env.VITE_BACKEND_URL}/api/ebay/search`
        : import.meta.env.DEV
        ? `http://${window.location.hostname}:3001/api/ebay/search`
        : '/api/ebay/search';

      let ebay = null;
      try {
        const ebayRes = await fetch(ebayApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemName })
        });
        if (ebayRes.ok) {
          ebay = await ebayRes.json();
          if (ebay.items?.length > 0) setEbayData(ebay);
        }
      } catch (e) {
        // eBay fetch failed, continue without it
      }

      const prompt = `You are a pricing strategist for marketplace sellers. Analyze the market data and provide strategic pricing recommendations.

Item/Category: ${itemName}
Current Asking Price: ${currentPrice ? `$${currentPrice}` : 'Not specified'}

=== EBAY MARKET DATA ===
${ebay && ebay.items?.length > 0 ? `
Found ${ebay.totalCount} items on eBay:
Average Price: $${ebay.avgPrice}
Price Range: $${ebay.priceRange.min} - $${ebay.priceRange.max}
Median: $${ebay.median}

Top listings:
${ebay.items.slice(0, 10).map((item, i) => `${i + 1}. ${item.title} - $${item.price} (${item.condition})`).join('\n')}
` : 'No eBay data available for this item.'}

Respond with ONLY valid JSON:
{
  "marketPosition": "premium" or "competitive" or "value" or "underpriced",
  "recommendedPrice": number,
  "recommendedRange": {"min": number, "max": number},
  "recommendedStrategy": "2-3 sentence strategy recommendation",
  "pricingGaps": [{"range": "$X - $Y", "opportunity": "description of the opportunity"}],
  "underservedSegments": ["segment description"],
  "competitorAnalysis": {
    "avgPrice": number or null,
    "priceDistribution": "description of how prices cluster",
    "volumeInsight": "description of supply/demand"
  },
  "actionItems": ["specific actionable step"],
  "quickWins": ["thing you can do right now to improve pricing/listing"]
}`;

      const data = await callCompetitiveAPI('strategy', prompt);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item or Category Name *</label>
          <input
            type="text"
            value={itemName}
            onChange={e => setItemName(e.target.value)}
            placeholder="e.g., iPhone 14 Pro Max 256GB"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Current/Planned Price ($)</label>
          <input
            type="number"
            value={currentPrice}
            onChange={e => setCurrentPrice(e.target.value)}
            placeholder="Optional"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      <button
        onClick={analyze}
        disabled={loading || !itemName.trim()}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg transition-all"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BarChart3 className="w-5 h-5" />}
        {loading ? 'Analyzing Market...' : 'Analyze Pricing Strategy'}
      </button>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {result && <StrategyResults data={result} ebayData={ebayData} />}
    </div>
  );
}

function StrategyResults({ data, ebayData }) {
  const positionColors = {
    premium: 'purple',
    competitive: 'blue',
    value: 'green',
    underpriced: 'red'
  };
  const color = positionColors[data.marketPosition] || 'gray';

  return (
    <div className="space-y-4">
      {/* Market Position */}
      <div className={`bg-${color}-50 border border-${color}-200 rounded-xl p-5`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className={`px-3 py-1 bg-${color}-200 text-${color}-800 text-xs font-bold uppercase rounded-full`}>
              {data.marketPosition} Position
            </span>
          </div>
          {data.recommendedPrice && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Recommended Price</p>
              <p className={`text-3xl font-bold text-${color}-700`}>${data.recommendedPrice}</p>
              {data.recommendedRange && (
                <p className="text-xs text-gray-500">Range: ${data.recommendedRange.min} - ${data.recommendedRange.max}</p>
              )}
            </div>
          )}
        </div>
        <p className="text-sm text-gray-700">{data.recommendedStrategy}</p>
      </div>

      {/* Competitor Analysis */}
      {data.competitorAnalysis && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h4 className="font-semibold text-blue-900 mb-3">Market Analysis</h4>
          <div className="space-y-2 text-sm">
            {data.competitorAnalysis.avgPrice && (
              <p className="text-blue-800"><strong>Market Average:</strong> ${data.competitorAnalysis.avgPrice}</p>
            )}
            {data.competitorAnalysis.priceDistribution && (
              <p className="text-blue-800"><strong>Distribution:</strong> {data.competitorAnalysis.priceDistribution}</p>
            )}
            {data.competitorAnalysis.volumeInsight && (
              <p className="text-blue-800"><strong>Supply/Demand:</strong> {data.competitorAnalysis.volumeInsight}</p>
            )}
          </div>
        </div>
      )}

      {/* Pricing Gaps */}
      {data.pricingGaps?.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <h4 className="font-semibold text-emerald-900 mb-3">Pricing Gaps & Opportunities</h4>
          <div className="space-y-2">
            {data.pricingGaps.map((gap, i) => (
              <div key={i} className="flex items-start gap-3 p-2 bg-white rounded-lg">
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded flex-shrink-0">{gap.range}</span>
                <p className="text-sm text-gray-700">{gap.opportunity}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Items & Quick Wins */}
      <div className="grid md:grid-cols-2 gap-4">
        {data.actionItems?.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <h4 className="font-semibold text-indigo-900 mb-2">Action Items</h4>
            <ul className="space-y-1.5">
              {data.actionItems.map((item, i) => (
                <li key={i} className="text-sm text-indigo-800 flex items-start gap-1.5">
                  <span className="text-indigo-400 mt-0.5">&#8226;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.quickWins?.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <h4 className="font-semibold text-amber-900 mb-2">Quick Wins</h4>
            <ul className="space-y-1.5">
              {data.quickWins.map((item, i) => (
                <li key={i} className="text-sm text-amber-800 flex items-start gap-1.5">
                  <Sparkles className="w-3 h-3 mt-1 flex-shrink-0 text-amber-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* eBay Data Summary */}
      {ebayData && ebayData.items?.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <h4 className="font-semibold text-gray-900 mb-2">eBay Reference Data</h4>
          <p className="text-xs text-gray-500 mb-3">Based on {ebayData.totalCount} listings found</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-gray-900">${ebayData.priceRange.min}</p>
              <p className="text-xs text-gray-500">Low</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-600">${ebayData.avgPrice}</p>
              <p className="text-xs text-gray-500">Average</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">${ebayData.priceRange.max}</p>
              <p className="text-xs text-gray-500">High</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
