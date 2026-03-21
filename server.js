/**
 * Precision Prices - Backend Server
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { searchEbaySoldItems } from './ebayService.js';
// STRIPE TEMPORARILY DISABLED - Uncomment when ready to go live
// import Stripe from 'stripe';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; // Use Railway's PORT or default to 3001
// STRIPE TEMPORARILY DISABLED - Uncomment when ready to go live
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Smart content filtering - context-aware prohibited items detection
// Focus: Images OF people (not products FOR people), actual drugs (not legitimate products),
// active weapons (not collectibles), explicit adult content

const PROHIBITED_PATTERNS = {
  // Images/photos OF people (especially minors) - use phrases that indicate a person IN the photo
  peopleInPhotos: {
    triggers: [
      'photo of child', 'photo of baby', 'picture of kid', 'image of person',
      'selfie', 'portrait', 'headshot', 'family photo', 'wedding photo',
      'photo of me', 'photo of my', 'picture of me', 'my daughter', 'my son',
      'child in photo', 'baby in picture', 'person in image'
    ],
    message: 'unauthorized upload'
  },

  // Actual illegal drugs (not baby formula, supplements, or legitimate products)
  illegalDrugs: {
    triggers: [
      'cocaine', 'heroin', 'meth', 'methamphetamine', 'fentanyl',
      'ecstasy', 'mdma', 'lsd', 'crack cocaine',
      'prescription pills for sale', 'oxycodone for sale', 'xanax for sale',
      'weed for sale', 'marijuana for sale', 'cannabis for sale'
    ],
    message: 'unauthorized upload'
  },

  // Active/functional weapons (not collectibles, antiques, or kitchen knives)
  activeWeapons: {
    triggers: [
      'loaded gun', 'functional firearm', 'working gun', 'ammunition for sale',
      'live ammo', 'real gun', 'working rifle', 'functional pistol',
      'bomb', 'explosive device', 'grenade', 'live explosives',
      'illegal weapon', 'unlicensed firearm', 'unregistered gun'
    ],
    message: 'unauthorized upload'
  },

  // Explicit adult content
  adultContent: {
    triggers: [
      'porn', 'pornography', 'pornographic', 'sex toy', 'adult toy',
      'explicit content', 'nsfw', 'xxx rated', 'erotic video',
      'nude photo', 'naked picture', 'sexual content'
    ],
    message: 'unauthorized upload'
  },

  // Clearly illegal items
  illegalItems: {
    triggers: [
      'stolen', 'stolen goods', 'counterfeit', 'fake designer',
      'fake id', 'fake identification', 'forged document',
      'hacked account', 'cracked software', 'pirated software',
      'social security card', 'passport for sale', 'drivers license for sale',
      'credit card numbers', 'bank account credentials'
    ],
    message: 'unauthorized upload'
  },

  // Human body parts/fluids
  bodyParts: {
    triggers: [
      'human organ', 'kidney for sale', 'liver for sale',
      'human blood', 'human tissue', 'body part',
      'human remains', 'organs for transplant'
    ],
    message: 'unauthorized upload'
  },

  // Protected/endangered species
  protectedAnimals: {
    triggers: [
      'ivory', 'elephant tusk', 'rhino horn',
      'tiger skin', 'endangered species', 'protected animal',
      'illegal wildlife', 'exotic animal parts'
    ],
    message: 'unauthorized upload'
  }
};

// Legitimate items that should NOT be blocked (allowlist patterns)
const LEGITIMATE_PATTERNS = [
  // Baby/children's products (not photos OF babies)
  'baby shoes', 'baby clothes', 'baby carrier', 'baby monitor', 'baby toys',
  'kids shoes', 'kids clothes', 'childrens book', 'toy for kids',
  'infant clothing', 'toddler clothes', 'stroller', 'crib', 'car seat',

  // Collectibles and antiques
  'vintage knife', 'antique sword', 'collectible knife', 'decorative knife',
  'knife collection', 'sword collection', 'military memorabilia', 'historical weapon',
  'replica gun', 'toy gun', 'prop weapon', 'display knife',

  // Legitimate health/beauty products
  'vitamin', 'supplement', 'protein powder', 'baby formula',
  'over the counter', 'otc medication', 'pain relief cream',
  'first aid', 'bandages', 'medicine cabinet'
];

// Smart content checker with context awareness
function checkProhibitedContent(text) {
  if (!text) return { allowed: true };

  const lowerText = text.toLowerCase();

  // First check if it matches legitimate patterns (allowlist)
  for (const legitimatePattern of LEGITIMATE_PATTERNS) {
    if (lowerText.includes(legitimatePattern)) {
      console.log(`✅ Allowlisted item detected: "${legitimatePattern}"`);
      return { allowed: true }; // Explicitly allow
    }
  }

  // Then check prohibited patterns
  for (const [category, config] of Object.entries(PROHIBITED_PATTERNS)) {
    for (const trigger of config.triggers) {
      if (lowerText.includes(trigger)) {
        return {
          allowed: false,
          category,
          trigger,
          message: config.message
        };
      }
    }
  }

  return { allowed: true };
}

// Enable CORS for your frontend (allow local dev and production)
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow all localhost ports for development
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }

    // Allow any local network IP for mobile testing
    if (origin.match(/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/)) {
      return callback(null, true);
    }

    // Production origins
    const allowedOrigins = [
      'https://www.precisionprices.com',
      'https://precisionprices.com',
      'https://precision-price.vercel.app',
      'https://precisionprices.firebaseapp.com',
      'https://precisionprices.web.app'
    ];

    // Allow Firebase preview channels (staging, etc.)
    if (origin.match(/^https:\/\/precisionprices--[a-z0-9-]+\.web\.app$/)) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow widget embeds from any origin
    if (origin) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' })); // Handle large image payloads

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Precision Prices backend is running' });
});

// ============================================================================
// ANALYTICS & ACTIVITY LOGGING ENDPOINTS
// ============================================================================

// Log activity event
app.post('/api/analytics/activity', async (req, res) => {
  try {
    const { sessionId, userId, activityType, metadata } = req.body;

    if (!activityType) {
      return res.status(400).json({ error: 'activityType is required' });
    }

    // Log to console for server-side monitoring
    console.log(`[ACTIVITY] ${activityType} - User: ${userId || 'guest'} - Session: ${sessionId}`);

    // Here you could also log to a server-side database or analytics service
    // For now, we're relying on client-side Firestore writes

    res.json({ success: true, logged: true });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// Get analytics summary (server-side aggregation if needed)
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // This could query your database for aggregated stats
    // For now, returning a basic structure that the frontend will populate

    res.json({
      message: 'Analytics data available via Firestore client-side queries',
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    res.status(500).json({ error: 'Failed to get analytics summary' });
  }
});

// Track page view (optional server-side logging)
app.post('/api/analytics/pageview', async (req, res) => {
  try {
    const { sessionId, page, timestamp } = req.body;

    console.log(`[PAGEVIEW] ${page} - Session: ${sessionId}`);

    res.json({ success: true });
  } catch (error) {
    console.error('Error logging pageview:', error);
    res.status(500).json({ error: 'Failed to log pageview' });
  }
});

// Pricing analysis endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        error: {
          message: 'Server configuration error: ANTHROPIC_API_KEY not set'
        }
      });
    }

    // Extract text content from messages to check for prohibited items
    let textToCheck = '';
    if (messages && messages.length > 0) {
      const userMessage = messages[messages.length - 1];
      if (userMessage && userMessage.content) {
        if (typeof userMessage.content === 'string') {
          textToCheck = userMessage.content;
        } else if (Array.isArray(userMessage.content)) {
          // Extract text from content array
          textToCheck = userMessage.content
            .filter(c => c.type === 'text')
            .map(c => c.text)
            .join(' ');
        }
      }
    }

    // Check for prohibited content
    const contentCheck = checkProhibitedContent(textToCheck);
    if (!contentCheck.allowed) {
      console.log(`🚫 Blocked prohibited content: ${contentCheck.category} - "${contentCheck.trigger}"`);
      return res.status(400).json({
        error: {
          type: 'prohibited_content',
          message: contentCheck.message,
          category: contentCheck.category
        }
      });
    }

    // Forward request to Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Internal server error'
      }
    });
  }
});

// STRIPE TEMPORARILY DISABLED - Uncomment when ready to go live
// ============================================================================
// FEEDBACK SUBMISSION ENDPOINT
// ============================================================================

// Submit feedback (price accuracy, transaction outcomes)
app.post('/api/feedback', async (req, res) => {
  try {
    const { listingId, sessionId, userId, purpose, stage, effort, value, variant, metadata } = req.body;

    // Validate required fields
    if (!listingId || !purpose || !effort) {
      return res.status(400).json({
        error: 'Missing required fields: listingId, purpose, effort'
      });
    }

    // Log feedback to server console for monitoring
    console.log(`[FEEDBACK] ${purpose} - Listing: ${listingId} - Stage: ${stage || 'pre_listing'} - Value: ${JSON.stringify(value)}`);

    // Here you could:
    // 1. Store in a PostgreSQL database for long-term analytics
    // 2. Send to analytics platform (Mixpanel, Amplitude, etc.)
    // 3. Trigger webhooks for high-value feedback
    // 4. Update pricing model training data

    // For now, acknowledge receipt (client handles Firestore storage)
    res.json({
      success: true,
      message: 'Feedback received',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing feedback:', error);
    res.status(500).json({
      error: 'Failed to process feedback',
      message: error.message
    });
  }
});

// Get feedback analytics (for admin/analytics dashboard)
app.get('/api/feedback/analytics', async (req, res) => {
  try {
    const { startDate, endDate, purpose } = req.query;

    // This would query your Postgres database for aggregated feedback
    // For now, return structure for frontend to implement

    res.json({
      message: 'Feedback analytics available via Firestore queries',
      note: 'Implement Postgres sync for server-side aggregation',
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting feedback analytics:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// STRIPE TEMPORARILY DISABLED - Uncomment when ready to go live
// Stripe checkout session endpoint
// app.post('/api/create-checkout-session', async (req, res) => {
//   try {
//     const { planId, userEmail } = req.body;

//     // Define pricing plans
//     const planPrices = {
//       basic: { amount: 199, interval: 'month' }, // $1.99
//       standard: { amount: 599, interval: 'month' }, // $5.99
//       pro: { amount: 1499, interval: 'month' } // $14.99
//     };

//     const plan = planPrices[planId];
//     if (!plan) {
//       return res.status(400).json({ error: 'Invalid plan ID' });
//     }

//     // Create Stripe checkout session
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       line_items: [
//         {
//           price_data: {
//             currency: 'usd',
//             product_data: {
//               name: `Precision Prices - ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
//               description: 'Unlimited marketplace pricing analyses'
//             },
//             unit_amount: plan.amount,
//             recurring: {
//               interval: plan.interval,
//               interval_count: plan.interval_count || 1
//             }
//           },
//           quantity: 1
//         }
//       ],
//       mode: 'subscription',
//       success_url: `${req.headers.origin || 'http://localhost:5173'}?session_id={CHECKOUT_SESSION_ID}&success=true`,
//       cancel_url: `${req.headers.origin || 'http://localhost:5173'}?canceled=true`,
//       customer_email: userEmail,
//       metadata: {
//         planId: planId
//       }
//     });

//     res.json({ sessionId: session.id, url: session.url });
//   } catch (error) {
//     console.error('Stripe error:', error);
//     res.status(500).json({
//       error: {
//         message: error.message || 'Failed to create checkout session'
//       }
//     });
//   }
// });

// ============================================================================
// WIDGET ENDPOINT (Rate-Limited, Public)
// ============================================================================

// In-memory rate limiting for widget
const widgetRateLimits = new Map();
const WIDGET_RATE_LIMIT = 5; // requests per hour per IP
const WIDGET_RATE_WINDOW = 60 * 60 * 1000; // 1 hour

// Clean up expired rate limit entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of widgetRateLimits.entries()) {
    if (now - data.windowStart > WIDGET_RATE_WINDOW) {
      widgetRateLimits.delete(key);
    }
  }
}, 10 * 60 * 1000);

app.post('/api/widget/analyze', async (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const { businessId, itemName, condition, location, email, images } = req.body;

    // Rate limiting
    const now = Date.now();
    const rateKey = `${clientIp}`;
    const rateData = widgetRateLimits.get(rateKey) || { count: 0, windowStart: now };

    if (now - rateData.windowStart > WIDGET_RATE_WINDOW) {
      rateData.count = 0;
      rateData.windowStart = now;
    }

    if (rateData.count >= WIDGET_RATE_LIMIT) {
      return res.status(429).json({
        error: { message: 'Rate limit exceeded. Please try again later.' }
      });
    }

    rateData.count++;
    widgetRateLimits.set(rateKey, rateData);

    // Validate
    if (!businessId || !itemName) {
      return res.status(400).json({
        error: { message: 'businessId and itemName are required' }
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        error: { message: 'Server configuration error' }
      });
    }

    // Check prohibited content
    const contentCheck = checkProhibitedContent(itemName + ' ' + (location || ''));
    if (!contentCheck.allowed) {
      return res.status(400).json({
        error: { type: 'prohibited_content', message: contentCheck.message }
      });
    }

    // Build content parts for Anthropic
    const contentParts = [];

    if (images && images.length > 0) {
      for (const img of images.slice(0, 3)) {
        if (img.type === 'image' && img.source) {
          contentParts.push(img);
        }
      }
    }

    const prompt = `You are a marketplace pricing expert. Analyze this item for accurate pricing.
${images && images.length > 0 ? `\nAnalyze the ${images.length} image(s).` : ''}

Item: ${itemName}
Condition: ${condition || 'good'}
Location: ${location || 'Not specified'}

Provide ONLY valid JSON:
{
  "itemName": "identified item name",
  "prices": {"min": number, "target": number, "max": number},
  "insights": "one sentence market insight"
}`;

    contentParts.push({ type: 'text', text: prompt });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: contentParts }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Widget API error:', errorData);
      return res.status(response.status).json({
        error: { message: 'Analysis failed. Please try again.' }
      });
    }

    const data = await response.json();
    const textContent = data.content.find(c => c.type === 'text')?.text || '';
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.status(500).json({
        error: { message: 'Unable to parse pricing data' }
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Log for the business owner (in production, store in Firestore)
    console.log(`[WIDGET] Business: ${businessId} - Item: ${itemName} - Prices: $${parsed.prices?.min}-$${parsed.prices?.max}${email ? ` - Email: ${email}` : ''}`);

    res.json({
      itemName: parsed.itemName || itemName,
      prices: parsed.prices || { min: 0, target: 0, max: 0 },
      insights: parsed.insights || '',
      businessId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Widget analysis error:', error);
    res.status(500).json({
      error: { message: 'Something went wrong. Please try again.' }
    });
  }
});

// ============================================================================
// EBAY BROWSE API ENDPOINT
// ============================================================================

app.post('/api/ebay/search', async (req, res) => {
  try {
    const { itemName, condition, category } = req.body;

    if (!itemName) {
      return res.status(400).json({ error: 'itemName is required' });
    }

    // Gracefully handle missing eBay credentials
    if (!process.env.EBAY_APP_ID || !process.env.EBAY_CERT_ID) {
      return res.status(200).json({
        items: [],
        totalCount: 0,
        avgPrice: null,
        priceRange: null,
        message: 'eBay integration not configured'
      });
    }

    const result = await searchEbaySoldItems(itemName, condition, category);
    res.json(result || { items: [], totalCount: 0, avgPrice: null, priceRange: null });
  } catch (error) {
    console.error('eBay search error:', error);
    res.status(500).json({ error: 'eBay search failed' });
  }
});

// ============================================================================
// COMPETITIVE INTELLIGENCE ENDPOINT
// ============================================================================

app.post('/api/competitive/analyze', async (req, res) => {
  try {
    const { type, messages } = req.body;

    if (!type || !messages) {
      return res.status(400).json({ error: 'type and messages are required' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        error: { message: 'Server configuration error: ANTHROPIC_API_KEY not set' }
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Competitive intel API error:', errorData);
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Competitive intel error:', error);
    res.status(500).json({
      error: { message: error.message || 'Internal server error' }
    });
  }
});

// ============================================================================
// BULK ESTATE SALE PRICING ENDPOINT
// ============================================================================

const ESTATE_SALE_SYSTEM_PROMPT = `You are an expert estate sale item pricer with deep knowledge of secondhand market values for household items, furniture, collectibles, vintage goods, kitchenware, electronics, tools, and all categories found in estate sales.

Given a photo of an item, respond with ONLY a JSON object (no markdown, no explanation) in this exact format:
{
  "itemName": "Brief descriptive name",
  "category": "one of: furniture, kitchenware, collectibles, electronics, tools, clothing, books, art, jewelry, toys, outdoor, other",
  "condition": "one of: excellent, good, fair, poor",
  "priceLow": 5,
  "priceMedium": 15,
  "priceHigh": 25,
  "confidence": 0.85,
  "notes": "Optional brief note about the item"
}

Pricing guidelines:
- Low = garage sale / quick-sell price
- Medium = fair estate sale price (what most buyers would pay)
- High = collector / antique shop retail price
- Round to nearest $5 for items under $50, nearest $10 for $50-200, nearest $25 over $200
- confidence is 0.0 to 1.0`;

app.post('/api/bulk-price', async (req, res) => {
  try {
    const { images } = req.body; // array of { base64, mediaType }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'images array is required' });
    }

    if (images.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 images per batch' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Server configuration error: ANTHROPIC_API_KEY not set' });
    }

    const results = await Promise.all(images.map(async (img, idx) => {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 512,
            system: ESTATE_SALE_SYSTEM_PROMPT,
            messages: [{
              role: 'user',
              content: [
                { type: 'image', source: { type: 'base64', media_type: img.mediaType || 'image/jpeg', data: img.base64 } },
                { type: 'text', text: 'Price this estate sale item.' }
              ]
            }]
          })
        });

        if (!response.ok) {
          throw new Error(`Anthropic error ${response.status}`);
        }

        const data = await response.json();
        const text = data.content?.[0]?.text || '';
        const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return {
          index: idx,
          success: true,
          itemName: parsed.itemName || 'Unknown item',
          category: parsed.category || 'other',
          condition: parsed.condition || 'good',
          aiPriceLow: parsed.priceLow || 5,
          aiPriceMedium: parsed.priceMedium || 15,
          aiPriceHigh: parsed.priceHigh || 25,
          aiConfidence: parsed.confidence || 0.7,
          notes: parsed.notes || '',
        };
      } catch (err) {
        console.error(`[BULK-PRICE] Image ${idx} error:`, err.message);
        return { index: idx, success: false, error: err.message };
      }
    }));

    console.log(`[BULK-PRICE] Processed ${results.length} images, ${results.filter(r => r.success).length} successful`);
    res.json({ results });

  } catch (error) {
    console.error('Bulk price error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// ============================================================================
// SQUARE INTEGRATION
// ============================================================================

import crypto from 'crypto';
import bwipjs from 'bwip-js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const SQUARE_APP_ID       = process.env.SQUARE_APP_ID || '';
const SQUARE_APP_SECRET   = process.env.SQUARE_APP_SECRET || '';
const SQUARE_WEBHOOK_KEY  = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || '';
const SQUARE_ENV          = process.env.SQUARE_ENVIRONMENT || 'sandbox';
const SQUARE_BASE         = SQUARE_ENV === 'production'
  ? 'https://connect.squareup.com'
  : 'https://connect.squareupsandbox.com';
const APP_URL             = process.env.APP_URL || 'https://precisionprices.com';

// ── Square OAuth ──────────────────────────────────────────────────────────────

app.get('/api/square/auth-url', (req, res) => {
  const { userId } = req.query;
  if (!SQUARE_APP_ID) return res.status(500).json({ error: 'Square not configured' });

  const state = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString('base64');
  const scopes = ['ITEMS_READ', 'ITEMS_WRITE', 'ORDERS_READ', 'PAYMENTS_READ'].join('+');
  const url = `${SQUARE_BASE}/oauth2/authorize?client_id=${SQUARE_APP_ID}&scope=${scopes}&state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(APP_URL + '/api/square/oauth/callback')}`;
  res.json({ url });
});

app.get('/api/square/oauth/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.redirect(`${APP_URL}/app/settings/square?error=no_code`);

  try {
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    const tokenRes = await fetch(`${SQUARE_BASE}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Square-Version': '2024-01-18' },
      body: JSON.stringify({
        client_id: SQUARE_APP_ID,
        client_secret: SQUARE_APP_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${APP_URL}/api/square/oauth/callback`,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('No access token');

    // Get merchant info for location
    const merchantRes = await fetch(`${SQUARE_BASE}/v2/merchants/me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'Square-Version': '2024-01-18' },
    });
    const merchantData = await merchantRes.json();
    const merchantId = merchantData.merchant?.id || '';

    // Get first location
    const locRes = await fetch(`${SQUARE_BASE}/v2/locations`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'Square-Version': '2024-01-18' },
    });
    const locData = await locRes.json();
    const locationId = locData.locations?.[0]?.id || '';

    // Store in Firestore via Admin SDK would be ideal but we'll pass back to client
    res.redirect(`${APP_URL}/app/settings/square?connected=1&merchantId=${merchantId}&locationId=${locationId}&token=${tokenData.access_token}&refresh=${tokenData.refresh_token || ''}&userId=${userId}`);
  } catch (err) {
    console.error('Square OAuth error:', err);
    res.redirect(`${APP_URL}/app/settings/square?error=oauth_failed`);
  }
});

// ── Square Catalog Push ───────────────────────────────────────────────────────

app.post('/api/square/push-catalog', async (req, res) => {
  try {
    const { items, accessToken, locationId } = req.body;
    if (!items?.length || !accessToken) {
      return res.status(400).json({ error: 'items and accessToken required' });
    }

    const BATCH_SIZE = 100;
    const results = [];

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);

      const objects = batch.flatMap(item => {
        const itemId = `#pp-${item.id}`;
        const varId  = `#pp-${item.id}-var`;
        return [{
          type: 'ITEM',
          id: itemId,
          item_data: {
            name: item.itemName || 'Estate Sale Item',
            description: `Priced by PrecisionPrices | ${item.category || 'misc'}`,
            variations: [{
              type: 'ITEM_VARIATION',
              id: varId,
              item_variation_data: {
                name: 'Regular',
                sku: `PP-${item.id}`,
                pricing_type: 'FIXED_PRICING',
                price_money: { amount: Math.round((item.aiPriceMedium || 0) * 100), currency: 'USD' },
              },
            }],
          },
        }];
      });

      const squareRes = await fetch(`${SQUARE_BASE}/v2/catalog/batch-upsert`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2024-01-18',
        },
        body: JSON.stringify({
          idempotency_key: `pp-batch-${Date.now()}-${i}`,
          batches: [{ objects }],
        }),
      });

      const squareData = await squareRes.json();
      if (squareData.errors?.length) {
        console.error('Square catalog errors:', squareData.errors);
      }

      // Map temporary IDs to real Square IDs
      const idMapping = squareData.id_mappings || [];
      batch.forEach(item => {
        const mapping = idMapping.find(m => m.client_object_id === `#pp-${item.id}`);
        results.push({ ppId: item.id, squareId: mapping?.object_id || null, sku: `PP-${item.id}` });
      });
    }

    console.log(`[SQUARE] Pushed ${results.length} items to catalog`);
    res.json({ success: true, results });
  } catch (err) {
    console.error('Square catalog push error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Label PDF Generation ──────────────────────────────────────────────────────

app.post('/api/generate-labels', async (req, res) => {
  try {
    const { items, saleName } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'items required' });

    // Sort by price tier
    const sorted = [...items].sort((a, b) => (a.aiPriceMedium || 0) - (b.aiPriceMedium || 0));

    const pdfDoc   = await PDFDocument.create();
    const font     = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Label dimensions: 2.25" x 1.25" = 162pt x 90pt (72pt per inch)
    const LW = 162, LH = 90;
    // 4 labels per row, 8 rows per page on letter (612 x 792)
    const COLS = 4, ROWS = 8;
    const PAD_X = (612 - COLS * LW) / 2;
    const PAD_Y = (792 - ROWS * LH) / 2;

    let page, col = 0, row = 0;

    const newPage = () => {
      page = pdfDoc.addPage([612, 792]);
      col = 0; row = 0;
    };
    newPage();

    for (const item of sorted) {
      if (col >= COLS) { col = 0; row++; }
      if (row >= ROWS) newPage();

      const x = PAD_X + col * LW;
      const y = 792 - PAD_Y - (row + 1) * LH;

      // Label border
      page.drawRectangle({ x, y, width: LW, height: LH, borderWidth: 0.5, borderColor: rgb(0.8, 0.8, 0.8) });

      // Item name (truncate to ~22 chars)
      const name = (item.itemName || 'Item').slice(0, 24);
      page.drawText(name, { x: x + 4, y: y + LH - 14, size: 8, font: fontReg, color: rgb(0.2, 0.2, 0.2), maxWidth: LW - 8 });

      // Price — large and bold
      const priceStr = `$${item.aiPriceMedium}`;
      page.drawText(priceStr, { x: x + 4, y: y + LH - 30, size: 18, font, color: rgb(0.05, 0.05, 0.05) });

      // Barcode using bwip-js (CODE128)
      const sku = `PP-${item.id}`;
      try {
        const barcodePng = await bwipjs.toBuffer({
          bcid: 'code128', text: sku,
          scale: 2, height: 8, includetext: false, backgroundcolor: 'ffffff',
        });
        const barcodeImg = await pdfDoc.embedPng(barcodePng);
        page.drawImage(barcodeImg, { x: x + 4, y: y + 6, width: LW - 8, height: 28 });
      } catch (_) { /* barcode generation failed — skip */ }

      // SKU text under barcode
      page.drawText(sku, { x: x + 4, y: y + 2, size: 5, font: fontReg, color: rgb(0.5, 0.5, 0.5) });

      col++;
    }

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="labels-${Date.now()}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Label generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Square Webhook Receiver ───────────────────────────────────────────────────

// Square sends raw body for signature verification — must parse manually
app.post('/api/webhooks/square', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-square-hmacsha256-signature'];
    const rawBody   = req.body;

    // Verify signature
    if (SQUARE_WEBHOOK_KEY && signature) {
      const url   = `${APP_URL}/api/webhooks/square`;
      const hmac  = crypto.createHmac('sha256', SQUARE_WEBHOOK_KEY);
      hmac.update(url + rawBody.toString());
      const expected = hmac.digest('base64');
      if (signature !== expected) {
        console.warn('[WEBHOOK] Invalid Square signature');
        return res.status(401).send('Unauthorized');
      }
    }

    const event = JSON.parse(rawBody.toString());
    console.log(`[WEBHOOK] Square event: ${event.type}`);

    if (event.type !== 'order.completed') {
      return res.status(200).send('OK');
    }

    const orderId    = event.data?.object?.order_updated?.order_id || event.data?.id;
    const merchantId = event.merchant_id;

    // We need the access token to fetch order details.
    // Look it up from Firestore via Admin SDK (if available) or skip token fetch.
    // For now, extract line items from the event payload directly if present.
    const lineItems = event.data?.object?.order?.line_items || [];

    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getFirestore: getAdminFirestore } = await import('firebase-admin/firestore');

    let adminDb;
    try {
      if (!getApps().length) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
        initializeApp({ credential: cert(serviceAccount) });
      }
      adminDb = getAdminFirestore();
    } catch (_) {
      console.warn('[WEBHOOK] Firebase Admin not configured — skipping Firestore update');
      return res.status(200).send('OK');
    }

    for (const lineItem of lineItems) {
      const sku = lineItem.catalog_object_id || lineItem.uid || '';
      if (!sku.startsWith('PP-')) continue;

      const ppItemId   = sku.replace('PP-', '');
      const soldCents  = parseInt(lineItem.total_money?.amount || lineItem.base_price_money?.amount || '0');
      const soldPrice  = soldCents / 100;

      // Find the item across all sales (search by sku field)
      const salesSnap = await adminDb.collection('sales').get();
      for (const saleDoc of salesSnap.docs) {
        const itemQuery = await adminDb
          .collection('sales').doc(saleDoc.id)
          .collection('items').where('id', '==', ppItemId).limit(1).get();

        if (!itemQuery.empty) {
          const itemRef = itemQuery.docs[0].ref;
          const itemData = itemQuery.docs[0].data();

          await itemRef.update({
            outcome: 'sold',
            soldPrice,
            soldAt: new Date(),
            squareOrderId: orderId,
            wasDiscounted: soldPrice < (itemData.aiPriceMedium || soldPrice),
            autoRecorded: true,
          });

          // Write to training_data for AI improvement
          await adminDb.collection('training_data').add({
            itemId:         ppItemId,
            saleId:         saleDoc.id,
            imageUrl:       itemData.imageUrl || null,
            aiPriceMedium:  itemData.aiPriceMedium,
            soldPrice,
            category:       itemData.category,
            condition:      itemData.condition,
            delta:          soldPrice - (itemData.aiPriceMedium || 0),
            accuracy:       itemData.aiPriceMedium ? soldPrice / itemData.aiPriceMedium : null,
            autoRecorded:   true,
            timestamp:      new Date(),
          });

          console.log(`[WEBHOOK] Item ${ppItemId} sold for $${soldPrice} — Firestore updated`);
          break;
        }
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('[WEBHOOK] Error:', err);
    res.status(500).send('Error');
  }
});

app.listen(PORT, () => {
  console.log(`
🚀 Precision Prices Backend Server Running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server URL: http://localhost:${PORT}
🔗 Frontend:   http://localhost:5173
💚 Status:     Ready to accept requests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});
