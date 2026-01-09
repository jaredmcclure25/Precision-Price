# Feedback System - Quick Reference Card

## 🚀 Quick Start Commands

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Start dev server
npm run dev:all

# Test feedback submission
# (Use Firebase Console → Firestore Database)
```

## 📦 Files Overview

| Category | Files | Location |
|----------|-------|----------|
| **Core** | feedbackEnums.js, feedbackOrchestrator.js, sessionManager.js, feedbackService.js | `src/feedback/` |
| **Components** | MicroFeedback.jsx, TransactionOutcome.jsx, FeedbackDashboard.jsx | `src/components/` |
| **Hook** | useFeedbackSystem.js | `src/hooks/` |
| **Config** | firestore.rules | Root |
| **Docs** | FEEDBACK_*.md files | Root |

## 🔑 Key Concepts

### Feedback Types
| Type | Purpose | Effort | Base Weight |
|------|---------|--------|-------------|
| **Micro** | Price accuracy thumbs up/down | Micro | 0.3 |
| **Short** | Transaction outcome (sold/not sold, price, days) | Short | 0.7 |
| **Long** | Detailed surveys, interviews | Long | 1.0 |

### Weight Calculation
```
Final Weight = MIN(base_weight + stage_bonus, 1.5)

Stage Bonus:
- pre_listing: +0.0
- active_listing: +0.0
- sold: +0.5  ← Most valuable!
- not_sold: +0.0
```

### Data Collections
```
Firebase Firestore:
├── sessions          (user sessions - anonymous + authenticated)
├── listings_temp     (temporary listing records)
└── feedback_events   (all feedback submissions)
```

## 🛠️ Integration Checklist

- [ ] Deploy Firestore rules
- [ ] Import `useFeedbackSystem` hook in App.jsx
- [ ] Add hook to component: `const { createListingRecord, handleFeedbackSubmit, currentListingId } = useFeedbackSystem();`
- [ ] Create listing after price analysis: `await createListingRecord(parsedResult)`
- [ ] Add MicroFeedback component to results view
- [ ] Add TransactionOutcome modal with "Report Sale" button
- [ ] Test feedback submission in Firebase Console
- [ ] Verify session tracking in localStorage
- [ ] Check server logs for feedback events

## 📊 Common Queries

### Get Recent Feedback (JavaScript)
```javascript
import { getRecentFeedback, calculateFeedbackStats } from './feedback';

const feedback = await getRecentFeedback(30); // Last 30 days
const stats = calculateFeedbackStats(feedback);
console.log(stats);
```

### Query Firestore (Firebase Console)
```
Collection: feedback_events
Filters:
  - purpose == "price_accuracy"
  - createdAt >= [last 7 days]
Order by: createdAt desc
```

### Check Session (Browser Console)
```javascript
localStorage.getItem('pp_session_id')
// Returns: "sess_1704123456_abc"
```

## 🎯 Component Usage

### MicroFeedback
```jsx
import MicroFeedback from './components/MicroFeedback';

<MicroFeedback
  listingId={currentListingId}
  onFeedbackSubmit={async (data) => {
    await handleFeedbackSubmit(data, userProfile);
  }}
/>
```

### TransactionOutcome
```jsx
import TransactionOutcome from './components/TransactionOutcome';

{showModal && (
  <TransactionOutcome
    listingId={currentListingId}
    suggestedPrice={result.suggestedPriceRange.optimal}
    onSubmit={async (data) => {
      await handleFeedbackSubmit(data, userProfile);
    }}
    onClose={() => setShowModal(false)}
  />
)}
```

### FeedbackDashboard
```jsx
import FeedbackDashboard from './components/FeedbackDashboard';

{view === 'feedback-analytics' && <FeedbackDashboard />}
```

## 🔍 Debugging

### Check Session Created
```javascript
// Browser console
console.log(localStorage.getItem('pp_session_id'));

// Firebase Console → sessions collection
// Look for session with your device type
```

### Check Feedback Submitted
```javascript
// Firebase Console → feedback_events collection
// Filter by recent createdAt
// Verify listingId, sessionId, weight are present
```

### Check Server Logs
```bash
# Terminal where server is running
# Look for: [FEEDBACK] purpose - Listing: listing_id
```

### Common Issues
| Issue | Check | Fix |
|-------|-------|-----|
| No session | localStorage | Clear cache, refresh |
| Feedback not saving | Firestore rules | Deploy updated rules |
| Weight = 0 | feedbackData | Pass `effort` and `stage` |
| Modal not showing | Import | Check TransactionOutcome import |

## 📈 Success Metrics

Track these in Firebase Analytics or FeedbackDashboard:

| Metric | Target | Description |
|--------|--------|-------------|
| **Feedback Rate** | 20%+ | % of users who submit any feedback |
| **Price Accuracy** | 80%+ | % of thumbs up on price suggestions |
| **Transaction Reports** | 10%+ | % of users who report sale outcomes |
| **Avg Weight** | 0.5+ | Average quality of feedback |
| **Data Coverage** | 50+ items | Items with feedback per category |

## 🎨 UI Text Suggestions

### MicroFeedback
- Question: "Was this price accurate?"
- Success: "Thanks for your feedback! This helps us improve pricing for everyone."

### TransactionOutcome
- Header: "How did it go?"
- Question 1: "Did your item sell?"
- Question 2: "Final sale price"
- Question 3: "How many days to sell?"
- Checkbox: "I dealt with flaky buyers (ghosting/no-shows)"

### Report Sale Button
- Text: "Report Sale"
- Icon: CheckCircle
- Color: Purple (to differentiate from "New Analysis")

## 🔐 Security Notes

- ✅ Sessions are anonymous by default (no PII)
- ✅ Firestore rules allow write for all (guests can submit)
- ✅ Read access limited to authenticated users
- ✅ No PII collected unless user adds it
- ✅ Session IDs are random, not traceable

## 📞 Quick Links

- **Integration Guide:** [FEEDBACK_INTEGRATION_GUIDE.md](FEEDBACK_INTEGRATION_GUIDE.md)
- **Full Documentation:** [FEEDBACK_SYSTEM_README.md](FEEDBACK_SYSTEM_README.md)
- **Architecture Diagram:** [FEEDBACK_ARCHITECTURE_DIAGRAM.md](FEEDBACK_ARCHITECTURE_DIAGRAM.md)
- **Summary:** [FEEDBACK_SYSTEM_SUMMARY.md](FEEDBACK_SYSTEM_SUMMARY.md)
- **Firebase Console:** https://console.firebase.google.com
- **Firestore Rules:** [firestore.rules](firestore.rules)

## 💡 Pro Tips

1. **Start Small:** Test with your own items first
2. **Monitor Weight:** High weight = valuable feedback
3. **Incentivize:** Reward users for detailed feedback
4. **Analyze Trends:** Use FeedbackDashboard weekly
5. **Iterate UX:** A/B test feedback prompts
6. **Sync to Postgres:** When you hit 1000+ feedback items
7. **Use for ML:** Train pricing model on sold items
8. **Privacy First:** Never require PII for feedback

## 🆘 Emergency Commands

```bash
# Revert Firestore rules (if issues)
git checkout HEAD -- firestore.rules
firebase deploy --only firestore:rules

# Clear all sessions (localStorage)
# Browser console:
localStorage.removeItem('pp_session_id')

# Check server status
curl http://localhost:3001/api/health

# Test feedback endpoint
curl -X POST http://localhost:3001/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"listingId":"test","purpose":"test","effort":"micro"}'
```

---

**Last Updated:** January 2025
**Version:** 1.0.0
**Print This:** Keep handy for quick reference during integration
