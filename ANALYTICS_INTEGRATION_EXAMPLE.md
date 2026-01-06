# Analytics Integration Example

## Quick Start Integration

Here's how to integrate the analytics system into your existing App.jsx:

### Step 1: Wrap Your App

In `src/main.jsx`, wrap your app with the AnalyticsWrapper:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './AuthContext';
import { PasswordProtectionProvider } from './PasswordProtection';
import AnalyticsWrapper from './AnalyticsWrapper';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PasswordProtectionProvider>
      <AuthProvider>
        <AnalyticsWrapper>
          <App />
        </AnalyticsWrapper>
      </AuthProvider>
    </PasswordProtectionProvider>
  </React.StrictMode>
);
```

### Step 2: Track Events in Your Components

In `src/App.jsx`, add analytics tracking to key user actions:

```jsx
import { useAnalytics, usePageTracking } from './hooks/useAnalytics';

export default function MarketplacePricer() {
  const { trackEvent, trackAnalysis, trackImageUpload } = useAnalytics();

  // Track the current view/page
  usePageTracking(view);

  // Existing code...
  const [view, setView] = useState('pricing');
  const [images, setImages] = useState([]);
  const [result, setResult] = useState(null);

  // Track when user performs analysis
  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      // Your existing analysis code...
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [/* your messages */]
        })
      });

      const data = await response.json();
      setResult(data);

      // Track successful analysis
      trackAnalysis({
        itemName,
        condition,
        location,
        imageCount: images.length,
        mode: analysisMode,
        success: true
      });

    } catch (error) {
      // Track failed analysis
      trackAnalysis({
        itemName,
        condition,
        location,
        imageCount: images.length,
        mode: analysisMode,
        success: false
      });
    } finally {
      setLoading(false);
    }
  };

  // Track when user uploads images
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    // Your existing image upload code...
    setImages(prevImages => [...prevImages, ...files]);

    // Track image upload
    const imageTypes = files.map(f => f.type);
    trackImageUpload(files.length, imageTypes);
  };

  // Track navigation events
  const handleViewChange = (newView) => {
    setView(newView);
    trackEvent('navigation', { from: view, to: newView });
  };

  // Track feedback submission
  const handleFeedbackSubmit = (rating, comments) => {
    // Your existing feedback code...

    trackEvent('feedback', {
      rating,
      hasComments: !!comments,
      itemName: result?.itemName
    });
  };

  return (
    <div>
      {/* Your existing JSX */}
    </div>
  );
}
```

### Step 3: Add Analytics Dashboard to Navigation

Add the analytics dashboard as a new view option:

```jsx
import AnalyticsDashboard from './components/AnalyticsDashboard';

export default function MarketplacePricer() {
  const [view, setView] = useState('pricing');

  const renderView = () => {
    switch (view) {
      case 'pricing':
        return <PricingView />;
      case 'dashboard':
        return <UserDashboard />;
      case 'analytics':
        return <AnalyticsDashboard />;
      // ... other cases
      default:
        return <PricingView />;
    }
  };

  return (
    <div>
      <nav>
        <button onClick={() => setView('pricing')}>Home</button>
        <button onClick={() => setView('dashboard')}>Dashboard</button>
        <button onClick={() => setView('analytics')}>Analytics</button>
      </nav>
      {renderView()}
    </div>
  );
}
```

## Key Integration Points

### 1. Track All Analyses
Every time a user submits an item for pricing analysis:

```javascript
trackAnalysis({
  itemName: 'iPhone 13',
  condition: 'good',
  location: 'Seattle, WA',
  imageCount: 3,
  mode: 'single', // or 'bulk'
  priceRange: { low: 450, high: 550 },
  success: true
});
```

### 2. Track Bulk Operations
When processing multiple items:

```javascript
const results = await processBulkAnalysis(items);
trackBulkAnalysis(items.length, results);
```

### 3. Track Image Uploads
When users upload images:

```javascript
trackImageUpload(imageFiles.length, imageFiles.map(f => f.type));
```

### 4. Track User Actions
For any significant user interaction:

```javascript
// Navigation
trackEvent('navigation', { page: 'dashboard' });

// Export
trackEvent('export', { format: 'csv', itemCount: 10 });

// Settings change
trackEvent('settings_change', { setting: 'theme', value: 'dark' });

// Feature usage
trackEvent('feature_used', { feature: 'shipping_calculator' });
```

### 5. Track Authentication
This is handled automatically by AnalyticsWrapper, but you can also manually track:

```javascript
const { trackAuth } = useAnalytics();

// On login
trackAuth('login', user);

// On logout
trackAuth('logout', user);

// On signup
trackAuth('signup', user);
```

## Example: Complete Analysis Flow with Analytics

```javascript
const handleFullAnalysis = async () => {
  setLoading(true);
  const startTime = Date.now();

  try {
    // 1. Track analysis start
    trackEvent('analysis_start', { itemName, imageCount: images.length });

    // 2. Upload images to server
    const uploadedImages = await uploadImages(images);
    trackImageUpload(images.length, images.map(img => img.type));

    // 3. Perform analysis
    const result = await performAnalysis({
      itemName,
      condition,
      location,
      images: uploadedImages
    });

    // 4. Track successful analysis
    const processingTime = Date.now() - startTime;
    trackAnalysis({
      itemName,
      condition,
      location,
      imageCount: images.length,
      mode: 'single',
      priceRange: {
        low: result.priceRange.low,
        high: result.priceRange.high
      },
      processingTime,
      success: true
    });

    setResult(result);

  } catch (error) {
    // Track failed analysis
    trackAnalysis({
      itemName,
      condition,
      location,
      imageCount: images.length,
      mode: 'single',
      success: false,
      errorMessage: error.message
    });

    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

## Viewing Your Analytics

Once integrated, you can view analytics in multiple ways:

### 1. In-App Dashboard
Navigate to the analytics view in your app to see:
- Total users and sessions
- Analysis statistics
- Top analyzed items
- Recent activity
- Session metrics

### 2. Firebase Console
Go to [Firebase Console](https://console.firebase.google.com/) > Firestore Database to see raw data in:
- `sessions` collection
- `activities` collection
- `user_stats` collection

### 3. Export Data
Query and export data programmatically:

```javascript
import { getAnalyticsDashboard } from './analytics';

const exportAnalytics = async () => {
  const data = await getAnalyticsDashboard(30); // Last 30 days
  const json = JSON.stringify(data, null, 2);

  // Download as JSON
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'analytics.json';
  link.click();
};
```

## Testing

To test the analytics system:

1. Start your development server
2. Open browser DevTools Console
3. Perform various actions (analyze items, upload images, navigate)
4. Watch for console logs: `[ACTIVITY]`, `[PAGEVIEW]`
5. Check Firebase Console > Firestore to see data being written
6. Navigate to the Analytics Dashboard to see aggregated stats

## Next Steps

1. Deploy Firestore security rules
2. Create composite indexes as needed
3. Integrate tracking into all major user actions
4. Set up data retention policies
5. Monitor Firestore usage and costs
6. Consider adding Cloud Functions for daily aggregation
