# Precision Prices - Production Deployment Guide

## 🚀 Production Architecture

Your app uses a **split architecture** for optimal performance:

### Frontend: Vercel
- **Location**: `/dist` folder (built with `npm run build`)
- **Endpoint**: `https://precisionprices.com` (or your Vercel domain)
- **Tech**: React + Vite + Tailwind CSS + Firebase Client SDK

### Backend API: Vercel Serverless Functions
- **Location**: `/api` folder
- **Endpoint**: `https://precisionprices.com/api/analyze`
- **Tech**: Node.js serverless function that calls Anthropic API
- **Auth**: Uses `ANTHROPIC_API_KEY` environment variable

### Database: Firebase (Firestore)
- **Purpose**: User analytics, feedback, sessions, bug reports
- **Connection**: Firebase SDK configured in `/src/firebase.js`

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables

**Vercel Environment Variables** (add in Vercel Dashboard → Settings → Environment Variables):

```bash
# Anthropic API (REQUIRED)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Firebase Config (REQUIRED)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=precision-prices.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=precision-prices
VITE_FIREBASE_STORAGE_BUCKET=precision-prices.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:...

# Optional
VITE_BACKEND_URL=https://your-custom-api-domain.com
```

**Important**:
- `ANTHROPIC_API_KEY` is used by `/api/analyze.js` to call Claude API
- `VITE_*` variables are embedded into the frontend build
- All Firebase variables are public (they're meant to be in frontend)

---

## 🔄 How Production API Flow Works

### Current Code Logic (`src/App.jsx` lines 456-461):

```javascript
const apiUrl = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/api/analyze`
  : import.meta.env.DEV
  ? `http://${window.location.hostname}:3001/api/analyze`  // Mobile dev testing
  : '/api/analyze';  // ✅ PRODUCTION - Uses Vercel serverless function
```

**What Happens in Production:**
1. User uploads image and clicks "Analyze Pricing"
2. Frontend calls `/api/analyze` (relative path)
3. Vercel routes `/api/analyze` → `/api/analyze.js` serverless function
4. Serverless function calls `https://api.anthropic.com/v1/messages` with your `ANTHROPIC_API_KEY`
5. Response flows back: Anthropic → Serverless Function → Frontend → User

**✅ This is correct!** No changes needed for production deployment.

---

## 🏗️ Deployment Options

### Option 1: Vercel (Recommended - All-in-One)

**Deploy Frontend + API together:**

```bash
# From project root
npm run build  # Build frontend
vercel --prod  # Deploy to production
```

**Vercel automatically:**
- Builds your Vite app (`npm run build`)
- Deploys `/dist` as static site
- Deploys `/api/*.js` as serverless functions
- Routes `/api/*` requests to serverless functions

**Set Environment Variables:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `ANTHROPIC_API_KEY` (mark as "Secret")
3. Add all `VITE_FIREBASE_*` variables
4. Redeploy if variables were added after initial deployment

---

### Option 2: Vercel Frontend + Railway Backend (Split)

**If you want a persistent Node.js backend:**

**Deploy Backend to Railway:**
```bash
railway up  # Deploys server.js
```

**Deploy Frontend to Vercel:**
```bash
npm run build
vercel --prod
```

**Set Vercel Environment Variable:**
```bash
VITE_BACKEND_URL=https://your-app.railway.app
```

**Railway Environment Variables:**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
PORT=3001
```

---

## 🔥 Firebase Configuration

### Firestore Security Rules (`firestore.rules`)

**Current issue:** Line 21 blocks guest users from writing to `soldPrices`

```javascript
// CURRENT (blocks guests):
allow create: if request.auth != null;

// RECOMMENDED FIX (allow guests):
allow create: if true;
```

**Deploy updated rules:**
```bash
firebase deploy --only firestore:rules
```

---

## ✅ Testing Production Build Locally

**Before deploying, test production build:**

```bash
# Build for production
npm run build

# Preview production build
npm run preview
# Opens at http://localhost:4173

# Test that:
# 1. Images upload correctly
# 2. Analysis calls /api/analyze
# 3. Firebase writes work
```

**Test with Vercel CLI locally:**
```bash
vercel dev
# Opens at http://localhost:3000
# Simulates Vercel serverless functions locally
```

---

## 🐛 Troubleshooting

### Issue: "ANTHROPIC_API_KEY not set"
- **Cause**: Environment variable not set in Vercel
- **Fix**: Add `ANTHROPIC_API_KEY` in Vercel Dashboard → Settings → Environment Variables
- **Then**: Redeploy or trigger a new build

### Issue: API calls fail with 404
- **Cause**: Vercel not routing `/api/*` correctly
- **Fix**: Ensure `vercel.json` exists (now created)
- **Then**: Redeploy

### Issue: Firebase permission denied
- **Cause**: Firestore rules blocking guest users
- **Fix**: Update `firestore.rules` line 21 to `allow create: if true;`
- **Then**: Run `firebase deploy --only firestore:rules`

### Issue: CORS errors on production
- **Cause**: API not setting CORS headers
- **Fix**: Already handled in `/api/analyze.js` lines 8-15
- **Verify**: Check Network tab in browser DevTools

---

## 📊 Deployment Commands Summary

### Full Vercel Deployment (Frontend + API):
```bash
npm run build
vercel --prod
```

### Frontend Only (Vercel):
```bash
npm run build
# Upload dist/ folder to Vercel manually or push to Git (auto-deploy)
```

### Backend Only (Railway):
```bash
railway up
# Or push to Railway via Git
```

### Update Firestore Rules:
```bash
firebase deploy --only firestore:rules
```

---

## 🔐 Security Notes

1. **Never commit** `.env` or `.env.local` files
2. **ANTHROPIC_API_KEY** must be kept secret (only on backend)
3. **Firebase keys** are safe to expose (they're meant for frontend)
4. **Firestore rules** control data access, not API keys
5. **Rate limit** your Anthropic API usage in production

---

## 📝 Post-Deployment Checklist

- [ ] Verify `/api/analyze` returns 200 status
- [ ] Test image upload with HEIC (iOS)
- [ ] Test price analysis end-to-end
- [ ] Check Firebase writes in Firestore console
- [ ] Monitor Anthropic API usage
- [ ] Test on actual mobile devices (iOS + Android)
- [ ] Check Vercel function logs for errors
- [ ] Verify guest user limit (currently set to 100 for testing)

---

## 🚨 Important: Mobile Testing Fix Applied

**Line 460 in `src/App.jsx` changed:**
```javascript
// OLD (broke on mobile):
? 'http://localhost:3001/api/analyze'

// NEW (works on mobile + desktop):
? `http://${window.location.hostname}:3001/api/analyze`
```

**This allows testing on iPhone at `http://192.168.1.67:5173`**

**In production, this logic is ignored** because `import.meta.env.DEV` is `false`, so it uses `/api/analyze` (correct).

---

## 📞 Need Help?

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Firebase Docs: https://firebase.google.com/docs/firestore
- Anthropic API: https://docs.anthropic.com/
