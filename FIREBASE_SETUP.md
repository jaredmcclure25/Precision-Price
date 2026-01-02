# Firebase Firestore Setup Instructions

## Quick Fix: Deploy Rules via Firebase Console (Easiest)

1. Go to https://console.firebase.google.com
2. Select your project: **precisionprices**
3. Click "Firestore Database" in the left menu
4. Click the "Rules" tab at the top
5. Copy and paste the contents of `firestore.rules` into the editor
6. Click "Publish"

That's it! Bug reports will now work.

---

## Alternative: Use Firebase CLI (Optional)

If you want to use the command line:

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in this project (only needed once)
firebase init firestore

# Deploy the rules
firebase deploy --only firestore:rules
```

## Verify It's Working

1. Go to your live site
2. Click the bug report button (red button in bottom right)
3. Submit a test bug report
4. Open `view-bug-reports.html` in your browser to see if it appeared

## Viewing Bug Reports

Open the file `view-bug-reports.html` in any web browser to see all submitted bug reports in real-time.
