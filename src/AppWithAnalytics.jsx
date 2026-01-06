/**
 * Analytics Integration Helper for App.jsx
 *
 * Add these imports and hooks to your App.jsx component
 */

// 1. ADD THIS IMPORT at the top of App.jsx:
import { useAnalytics, usePageTracking } from './hooks/useAnalytics';
import AnalyticsDashboard from './components/AnalyticsDashboard';

// 2. ADD THIS HOOK inside the MarketplacePricer component (after existing hooks):
export default function MarketplacePricer() {
  const { saveItemToHistory, logout, currentUser, isGuestMode } = useAuth();
  const { logoutSite } = useSiteAuth();

  // ADD ANALYTICS HOOK HERE:
  const { trackPageView, trackEvent, trackAnalysis, trackImageUpload, trackFeedback, trackAuth } = useAnalytics();

  // Existing state variables...
  const [view, setView] = useState('pricing');

  // Track page views whenever view changes
  usePageTracking(view);

  // Rest of your component...
}

// 3. MODIFY handleImageUpload to track uploads:
// Find the handleImageUpload function and add tracking at the end:
const handleImageUpload = async (e) => {
  const files = Array.from(e.target.files);
  // ... existing code ...

  // ADD THIS at the end after images are processed:
  if (validFiles.length > 0) {
    trackImageUpload(validFiles.length, validFiles.map(f => f.type));
  }
};

// 4. TRACK ANALYSIS - Add to your analysis function:
// Find where you make the API call to /api/analyze and add this after success:
const analyzeItem = async () => {
  setLoading(true);
  const startTime = Date.now();

  try {
    // ... existing API call code ...
    const response = await fetch(apiUrl, { /* ... */ });
    const data = await response.json();

    // ADD THIS after successful response:
    trackAnalysis({
      itemName: itemName || 'Unnamed item',
      condition,
      location,
      imageCount: images.length,
      mode: analysisMode,
      priceRange: data.suggestedPriceRange,
      processingTime: Date.now() - startTime,
      success: true
    });

    setResult(data);
  } catch (error) {
    // ADD THIS in error handler:
    trackAnalysis({
      itemName: itemName || 'Unnamed item',
      condition,
      location,
      imageCount: images.length,
      mode: analysisMode,
      success: false,
      errorMessage: error.message
    });

    setError(error.message);
  } finally {
    setLoading(false);
  }
};

// 5. TRACK FEEDBACK - Add to feedback submission:
// Find submitFeedback or similar function and add:
const submitFeedback = async (wasSold, wasFair, comments) => {
  // ... existing code ...

  // ADD THIS:
  trackFeedback('analysis_feedback', wasFair ? 5 : 3, comments);
};

// 6. TRACK NAVIGATION - Modify setView calls:
// Find where you change views and wrap with tracking:
const handleViewChange = (newView) => {
  trackEvent('navigation', { from: view, to: newView });
  setView(newView);
};

// 7. ADD ANALYTICS VIEW to your view rendering:
// Find the section where views are rendered (around line 1013) and add:
{view === 'analytics' && <AnalyticsDashboard />}

// 8. ADD ANALYTICS TO NAVIGATION:
// Find your navigation menu and add this button:
<button
  onClick={() => handleViewChange('analytics')}
  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
    view === 'analytics' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
  }`}
>
  <BarChart3 className="w-5 h-5" />
  Analytics
</button>
