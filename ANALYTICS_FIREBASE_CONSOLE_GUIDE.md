# Viewing Analytics in Firebase Console (Backend)

## ✅ Security Rules Updated

The Firestore rules have been updated to allow admin users to view ALL analytics data. Admin emails configured:
- `contact@precisionprices.com`
- `ericalmlowe@gmail.com`

**To add more admins:** Edit `firestore.rules` line 50-53 and redeploy.

---

## 🔥 Firebase Console - Direct Database Access

### Access Your Analytics Data:

1. **Go to Firebase Console**
   ```
   https://console.firebase.google.com/project/precisionprices/firestore
   ```

2. **Navigate to Firestore Database**
   - Click "Firestore Database" in left sidebar
   - You'll see all your collections

3. **View Analytics Collections:**

   **📊 sessions** - User session data
   ```
   Click: sessions collection
   See: All user sessions with:
   - sessionId, userId, userEmail
   - startTime, endTime, duration
   - deviceInfo (browser, OS, screen size)
   - pageViews array
   - isGuest (true/false)
   ```

   **📈 activities** - Individual events
   ```
   Click: activities collection
   See: All user activities:
   - activityType (analysis, page_view, image_upload, etc.)
   - timestamp
   - userId, userEmail, isGuest
   - metadata (event-specific data)
   - page (current route)
   ```

   **👤 user_stats** - Aggregated per-user metrics
   ```
   Click: user_stats collection
   See: Per-user statistics:
   - userId, userEmail
   - totalSessions, totalAnalyses, totalImages
   - firstSeen, lastSeen
   - deviceTypes array
   ```

---

## 📊 Firebase Console Query Examples

### Filter Sessions by Date:
```
Collection: sessions
Filter: startTime >= [your date]
Order by: startTime descending
```

### Find All Guest Sessions:
```
Collection: sessions
Filter: isGuest == true
```

### View Recent Activities:
```
Collection: activities
Order by: timestamp descending
Limit: 100
```

### Find Analyses Only:
```
Collection: activities
Filter: activityType == "analysis"
Order by: timestamp descending
```

### See Image Uploads:
```
Collection: activities
Filter: activityType == "image_upload"
```

---

## 📈 Google Analytics (Alternative - Recommended for Production)

For production-grade analytics, integrate Google Analytics 4:

### Setup Google Analytics 4:

1. **Create GA4 Property**
   ```
   https://analytics.google.com/
   Create Account → Create Property → GA4
   ```

2. **Get Measurement ID**
   ```
   Property → Data Streams → Web
   Copy Measurement ID: G-XXXXXXXXXX
   ```

3. **Add to Your App** (in `index.html`):
   ```html
   <!-- Google tag (gtag.js) -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-XXXXXXXXXX');
   </script>
   ```

4. **Track Custom Events**:
   ```javascript
   // Track analysis
   gtag('event', 'pricing_analysis', {
     item_name: itemName,
     condition: condition
   });

   // Track image upload
   gtag('event', 'image_upload', {
     image_count: images.length
   });
   ```

---

## 📊 Vercel Analytics (For Frontend Performance)

Vercel provides built-in analytics for your deployed app:

### Enable Vercel Analytics:

1. **Go to Vercel Dashboard**
   ```
   https://vercel.com/dashboard
   ```

2. **Select Your Project**
   - Click on `precision-prices`

3. **Go to Analytics Tab**
   - Click "Analytics" in top navigation
   - Enable Analytics (may require Pro plan)

4. **View Metrics:**
   - Page views
   - Unique visitors
   - Top pages
   - Referrers
   - Countries
   - Devices
   - Performance metrics (Core Web Vitals)

### Vercel Analytics Features:
- ✅ Real-time visitor tracking
- ✅ Page performance metrics
- ✅ Geographic data
- ✅ Device/browser breakdown
- ✅ Traffic sources
- ✅ No code changes needed

---

## 🔍 Export Analytics Data from Firestore

### Option 1: Firebase Console Export

1. Go to Firestore Database
2. Click "..." menu on collection
3. Select "Export collection"
4. Choose format (JSON, CSV via Cloud Storage)

### Option 2: Query and Download via Script

Create `export-analytics.js`:

```javascript
const admin = require('firebase-admin');
const fs = require('fs');

admin.initializeApp({
  credential: admin.credential.cert('./serviceAccountKey.json')
});

const db = admin.firestore();

async function exportAnalytics() {
  const sessions = await db.collection('sessions').get();
  const activities = await db.collection('activities').get();

  const data = {
    sessions: sessions.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    activities: activities.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  };

  fs.writeFileSync('analytics-export.json', JSON.stringify(data, null, 2));
  console.log('Analytics exported to analytics-export.json');
}

exportAnalytics();
```

Run:
```bash
node export-analytics.js
```

---

## 📊 Create Custom Analytics Dashboard

### Option 1: Firebase Extensions - Export to BigQuery

1. **Install BigQuery Extension**
   ```
   Firebase Console → Extensions → Export Collections to BigQuery
   ```

2. **Configure Export**
   - Collections: sessions, activities, user_stats
   - Schedule: Real-time or daily

3. **Query in BigQuery**
   ```sql
   SELECT
     DATE(timestamp) as date,
     COUNT(*) as total_activities,
     COUNT(DISTINCT userId) as unique_users
   FROM `precisionprices.activities`
   GROUP BY date
   ORDER BY date DESC
   ```

4. **Visualize with Data Studio**
   - Connect BigQuery to Google Data Studio
   - Create custom dashboards
   - Share with team

### Option 2: Custom Admin Panel

Build a separate admin dashboard:

```javascript
// admin-dashboard/src/Analytics.jsx
import { collection, query, getDocs } from 'firebase/firestore';

export default function AdminAnalytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    loadAllAnalytics();
  }, []);

  async function loadAllAnalytics() {
    const sessions = await getDocs(collection(db, 'sessions'));
    const activities = await getDocs(collection(db, 'activities'));

    // Process and display
    setData({
      totalSessions: sessions.size,
      totalActivities: activities.size,
      // ... more metrics
    });
  }

  return (
    <div>
      <h1>Admin Analytics</h1>
      {/* Display charts and metrics */}
    </div>
  );
}
```

---

## 🎯 Recommended Approach for Production

### Use Multiple Tools:

1. **Firebase Firestore** (Current)
   - ✅ Custom event tracking
   - ✅ Detailed user sessions
   - ✅ Full control over data
   - Use for: Custom business metrics

2. **Google Analytics 4**
   - ✅ Industry standard
   - ✅ Advanced reports
   - ✅ Conversion tracking
   - Use for: Overall site analytics

3. **Vercel Analytics**
   - ✅ Performance monitoring
   - ✅ Real-time visitors
   - ✅ Zero config
   - Use for: Frontend performance

4. **Firestore → BigQuery → Data Studio**
   - ✅ Powerful queries
   - ✅ Custom visualizations
   - ✅ Team collaboration
   - Use for: Deep analysis & reporting

---

## 🚫 Remove Frontend Analytics Dashboard (Optional)

If you only want backend analytics access, you can remove the frontend dashboard:

1. Remove from navigation in `App.jsx`:
   ```javascript
   // Remove this line:
   { id: 'analytics', icon: Users, label: 'Site Analytics' }
   ```

2. Remove the view rendering:
   ```javascript
   // Remove this line:
   {view === 'analytics' && <AnalyticsDashboard />}
   ```

3. Keep the tracking functions active (still logs to Firestore)

---

## 📝 Quick Access Links

| Tool | Link | Purpose |
|------|------|---------|
| Firebase Console | https://console.firebase.google.com/project/precisionprices/firestore | View raw data |
| Google Analytics | https://analytics.google.com/ | Site analytics |
| Vercel Dashboard | https://vercel.com/dashboard | Deployment analytics |
| BigQuery | https://console.cloud.google.com/bigquery | Advanced queries |

---

## ✅ Summary

**Current Setup:**
- ✅ Firestore rules updated with admin access
- ✅ You can view ALL data in Firebase Console
- ✅ Data automatically logged from your app
- ✅ Admin emails: contact@precisionprices.com, ericalmlowe@gmail.com

**To View Analytics:**
1. Go to https://console.firebase.google.com/project/precisionprices/firestore
2. Click on `sessions`, `activities`, or `user_stats` collections
3. Browse, filter, and export data as needed

**Frontend Dashboard:**
- Now accessible to admin users only
- Non-admin users will see permission denied
- Can be removed if you only want backend access

Happy analyzing! 📊
