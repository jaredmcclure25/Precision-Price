/**
 * Precision Prices - Backend Server
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

    // Log blocked origins for debugging
    console.log(`[CORS] Blocked origin: ${origin}`);
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
