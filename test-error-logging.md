# How to Verify Backend Error Logging

## Method 1: Trigger a Real Error (Easiest)

1. **Go to your site**: https://www.precisionprices.com
2. **Open Browser Console**: Press F12 (or Cmd+Option+I on Mac)
3. **Try to analyze something that will fail**:
   - Upload a random image (not an item)
   - Leave item name blank
   - Click "Analyze Pricing"
4. **Watch the console for**:
   ```
   🐛 Attempting to log error to Firebase bugReports...
   ✅ Error automatically logged to Firebase with ID: [some-id]
   ```
5. **Check Firebase Console**:
   - Go to https://console.firebase.google.com/project/precisionprices/firestore
   - Click "bugReports" collection
   - You should see a new document with the error details

## Method 2: Check Backend Health Endpoint

If your Railway backend is deployed:

```bash
# Test health endpoint
curl https://your-railway-url.railway.app/api/health

# Should return:
{"status":"ok","message":"Precision Prices backend is running"}
```

## Method 3: Manual Test from Console

1. Go to https://www.precisionprices.com
2. Open browser console (F12)
3. Paste this code to manually trigger error logging:

```javascript
// This simulates what happens when an error occurs
const testError = async () => {
  const { collection, addDoc } = await import('firebase/firestore');
  const { db } = await import('./firebase');
  
  const testBugReport = {
    description: 'Manual test error',
    error: 'This is a test error to verify logging works',
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    resolved: false
  };
  
  console.log('🐛 Testing error log to Firebase...');
  try {
    const docRef = await addDoc(collection(db, 'bugReports'), testBugReport);
    console.log('✅ Test error logged with ID:', docRef.id);
    console.log('Check Firebase Console: https://console.firebase.google.com/project/precisionprices/firestore');
  } catch (e) {
    console.error('❌ Failed to log test error:', e);
  }
};

testError();
```

## Method 4: Check Firebase Directly

1. Go to Firebase Console: https://console.firebase.google.com/project/precisionprices/firestore
2. Look for "bugReports" collection
3. Click on it to see all error logs
4. Each document should have:
   - description
   - error (the actual error message)
   - errorStack
   - timestamp
   - userAgent
   - itemContext (what the user was trying to price)

## What to Look For:

**In Browser Console:**
```
🐛 Attempting to log error to Firebase bugReports...
✅ Error automatically logged to Firebase with ID: abc123xyz
```

**In Firebase:**
Document structure like:
```json
{
  "description": "Automatic error report from analyzePricing function",
  "error": "Could not parse pricing data",
  "originalError": "string did not match expected pattern",
  "parseAttempt": "{\"itemIdentification\"...",
  "errorStack": "Error: Could not parse...",
  "timestamp": "2025-01-03T...",
  "userId": "guest",
  "itemContext": {
    "itemName": "iPhone 13",
    "location": "New York, NY",
    "hasImages": true
  }
}
```

## Troubleshooting:

**If you see:**
```
❌ Failed to auto-log error to Firebase: [permission-denied]
```

**Solution:**
- Firestore rules might not be deployed
- Run: `firebase deploy --only firestore:rules`

**If you see:**
```
📦 Falling back to localStorage...
✅ Bug report saved to localStorage
```

**This means:**
- Firebase write failed
- Error saved locally instead
- Check Firestore rules are deployed
