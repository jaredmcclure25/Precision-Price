# Feedback System Integration Guide

## Overview
This guide explains how to integrate the feedback system into your Precision Prices app. The feedback system collects user input on price accuracy and transaction outcomes to refine your pricing database.

## System Architecture

### Data Flow
1. **User analyzes item** → Creates session + temp listing
2. **Price displayed** → Show MicroFeedback component (thumbs up/down)
3. **Item sells/lists** → Show TransactionOutcome modal (collect sale data)
4. **Feedback submitted** → Store in Firebase → Optional sync to Postgres

### File Structure
```
src/
├── feedback/
│   ├── feedbackEnums.js          # Enums for feedback types
│   ├── feedbackOrchestrator.js   # Weight calculation & validation
│   ├── sessionManager.js         # Session tracking (anonymous + auth)
│   ├── feedbackService.js        # Firebase operations
│   └── index.js                  # Centralized exports
├── components/
│   ├── MicroFeedback.jsx         # Quick thumbs up/down
│   └── TransactionOutcome.jsx    # Detailed sale tracking
└── hooks/
    └── useFeedbackSystem.js      # React hook for feedback
```

## Integration Steps

### Step 1: Add Hook to App.jsx

Add the feedback hook at the top of your MarketplacePricer component:

```javascript
import { useFeedbackSystem } from './hooks/useFeedbackSystem';
import MicroFeedback from './components/MicroFeedback';
import TransactionOutcome from './components/TransactionOutcome';

export default function MarketplacePricer() {
  // Existing hooks...
  const { currentUser } = useAuth();

  // Add feedback system hook
  const {
    sessionData,
    currentListingId,
    createListingRecord,
    handleFeedbackSubmit
  } = useFeedbackSystem();

  // Add state for transaction outcome modal
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // ...rest of component
}
```

### Step 2: Create Listing Record After Analysis

In your `handlePricing` function, after `setResult(parsedResult)`:

```javascript
// Around line 591 in App.jsx, after setResult(parsedResult):

setResult(parsedResult);
setShowFeedback(true);

// Add this:
// Create listing record for feedback tracking
const listingId = await createListingRecord(parsedResult);
console.log('Created listing record:', listingId);

// Scroll to results...
```

### Step 3: Add MicroFeedback Component to Results

In your `Results` component (around line 1359), replace or add after the existing feedback:

```javascript
{/* Replace existing FeedbackForm with MicroFeedback */}
{showFeedback && !feedbackSubmitted && currentListingId && (
  <MicroFeedback
    listingId={currentListingId}
    onFeedbackSubmit={async (feedbackData) => {
      const result = await handleFeedbackSubmit(feedbackData, userProfile);
      if (result.success) {
        setFeedbackSubmitted(true);
      }
    }}
  />
)}
```

### Step 4: Add Transaction Outcome Modal

Add a button in the results section to trigger transaction outcome tracking:

```javascript
// In Results component, add near the "New Analysis" button (line 1295):

<button
  type="button"
  onClick={() => setShowTransactionModal(true)}
  className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg"
>
  <CheckCircle className="w-4 h-4" />
  Report Sale
</button>

// Then add modal before closing Results component:
{showTransactionModal && currentListingId && (
  <TransactionOutcome
    listingId={currentListingId}
    suggestedPrice={result.suggestedPriceRange.optimal}
    onSubmit={async (outcomeData) => {
      const result = await handleFeedbackSubmit(outcomeData, userProfile);
      if (result.success) {
        console.log('Transaction outcome recorded');
        // Optionally update user stats
      }
    }}
    onClose={() => setShowTransactionModal(false)}
  />
)}
```

### Step 5: Update Firebase Security Rules

Add these rules to [firestore.rules](firestore.rules):

```javascript
// Allow reading/writing sessions (anonymous + authenticated)
match /sessions/{sessionId} {
  allow read, write: if true; // Or restrict to session owner
}

// Allow reading/writing temp listings
match /listings_temp/{listingId} {
  allow read, write: if true; // Or restrict to session owner
}

// Allow writing feedback events (read for analytics only)
match /feedback_events/{eventId} {
  allow write: if true; // Anyone can submit feedback
  allow read: if request.auth != null; // Only authenticated users can read
}
```

### Step 6: Deploy Updated Rules

```bash
firebase deploy --only firestore:rules
```

## Usage Examples

### Example 1: Quick Price Accuracy Feedback
```javascript
// User sees price, clicks thumbs up
// MicroFeedback automatically submits:
{
  listingId: "listing_123",
  purpose: "price_accuracy",
  effort: "micro",
  stage: "pre_listing",
  value: true, // thumbs up
  variant: "button"
}
```

### Example 2: Transaction Outcome
```javascript
// User reports sale
// TransactionOutcome submits:
{
  listingId: "listing_123",
  purpose: "time_to_sell",
  effort: "short",
  stage: "sold",
  value: {
    sold: true,
    finalPrice: 125,
    suggestedPrice: 120,
    daysToSell: 3,
    ghosted: false,
    variance: 4.2 // percentage
  },
  variant: "form"
}
```

## Firebase Collections Schema

### sessions
```javascript
{
  sessionId: "sess_1234567890_abc",
  userId: "auth_user_id" | null,
  userEmail: "user@example.com" | null,
  deviceType: "mobile" | "desktop" | "tablet",
  region: "90210" | null,
  createdAt: Timestamp,
  lastActiveAt: Timestamp,
  isAnonymous: true | false
}
```

### listings_temp
```javascript
{
  listingId: "listing_1234567890_xyz",
  sessionId: "sess_1234567890_abc",
  category: "electronics",
  itemName: "iPhone 12 Pro",
  priceSuggested: 450,
  confidenceScore: 85,
  stage: "pre_listing" | "active_listing" | "sold",
  createdAt: Timestamp
}
```

### feedback_events
```javascript
{
  listingId: "listing_1234567890_xyz",
  sessionId: "sess_1234567890_abc",
  userId: "auth_user_id" | null,
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

## Analytics & Insights

### Query Recent Feedback
```javascript
import { getRecentFeedback, calculateFeedbackStats } from './feedback';

const feedbackList = await getRecentFeedback(30); // Last 30 days
const stats = calculateFeedbackStats(feedbackList);

console.log(stats);
// {
//   totalCount: 156,
//   avgWeight: 0.65,
//   priceAccuracy: 87.3%, // percentage of thumbs up
//   soldCount: 42,
//   avgDaysToSell: 4.2
// }
```

### Postgres Sync (Future Implementation)
For production-scale analytics, periodically sync Firebase data to Postgres:

```sql
-- Example Postgres schema
CREATE TABLE feedback_events (
  id SERIAL PRIMARY KEY,
  listing_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  user_id TEXT,
  purpose TEXT NOT NULL,
  stage TEXT,
  effort TEXT NOT NULL,
  value JSONB,
  weight NUMERIC,
  segment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_listing ON feedback_events(listing_id);
CREATE INDEX idx_feedback_purpose ON feedback_events(purpose);
CREATE INDEX idx_feedback_created ON feedback_events(created_at);
```

## Testing

### Test MicroFeedback
1. Analyze an item
2. See thumbs up/down buttons below price
3. Click one
4. Check Firebase Console → feedback_events collection
5. Verify entry created with correct data

### Test TransactionOutcome
1. Analyze an item
2. Click "Report Sale" button
3. Fill out modal (sold/not sold, price, days)
4. Submit
5. Check Firebase Console → feedback_events collection
6. Verify detailed outcome data stored

## Troubleshooting

### No session created
- Check browser console for errors
- Verify Firebase config in `.env`
- Check Firestore rules allow writes

### Feedback not submitting
- Check network tab for failed requests
- Verify server endpoint `/api/feedback` is running
- Check Firestore rules

### Session not linking to user after login
- Ensure `linkSessionToUser` is called in AuthContext
- Check that currentUser is passed to `initializeSession`

## Next Steps

1. **Build Analytics Dashboard**: Create [FeedbackDashboard.jsx](src/components/FeedbackDashboard.jsx) to visualize feedback data
2. **Implement Postgres Sync**: Set up Railway Postgres and sync script
3. **Add Incentive System**: Reward users for high-quality feedback
4. **Use Feedback for Pricing**: Feed transaction outcomes back into pricing algorithm

## Support

For questions or issues:
- Check Firebase Console for data
- Review browser console for errors
- Test with small dataset first
- Gradually roll out to users

---

**Created:** January 2025
**Copyright:** © 2025 Jared McClure / PrecisionPrices.Com
