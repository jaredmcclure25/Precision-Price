/**
 * Precision Prices - Backend Server
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

// Enable CORS for your frontend (allow both ports)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
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
