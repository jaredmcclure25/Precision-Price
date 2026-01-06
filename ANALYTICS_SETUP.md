# Analytics & Activity Tracking Setup Guide

## Overview

The Precision Prices analytics system tracks user sessions, activities, and site usage using Firebase Firestore. This guide explains how to set up and use the analytics system.

## Database Schema

### Collections

#### 1. **sessions**
Tracks user sessions (both authenticated and guest users)

```javascript
{
  sessionId: string,           // Unique session identifier
  userId: string | null,       // Firebase Auth UID (null for guests)
  userEmail: string | null,    // User email (null for guests)
  isGuest: boolean,           // Whether this is a guest session
  startTime: timestamp,       // Session start time
  endTime: timestamp,         // Session end time
  duration: number,           // Session duration in milliseconds
  pageViews: array,           // Array of page view objects
  deviceInfo: {               // Device information
    type: string,             // 'mobile', 'tablet', or 'desktop'
    os: string,              // Operating system
    browser: string,         // Browser name
    screenWidth: number,
    screenHeight: number,
    language: string
  },
  lastActivity: timestamp     // Last activity timestamp
}
```

#### 2. **activities**
Logs individual user activities and events

```javascript
{
  sessionId: string,          // Associated session ID
  userId: string | null,      // Firebase Auth UID (null for guests)
  userEmail: string | null,   // User email
  isGuest: boolean,          // Whether this is a guest
  activityType: string,      // Type of activity (see below)
  timestamp: timestamp,      // When the activity occurred
  metadata: object,          // Activity-specific data
  page: string              // Current page/route
}
```

**Activity Types:**
- `session_start` - User started a session
- `session_end` - User ended a session
- `page_view` - User viewed a page
- `analysis` - User performed a pricing analysis
- `bulk_analysis` - User performed bulk pricing analysis
- `image_upload` - User uploaded images
- `feedback` - User submitted feedback
- `login` - User logged in
- `logout` - User logged out
- `signup` - User created an account

#### 3. **user_stats**
Aggregated statistics per user

```javascript
{
  userId: string,            // Firebase Auth UID
  userEmail: string,         // User email
  totalSessions: number,     // Total number of sessions
  totalAnalyses: number,     // Total pricing analyses performed
  totalImages: number,       // Total images uploaded
  firstSeen: timestamp,      // First time user visited
  lastSeen: timestamp,       // Most recent visit
  lastAnalysis: timestamp,   // Most recent analysis
  deviceTypes: array         // List of device types used
}
```

#### 4. **analytics_daily**
Daily aggregated metrics (future enhancement)

```javascript
{
  date: string,              // Date in YYYY-MM-DD format
  totalUsers: number,
  totalGuests: number,
  totalSessions: number,
  totalActivities: number,
  totalAnalyses: number,
  totalImages: number,
  avgSessionDuration: number,
  topPages: array,
  topItems: array
}
```

## Installation & Setup

### 1. Firebase Configuration

Ensure your Firebase project is properly configured in `src/firebase.js`. The analytics system uses the Firestore database initialized there.

### 2. Deploy Firestore Security Rules

The security rules in `firestore.rules` need to be deployed to your Firebase project:

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init firestore

# Deploy security rules
firebase deploy --only firestore:rules
```

### 3. Enable Required Firestore Indexes

Some queries may require composite indexes. Firebase will automatically suggest these when you run queries. You can also pre-create them:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database > Indexes
4. Add the following composite indexes:

**activities collection:**
- Fields: `timestamp` (Descending), `activityType` (Ascending)
- Query scope: Collection

**sessions collection:**
- Fields: `startTime` (Descending), `userId` (Ascending)
- Query scope: Collection

## Usage

### In Your React Components

#### 1. Wrap Your App with AnalyticsWrapper

In your `main.jsx` or `App.jsx`:

```jsx
import AnalyticsWrapper from './AnalyticsWrapper';

function App() {
  return (
    <AnalyticsWrapper>
      {/* Your app components */}
    </AnalyticsWrapper>
  );
}
```

#### 2. Use the Analytics Hook

```jsx
import { useAnalytics } from './hooks/useAnalytics';

function MyComponent() {
  const { trackEvent, trackAnalysis, trackPageView } = useAnalytics();

  const handleAnalysis = async () => {
    // Perform analysis...

    // Track the event
    trackAnalysis({
      itemName: 'iPhone 13',
      condition: 'good',
      location: 'Seattle, WA',
      imageCount: 3,
      priceRange: { low: 450, high: 550 },
      success: true
    });
  };

  return (
    <button onClick={handleAnalysis}>Analyze</button>
  );
}
```

#### 3. Track Page Views

```jsx
import { usePageTracking } from './hooks/useAnalytics';

function DashboardPage() {
  // Automatically tracks when this component mounts
  usePageTracking('dashboard', { section: 'main' });

  return <div>Dashboard content</div>;
}
```

### Available Tracking Functions

```javascript
const {
  trackPageView,      // (page, metadata)
  trackEvent,         // (eventType, metadata)
  trackAnalysis,      // (analysisData)
  trackBulkAnalysis,  // (itemCount, results)
  trackImageUpload,   // (imageCount, imageTypes)
  trackFeedback,      // (feedbackType, rating, comments)
  trackAuth,          // (authType, user)
  isGuest,           // boolean
  userId             // string | null
} = useAnalytics();
```

## Viewing Analytics

### Analytics Dashboard Component

Import and use the `AnalyticsDashboard` component:

```jsx
import AnalyticsDashboard from './components/AnalyticsDashboard';

function AdminPage() {
  return <AnalyticsDashboard />;
}
```

The dashboard shows:
- Total users and sessions
- Analysis counts
- Image upload statistics
- Average session duration
- Activity breakdown
- Top analyzed items
- Recent activity feed

### Programmatic Access

```javascript
import { getAnalyticsDashboard, getUserAnalytics } from './analytics';

// Get dashboard data for last 7 days
const dashboardData = await getAnalyticsDashboard(7);

// Get specific user's analytics
const userAnalytics = await getUserAnalytics(userId);
```

## Backend API Endpoints

The Express server provides these analytics endpoints:

### POST /api/analytics/activity
Log an activity event (optional server-side logging)

```javascript
fetch('/api/analytics/activity', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session_123',
    userId: 'user_456',
    activityType: 'analysis',
    metadata: { itemName: 'iPhone' }
  })
});
```

### POST /api/analytics/pageview
Log a page view

```javascript
fetch('/api/analytics/pageview', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session_123',
    page: '/dashboard',
    timestamp: new Date().toISOString()
  })
});
```

### GET /api/analytics/summary
Get analytics summary

```javascript
const response = await fetch('/api/analytics/summary?startDate=2025-01-01&endDate=2025-01-07');
const data = await response.json();
```

## Privacy & Data Retention

### Guest Sessions
- Guest sessions are tracked but not associated with any personal information
- Only device type, browser, and usage patterns are stored
- No personally identifiable information is collected for guests

### Registered Users
- User analytics are associated with their Firebase Auth UID
- Email addresses are stored for admin dashboard purposes only
- Users can only access their own analytics data (enforced by Firestore rules)

### Data Retention
Consider implementing a data retention policy:

```javascript
// Example: Delete sessions older than 90 days
const deleteOldSessions = async () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  const oldSessions = await getDocs(
    query(
      collection(db, 'sessions'),
      where('startTime', '<', cutoffDate)
    )
  );

  const batch = writeBatch(db);
  oldSessions.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
};
```

## Performance Considerations

### Batching
Activities are automatically batched in memory and written in groups to reduce Firestore writes and costs.

### Session Heartbeat
Sessions are updated every 30 seconds with a heartbeat to track active sessions and calculate accurate session durations.

### Indexes
Ensure composite indexes are created for frequently queried fields to maintain fast query performance.

## Monitoring & Debugging

### Console Logging
The analytics system logs important events to the console:

```
[ACTIVITY] analysis - User: user@example.com - Session: session_xyz
[PAGEVIEW] /dashboard - Session: session_xyz
```

### Firestore Console
Monitor your analytics data in the [Firebase Console](https://console.firebase.google.com/):
1. Go to Firestore Database
2. Browse the `sessions`, `activities`, and `user_stats` collections
3. Use the built-in query tool to analyze data

## Future Enhancements

Consider these additions:
- Daily aggregation Cloud Function to populate `analytics_daily` collection
- Real-time analytics dashboard with live updates
- Export functionality for analytics data
- Advanced filtering and date range selection
- Conversion funnel tracking
- A/B testing integration
- Heatmap tracking for UI interactions
- Error and performance tracking

## Troubleshooting

### "Permission denied" errors
- Ensure Firestore security rules are deployed
- Check that the user is authenticated when required
- Verify collection names match the rules

### Missing data in dashboard
- Check browser console for errors
- Verify Firestore indexes are created
- Ensure date range includes actual activity

### High Firestore costs
- Review batching configuration
- Consider increasing batch size or flush interval
- Implement data retention policies
- Use Firebase emulator for local development

## Support

For issues or questions, refer to:
- [Firebase Documentation](https://firebase.google.com/docs/firestore)
- [React Firebase Hooks](https://github.com/CSFrequency/react-firebase-hooks)
- Project-specific issues: Check the application logs
