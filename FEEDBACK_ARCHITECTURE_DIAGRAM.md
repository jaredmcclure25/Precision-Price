# Feedback System Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     PRECISION PRICES APP                          │
│                                                                   │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │   User UI   │───▶│ App.jsx      │───▶│ Pricing Analysis │   │
│  │  (Browser)  │    │ (Main App)   │    │ (Claude API)     │   │
│  └─────────────┘    └──────┬───────┘    └────────┬─────────┘   │
│                             │                     │              │
│                             │                     ▼              │
│                             │            ┌─────────────────┐    │
│                             │            │ Result Displayed│    │
│                             │            │ (Price Range)   │    │
│                             │            └────────┬────────┘    │
│                             │                     │              │
│                             ▼                     ▼              │
│                    ┌────────────────────────────────┐           │
│                    │   useFeedbackSystem Hook      │           │
│                    │                                │           │
│                    │  • createListingRecord()      │           │
│                    │  • handleFeedbackSubmit()     │           │
│                    │  • sessionData                │           │
│                    └────────┬───────────────────────┘           │
│                             │                                    │
│              ┌──────────────┴──────────────┐                   │
│              │                              │                    │
│              ▼                              ▼                    │
│     ┌─────────────────┐          ┌──────────────────┐          │
│     │ MicroFeedback   │          │TransactionOutcome│          │
│     │ Component       │          │    Component     │          │
│     │                 │          │                  │          │
│     │ 👍 👎          │          │ 💰 📅 👥       │          │
│     │ Quick feedback  │          │ Detailed data    │          │
│     └────────┬────────┘          └────────┬─────────┘          │
│              │                            │                     │
└──────────────┼────────────────────────────┼─────────────────────┘
               │                            │
               │                            │
               ▼                            ▼
        ┌──────────────────────────────────────────┐
        │       Feedback Service Layer             │
        │                                          │
        │  • prepareFeedback()                     │
        │  • calculateWeight()                     │
        │  • validateFeedback()                    │
        │  • submitFeedback()                      │
        └──────────────┬───────────────────────────┘
                       │
                       │
        ┌──────────────┼───────────────┐
        │              │               │
        ▼              ▼               ▼
┌────────────┐  ┌────────────┐  ┌──────────────┐
│ Firebase   │  │ Server API │  │ localStorage │
│ Firestore  │  │ /api/      │  │ (session ID) │
│            │  │ feedback   │  │              │
└────────────┘  └────────────┘  └──────────────┘
```

## Data Flow Diagram

### Micro Feedback Flow (Thumbs Up/Down)

```
User views price
       │
       ▼
[👍 Was this accurate? 👎]
       │
       ├──▶ User clicks thumbs up (true)
       │
       ▼
MicroFeedback.jsx
       │
       ▼
{
  listingId: "listing_123",
  purpose: "price_accuracy",
  effort: "micro",
  value: true
}
       │
       ▼
useFeedbackSystem.handleFeedbackSubmit()
       │
       ▼
feedbackOrchestrator.prepareFeedback()
       │
       ├──▶ Calculate weight: 0.3 (micro)
       ├──▶ Add sessionId, userId
       ├──▶ Infer user segment
       │
       ▼
feedbackService.submitFeedback()
       │
       ├──▶ Validate data
       ├──▶ Store in Firebase
       ├──▶ Call server endpoint
       │
       ▼
Firebase: feedback_events/doc_abc123
{
  listingId: "listing_123",
  sessionId: "sess_xyz789",
  userId: "user_456" | null,
  purpose: "price_accuracy",
  stage: "pre_listing",
  effort: "micro",
  value: true,
  weight: 0.3,
  segment: "casual_seller",
  createdAt: Timestamp
}
```

### Transaction Outcome Flow (Sale Report)

```
User clicks "Report Sale"
       │
       ▼
TransactionOutcome modal opens
       │
       ▼
User fills form:
  ☑ Item sold
  💰 Final price: $125
  📅 Days to sell: 3
  ☐ Ghosting incidents
       │
       ▼
Click "Submit"
       │
       ▼
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
    variance: 4.2
  }
}
       │
       ▼
feedbackOrchestrator.prepareFeedback()
       │
       ├──▶ Calculate weight: 0.7 + 0.5 = 1.2 (short + sold bonus)
       ├──▶ Add sessionId, userId
       ├──▶ Calculate variance: (125-120)/120 = 4.2%
       │
       ▼
Firebase: feedback_events/doc_def456
{
  listingId: "listing_123",
  sessionId: "sess_xyz789",
  userId: "user_456",
  purpose: "time_to_sell",
  stage: "sold",
  effort: "short",
  value: {
    sold: true,
    finalPrice: 125,
    suggestedPrice: 120,
    daysToSell: 3,
    ghosted: false,
    variance: 4.2
  },
  weight: 1.2,
  segment: "casual_seller",
  createdAt: Timestamp
}
```

## Session Management Flow

### Anonymous User (Guest)

```
1. User lands on site (no login)
        │
        ▼
2. sessionManager.initializeSession()
        │
        ├──▶ Check localStorage for existing session
        ├──▶ None found
        │
        ▼
3. Generate session ID: "sess_1704123456_abc"
        │
        ▼
4. Create session in Firebase
{
  sessionId: "sess_1704123456_abc",
  userId: null,
  deviceType: "mobile",
  region: null,
  isAnonymous: true,
  createdAt: Timestamp
}
        │
        ▼
5. Store session ID in localStorage
        │
        ▼
6. User analyzes items (tracked by session)
        │
        ▼
7. Feedback includes sessionId
```

### User Signs Up (Session Upgrade)

```
1. Anonymous session exists: "sess_1704123456_abc"
        │
        ▼
2. User signs up / logs in
        │
        ▼
3. Firebase Auth creates user: "user_789"
        │
        ▼
4. sessionManager.linkSessionToUser()
        │
        ▼
5. Update session in Firebase
{
  sessionId: "sess_1704123456_abc",
  userId: "user_789",              ← Added
  userEmail: "user@example.com",   ← Added
  deviceType: "mobile",
  region: "90210",
  isAnonymous: false,              ← Changed
  linkedAt: Timestamp,             ← Added
  createdAt: Timestamp
}
        │
        ▼
6. All future feedback includes userId
        │
        ▼
7. Past anonymous feedback still linked via sessionId
```

## Firebase Collections Structure

```
Firebase Firestore
│
├── sessions/
│   ├── sess_1704123456_abc
│   │   ├── sessionId: "sess_1704123456_abc"
│   │   ├── userId: "user_789" | null
│   │   ├── deviceType: "mobile"
│   │   ├── isAnonymous: false
│   │   └── createdAt: Timestamp
│   │
│   └── sess_1704123457_def
│       └── ...
│
├── listings_temp/
│   ├── listing_1704123456_xyz
│   │   ├── listingId: "listing_1704123456_xyz"
│   │   ├── sessionId: "sess_1704123456_abc"
│   │   ├── category: "electronics"
│   │   ├── priceSuggested: 450
│   │   ├── stage: "pre_listing"
│   │   └── createdAt: Timestamp
│   │
│   └── listing_1704123458_pqr
│       └── ...
│
└── feedback_events/
    ├── auto_generated_id_1
    │   ├── listingId: "listing_1704123456_xyz"
    │   ├── sessionId: "sess_1704123456_abc"
    │   ├── userId: "user_789"
    │   ├── purpose: "price_accuracy"
    │   ├── stage: "pre_listing"
    │   ├── effort: "micro"
    │   ├── value: true
    │   ├── weight: 0.3
    │   └── createdAt: Timestamp
    │
    └── auto_generated_id_2
        ├── listingId: "listing_1704123456_xyz"
        ├── sessionId: "sess_1704123456_abc"
        ├── userId: "user_789"
        ├── purpose: "time_to_sell"
        ├── stage: "sold"
        ├── effort: "short"
        ├── value: { sold: true, finalPrice: 125, ... }
        ├── weight: 1.2
        └── createdAt: Timestamp
```

## Weight Calculation System

```
┌──────────────────────────────────────────┐
│         FEEDBACK WEIGHTING               │
└──────────────────────────────────────────┘

Effort Level          Base Weight
─────────────────────────────────
Micro (thumbs)        0.3
Short (form)          0.7
Long (detailed)       1.0

Stage Bonus
─────────────────────────────────
pre_listing           +0.0
active_listing        +0.0
sold                  +0.5  ★
not_sold              +0.0

Final Weight = MIN(base + bonus, 1.5)

Examples:
─────────────────────────────────
Micro + pre_listing   = 0.3
Micro + sold          = 0.8
Short + pre_listing   = 0.7
Short + sold          = 1.2  ★
Long + sold           = 1.5  ★ (max)
```

## Postgres Sync Architecture (Optional)

```
┌─────────────────────────────────────────────────┐
│              Firebase Firestore                  │
│                                                  │
│  feedback_events (Real-time collection)         │
│  ↓ ↓ ↓                                          │
└──┼─┼─┼────────────────────────────────────────────┘
   │ │ │
   │ │ │  Periodic Sync (Cron job every 6 hours)
   │ │ │
   ▼ ▼ ▼
┌─────────────────────────────────────────────────┐
│         PostgreSQL on Railway                    │
│                                                  │
│  Tables:                                         │
│  • feedback (long-term storage)                 │
│  • transactions (aggregated sales)              │
│  • listings (canonical items)                   │
│                                                  │
│  Views:                                          │
│  • feedback_summary_by_purpose                  │
│  • transaction_metrics                          │
│  • price_accuracy_analysis                      │
│                                                  │
│  Functions:                                      │
│  • get_weighted_avg_price()                     │
│  • calculate_category_stats()                   │
└─────────────────────────────────────────────────┘
   │
   │  Used for
   ▼
┌─────────────────────────────────────────────────┐
│           Analytics & ML Training                │
│                                                  │
│  • Price accuracy by category                   │
│  • Time-to-sell predictions                     │
│  • Ghosting rate analysis                       │
│  • Location-based pricing multipliers           │
│  • Category-specific insights                   │
└─────────────────────────────────────────────────┘
```

## Component Integration Map

```
App.jsx (Main Application)
│
├── Import hooks
│   └── useFeedbackSystem()
│
├── State management
│   ├── sessionData
│   ├── currentListingId
│   └── showTransactionModal
│
├── Event handlers
│   ├── handlePricing() → createListingRecord()
│   ├── onFeedbackSubmit() → handleFeedbackSubmit()
│   └── onReportSale() → setShowTransactionModal(true)
│
└── Render components
    │
    ├── PricingForm
    │   └── (user input)
    │
    ├── Results
    │   ├── BullseyePriceTarget
    │   ├── MicroFeedback  ← NEW
    │   │   └── thumbs up/down
    │   └── "Report Sale" button  ← NEW
    │
    ├── TransactionOutcome Modal  ← NEW
    │   └── Sale tracking form
    │
    └── FeedbackDashboard  ← NEW
        └── Analytics view
```

## API Endpoint Architecture

```
Server (server.js)
│
├── POST /api/feedback
│   ├── Validate required fields
│   ├── Log to console
│   ├── (Optional) Store in Postgres
│   └── Return success
│
├── GET /api/feedback/analytics
│   ├── Query feedback data
│   ├── Aggregate statistics
│   └── Return analytics
│
└── Existing endpoints
    ├── POST /api/analyze
    └── POST /api/analytics/activity
```

## Security & Privacy Flow

```
┌────────────────────────────────────────┐
│          Security Layers               │
└────────────────────────────────────────┘

1. Firestore Rules
   ├── sessions: read/write for all (anonymous ok)
   ├── listings_temp: read/write for all
   └── feedback_events: write for all, read for authenticated

2. Data Anonymization
   ├── Anonymous sessions: no userId
   ├── No PII in feedback (unless user adds)
   └── Session IDs are random, not traceable

3. Validation
   ├── feedbackOrchestrator.validateFeedback()
   ├── Check required fields
   └── Sanitize inputs

4. Server-side Logging
   ├── Log feedback submissions
   ├── Monitor for spam/abuse
   └── Rate limiting (future)
```

---

**Visual Legend:**
- `┌─┐` = System boundaries
- `│ ▼ │` = Data flow direction
- `├──▶` = Process branches
- `★` = Important/high-value
- `☑` = User action
- `💰📅👥` = Data types

**Next:** Review [FEEDBACK_INTEGRATION_GUIDE.md](FEEDBACK_INTEGRATION_GUIDE.md) for implementation steps.
