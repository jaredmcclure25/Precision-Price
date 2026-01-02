# Firebase Setup Guide for Precision Prices

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `precision-prices` (or your preferred name)
4. Disable Google Analytics (optional, you can enable it later)
5. Click "Create project"

## Step 2: Register Your Web App

1. In your Firebase project, click the **Web icon** (`</>`) to add a web app
2. Enter app nickname: `Precision Prices Web`
3. Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"
5. **Copy the Firebase configuration** - you'll need this!

It will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "precision-prices-xxxxx.firebaseapp.com",
  projectId: "precision-prices-xxxxx",
  storageBucket: "precision-prices-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```

## Step 3: Enable Authentication

1. In Firebase Console, go to **Build → Authentication**
2. Click "Get started"
3. Click on "Email/Password" under Sign-in providers
4. Toggle "Enable" to ON
5. Click "Save"

## Step 4: Set Up Firestore Database

1. In Firebase Console, go to **Build → Firestore Database**
2. Click "Create database"
3. Choose "Start in **production mode**" (we'll set rules next)
4. Select your Cloud Firestore location (choose closest to your users)
5. Click "Enable"

### Set Firestore Security Rules

Click on the "Rules" tab and replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // User item history - only owner can access
    match /users/{userId}/items/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click "Publish"

## Step 5: Add Firebase Config to Your Project

### For Local Development:

Create a `.env.local` file in your project root:

```bash
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Replace the values with your actual Firebase config from Step 2.

### For Production (Vercel):

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings → Environment Variables**
4. Add each variable:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. Select all environments (Production, Preview, Development)
6. Click "Save"

## Step 6: Test Your Setup

1. Restart your dev server: `npm run dev`
2. Open http://localhost:5173
3. You should see the login/signup page
4. Try creating an account
5. Check Firebase Console → Authentication to see your new user

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Make sure you enabled Email/Password authentication in Step 3

### "Missing or insufficient permissions"
- Check your Firestore rules in Step 4
- Make sure you're logged in

### Environment variables not working
- Restart your dev server after adding `.env.local`
- Vite requires `VITE_` prefix for environment variables

## Firebase Pricing

Firebase free tier includes:
- **Authentication**: Unlimited users
- **Firestore**: 50K reads/day, 20K writes/day, 1GB storage
- **Hosting**: 10GB storage, 360MB/day bandwidth

This is more than enough for getting started! You'll only pay if you exceed these limits.

---

**Next Steps**: Once Firebase is set up, you can use the app with full user authentication and cloud-synced data!
