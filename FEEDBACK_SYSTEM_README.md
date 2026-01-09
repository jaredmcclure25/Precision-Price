# Precision Prices - Feedback System

## Overview

This feedback system enables you to collect user input on pricing accuracy and transaction outcomes, building a proprietary database of real marketplace pricing data. The system uses a **hybrid storage approach**: Firebase for real-time data collection and optional PostgreSQL sync for advanced analytics.

## Key Features

✅ **Micro Feedback**: Quick thumbs up/down on price accuracy (low effort, high volume)
✅ **Transaction Tracking**: Collect actual sale prices, time-to-sell, and ghosting data
✅ **Anonymous + Authenticated**: Track both guest users and registered accounts
✅ **Trust-Weighted**: Higher quality feedback receives higher weight in analytics
✅ **Hybrid Storage**: Firebase for real-time, Postgres for scale
✅ **Privacy-First**: No scraping, no Meta APIs, no PII by default

## Architecture

```
┌─────────────┐
│ User Action │ (Price item / Report sale)
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Session Manager │ (Anonymous or Authenticated)
└────────┬────────┘
         │
         ▼
┌──────────────────┐
│ Feedback System  │
│  - MicroFeedback │ → Quick thumbs up/down
│  - TransactionO. │ → Detailed sale tracking
└────────┬─────────┘
         │
         ▼
┌────────────────────┐
│ Firebase Firestore │ (Real-time storage)
└────────┬───────────┘
         │
         │ (Optional sync)
         ▼
┌────────────────────┐
│ PostgreSQL/Railway │ (Analytics & ML training)
└────────────────────┘
```

## File Structure

```
precision-prices/
├── src/
│   ├── feedback/
│   │   ├── feedbackEnums.js          # Enums for feedback types
│   │   ├── feedbackOrchestrator.js   # Weight calculation & validation
│   │   ├── sessionManager.js         # Session tracking
│   │   ├── feedbackService.js        # Firebase operations
│   │   ├── postgresSchema.sql        # Postgres schema for sync
│   │   └── index.js                  # Centralized exports
│   ├── components/
│   │   ├── MicroFeedback.jsx         # Thumbs up/down component
│   │   ├── TransactionOutcome.jsx    # Sale tracking modal
│   │   └── FeedbackDashboard.jsx     # Analytics dashboard
│   └── hooks/
│       └── useFeedbackSystem.js      # React hook
├── server.js                          # Backend endpoints
├── FEEDBACK_INTEGRATION_GUIDE.md     # Integration instructions
└── FEEDBACK_SYSTEM_README.md         # This file
```

## Quick Start

### 1. Install Dependencies

No additional dependencies needed! The system uses your existing Firebase setup.

### 2. Update Firestore Rules

Add these rules to `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Sessions: Allow read/write for all (anonymous tracking)
    match /sessions/{sessionId} {
      allow read, write: if true;
    }

    // Temp listings: Allow read/write for all
    match /listings_temp/{listingId} {
      allow read, write: if true;
    }

    // Feedback events: Write for all, read for authenticated
    match /feedback_events/{eventId} {
      allow write: if true; // Anyone can submit feedback
      allow read: if request.auth != null; // Only authenticated users can read
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

### 3. Integrate Into App

Follow the [FEEDBACK_INTEGRATION_GUIDE.md](FEEDBACK_INTEGRATION_GUIDE.md) for step-by-step integration instructions.

## Usage Examples

### Example 1: Micro Feedback (Price Accuracy)

```javascript
import MicroFeedback from './components/MicroFeedback';

<MicroFeedback
  listingId="listing_123"
  onFeedbackSubmit={async (feedbackData) => {
    const result = await handleFeedbackSubmit(feedbackData);
    console.log('Feedback submitted:', result);
  }}
/>
```

**User sees:** Thumbs up / Thumbs down buttons
**Data collected:**
```json
{
  "listingId": "listing_123",
  "purpose": "price_accuracy",
  "effort": "micro",
  "stage": "pre_listing",
  "value": true,
  "weight": 0.3
}
```

### Example 2: Transaction Outcome

```javascript
import TransactionOutcome from './components/TransactionOutcome';

<TransactionOutcome
  listingId="listing_123"
  suggestedPrice={120}
  onSubmit={async (outcomeData) => {
    const result = await handleFeedbackSubmit(outcomeData);
    console.log('Transaction recorded:', result);
  }}
  onClose={() => setShowModal(false)}
/>
```

**User sees:** Modal asking if item sold, final price, days to sell
**Data collected:**
```json
{
  "listingId": "listing_123",
  "purpose": "time_to_sell",
  "effort": "short",
  "stage": "sold",
  "value": {
    "sold": true,
    "finalPrice": 125,
    "suggestedPrice": 120,
    "daysToSell": 3,
    "ghosted": false,
    "variance": 4.2
  },
  "weight": 1.2
}
```

## Feedback Weighting System

Feedback is weighted based on **effort level** and **transaction stage**:

| Effort Level | Base Weight | + Sold Bonus | Total Weight |
|--------------|-------------|--------------|--------------|
| Micro        | 0.3         | +0.5         | 0.8          |
| Short        | 0.7         | +0.5         | 1.2          |
| Long         | 1.0         | +0.5         | 1.5 (max)    |

**Why weighting?**
- Micro feedback is quick but less reliable
- Detailed sale data is more valuable for pricing
- Post-sale feedback (stage: "sold") gets bonus weight

## Data Privacy & Compliance

✅ **No PII by default**: Session IDs are anonymous unless user signs up
✅ **No scraping**: All data is user-submitted voluntarily
✅ **GDPR-friendly**: Users can request deletion (implement separately)
✅ **Transparent**: Users know their data helps improve pricing

## Firebase Collections

### `sessions`
Tracks user sessions (anonymous + authenticated)

```javascript
{
  sessionId: "sess_1704123456789_abc",
  userId: "auth_user_123" | null,
  userEmail: "user@example.com" | null,
  deviceType: "mobile" | "desktop" | "tablet",
  region: "90210" | null,
  isAnonymous: true | false,
  createdAt: Timestamp,
  lastActiveAt: Timestamp
}
```

### `listings_temp`
Temporary listing records for feedback tracking

```javascript
{
  listingId: "listing_1704123456789_xyz",
  sessionId: "sess_1704123456789_abc",
  category: "electronics",
  itemName: "iPhone 12 Pro",
  priceSuggested: 450,
  confidenceScore: 85,
  stage: "pre_listing" | "active_listing" | "sold",
  createdAt: Timestamp
}
```

### `feedback_events`
All feedback submissions

```javascript
{
  listingId: "listing_1704123456789_xyz",
  sessionId: "sess_1704123456789_abc",
  userId: "auth_user_123" | null,
  purpose: "price_accuracy" | "time_to_sell" | "negotiation_fairness" | "ghosting" | "ux_usability",
  stage: "pre_listing" | "active_listing" | "sold" | "not_sold",
  effort: "micro" | "short" | "long",
  value: boolean | number | string | object,
  weight: 0.3 - 1.5,
  segment: "casual_seller" | "mover" | "quick_cash" | "reseller",
  variant: "button" | "slider" | "input" | "form",
  metadata: {},
  createdAt: Timestamp
}
```

## Analytics Queries

### Get Recent Feedback
```javascript
import { getRecentFeedback, calculateFeedbackStats } from './feedback';

const feedback = await getRecentFeedback(30); // Last 30 days
const stats = calculateFeedbackStats(feedback);

console.log(stats);
// {
//   totalCount: 156,
//   avgWeight: 0.65,
//   priceAccuracy: 87.3,
//   soldCount: 42,
//   avgDaysToSell: 4.2
// }
```

### Query Firestore Directly
```javascript
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// Get all sold items in last 7 days
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const feedbackRef = collection(db, 'feedback_events');
const q = query(
  feedbackRef,
  where('stage', '==', 'sold'),
  where('createdAt', '>=', sevenDaysAgo)
);

const snapshot = await getDocs(q);
const soldItems = [];
snapshot.forEach(doc => soldItems.push(doc.data()));
```

## PostgreSQL Sync (Optional)

For production-scale analytics, sync Firebase data to PostgreSQL.

### 1. Set up Railway Postgres

```bash
# Install Railway CLI
npm install -g railway

# Link project
railway link

# Add Postgres
railway add --plugin postgresql

# Get database URL
railway variables
```

### 2. Run Schema Migration

```bash
psql $DATABASE_URL < src/feedback/postgresSchema.sql
```

### 3. Create Sync Script

```javascript
// scripts/syncFeedbackToPostgres.js
import { getRecentFeedback } from '../src/feedback';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function syncFeedback() {
  const feedback = await getRecentFeedback(1); // Last 24 hours

  for (const item of feedback) {
    await pool.query(
      `INSERT INTO feedback (feedback_id, listing_id, session_id, purpose, stage, effort, value, weight, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (feedback_id) DO NOTHING`,
      [item.id, item.listingId, item.sessionId, item.purpose, item.stage, item.effort, item.value, item.weight, item.createdAt]
    );
  }

  console.log(`Synced ${feedback.length} feedback items`);
}

syncFeedback().catch(console.error);
```

Run sync periodically:
```bash
# Add to package.json
"scripts": {
  "sync-feedback": "node scripts/syncFeedbackToPostgres.js"
}

# Run via cron or Railway cron job
0 */6 * * * npm run sync-feedback  # Every 6 hours
```

## Advanced Features

### Incentivize Feedback

Reward users for high-quality feedback:

```javascript
// After successful feedback submission
if (result.weight >= 1.0) {
  // Award points/credits
  await updateUserProfile({
    rewardPoints: userProfile.rewardPoints + 10,
    feedbackCount: userProfile.feedbackCount + 1
  });

  // Unlock premium features
  if (userProfile.feedbackCount >= 10) {
    grantPremiumAccess(userId, '7 days free');
  }
}
```

### Use Feedback to Improve Pricing

```javascript
// In pricingIntelligence.js
async function getPriceEstimate(category, location) {
  // Get weighted average from feedback data
  const feedback = await query(
    collection(db, 'feedback_events'),
    where('purpose', '==', 'time_to_sell'),
    where('stage', '==', 'sold'),
    where('value.category', '==', category)
  );

  let totalWeightedPrice = 0;
  let totalWeight = 0;

  feedback.forEach(item => {
    totalWeightedPrice += item.value.finalPrice * item.weight;
    totalWeight += item.weight;
  });

  const weightedAvgPrice = totalWeightedPrice / totalWeight;
  return weightedAvgPrice;
}
```

## Monitoring & Debugging

### Check Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database**
4. Check collections: `sessions`, `listings_temp`, `feedback_events`

### Server Logs

```bash
# Check server logs for feedback submissions
npm run server

# Look for:
# [FEEDBACK] price_accuracy - Listing: listing_123 - Stage: pre_listing - Value: true
```

### Browser Console

```javascript
// Test feedback submission
import { submitFeedback } from './feedback';

const testFeedback = {
  listingId: 'test_123',
  purpose: 'price_accuracy',
  effort: 'micro',
  value: true
};

const result = await submitFeedback(testFeedback, sessionData);
console.log('Test result:', result);
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Feedback not saving | Check Firestore rules, verify Firebase config |
| Session not created | Check browser localStorage, verify session manager |
| Weight always 0.3 | Verify effort and stage are set correctly |
| Server endpoint 404 | Ensure server is running, check CORS settings |

## Next Steps

1. ✅ **Integrate into App.jsx** - Follow integration guide
2. ✅ **Test with real users** - Start collecting data
3. ⬜ **Set up Postgres sync** - For production analytics
4. ⬜ **Build ML model** - Train on feedback data
5. ⬜ **Add incentive system** - Reward high-quality feedback

## Support

For questions or issues:
- Check [FEEDBACK_INTEGRATION_GUIDE.md](FEEDBACK_INTEGRATION_GUIDE.md)
- Review Firebase Console for data
- Check browser console for errors
- Test with small dataset first

---

**Version:** 1.0.0
**Created:** January 2025
**Copyright:** © 2025 Jared McClure / PrecisionPrices.Com
**License:** Proprietary - All Rights Reserved
