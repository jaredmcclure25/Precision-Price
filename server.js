/**
 * Precision Prices - Backend Server
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; // Use Railway's PORT or default to 3001
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Prohibited items list - items not allowed for pricing analysis
const PROHIBITED_ITEMS = {
  people: [
    'child', 'children', 'kid', 'kids', 'baby', 'babies', 'infant', 'toddler',
    'minor', 'minors', 'person', 'people', 'human', 'humans', 'individual',
    'boy', 'girl', 'teen', 'teenager', 'youth'
  ],
  drugs: [
    'drug', 'drugs', 'narcotic', 'narcotics', 'cocaine', 'heroin', 'meth',
    'methamphetamine', 'marijuana', 'cannabis', 'weed', 'opioid', 'fentanyl',
    'ecstasy', 'mdma', 'lsd', 'psychedelic', 'prescription', 'pill', 'pills',
    'xanax', 'adderall', 'oxycodone', 'hydrocodone', 'percocet', 'vicodin',
    'medication', 'medicine', 'pharmaceutical', 'controlled substance'
  ],
  weapons: [
    'gun', 'guns', 'firearm', 'firearms', 'weapon', 'weapons', 'rifle', 'pistol',
    'handgun', 'shotgun', 'ammunition', 'ammo', 'bullet', 'bullets', 'explosive',
    'explosives', 'bomb', 'grenade', 'knife', 'knives', 'sword', 'dagger',
    'machete', 'brass knuckles', 'nunchucks', 'taser', 'stun gun'
  ],
  adult: [
    'porn', 'pornography', 'pornographic', 'sex toy', 'adult toy', 'vibrator',
    'dildo', 'explicit', 'nsfw', 'xxx', 'erotic', 'sexual', 'nude', 'nudity'
  ],
  illegal: [
    'stolen', 'counterfeit', 'fake id', 'fake identification', 'hacking tool',
    'crack', 'pirated', 'illegal', 'classified', 'confidential document',
    'government document', 'passport', 'social security', 'ssn',
    'credit card', 'debit card', 'bank account'
  ],
  dangerous: [
    'poison', 'toxic', 'hazardous', 'radioactive', 'asbestos', 'mercury',
    'lead paint', 'biological weapon', 'chemical weapon'
  ],
  bodyParts: [
    'organ', 'organs', 'kidney', 'liver', 'heart', 'blood', 'plasma',
    'tissue', 'body part', 'human remains'
  ],
  animals: [
    'endangered species', 'ivory', 'tiger', 'rhino horn', 'elephant tusk',
    'protected animal', 'illegal wildlife'
  ]
};

// Function to check if item description contains prohibited content
function checkProhibitedContent(text) {
  if (!text) return { allowed: true };

  const lowerText = text.toLowerCase();

  for (const [category, keywords] of Object.entries(PROHIBITED_ITEMS)) {
    for (const keyword of keywords) {
      // Use word boundaries to avoid false positives
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(lowerText)) {
        return {
          allowed: false,
          category,
          keyword,
          message: `This item category (${category}) is not allowed for pricing analysis. We cannot provide pricing for ${keyword}.`
        };
      }
    }
  }

  return { allowed: true };
}

// Enable CORS for your frontend (allow local dev and production)
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'https://www.precisionprices.com',
    'https://precisionprices.com'
  ],
  credentials: true
}));

app.use(express.json({ limit: '50mb' })); // Handle large image payloads

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Precision Prices backend is running' });
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
      console.log(`🚫 Blocked prohibited content: ${contentCheck.category} - ${contentCheck.keyword}`);
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

// Stripe checkout session endpoint
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { planId, userEmail } = req.body;

    // Define pricing plans
    const planPrices = {
      basic: { amount: 499, interval: 'month' }, // $4.99
      standard: { amount: 999, interval: 'month' }, // $9.99
      pro: { amount: 1999, interval: 'month' } // $19.99
    };

    const plan = planPrices[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Precision Prices - ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
              description: 'Unlimited marketplace pricing analyses'
            },
            unit_amount: plan.amount,
            recurring: {
              interval: plan.interval,
              interval_count: plan.interval_count || 1
            }
          },
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin || 'http://localhost:5173'}?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}?canceled=true`,
      customer_email: userEmail,
      metadata: {
        planId: planId
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Failed to create checkout session'
      }
    });
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
