# Environment Variables Setup for Railway & Vercel

## CRITICAL: Pre-Deployment Checklist

Before deploying to production, ensure the following:

1. **VITE_BACKEND_URL MUST be set on Vercel** - Without this, the frontend will fail to connect to your backend API. The localhost fallback only works in development mode.

2. **Rotate your Anthropic API key** if it was ever exposed during development or review. Generate a new one at https://console.anthropic.com/ and update Railway.

3. **Deploy Firestore security rules** before launch:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## Current Configuration Status

Your `.env` file contains all the necessary environment variables. Here's what needs to be configured on Railway (backend) and Vercel (frontend):

---

## Railway (Backend Server) Configuration

Railway runs your Express server (`server.js`) which needs these variables:

### Required Environment Variables for Railway:

```bash
# Anthropic API Key (CRITICAL - Backend only)
ANTHROPIC_API_KEY=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

# Stripe Secret Key (Backend only) - TEST MODE
STRIPE_SECRET_KEY=sk_test_51Sl7IdKH8sS1fktCuyNAY0GjltiXaQFiDQash38QeixzmKxnvdgsBmrfoIjm4k3DbXsbyxLUDyDL3AOMLg9nZ40B00tBJ6sWVY

# Port (Railway sets this automatically, but you can specify)
PORT=3001
```

### How to Set Railway Environment Variables:

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your `precision-prices` project
3. Click on your service
4. Go to **Variables** tab
5. Add each variable:
   - Click **+ New Variable**
   - Enter variable name and value
   - Click **Add**

### Railway Deployment Checklist:

- [ ] `ANTHROPIC_API_KEY` - Your Claude API key
- [ ] `STRIPE_SECRET_KEY` - Stripe backend key (test mode)
- [ ] `PORT` - Should be auto-set by Railway, but verify it's 3001 or let Railway manage it

**Note:** Do NOT add `VITE_*` variables to Railway - those are frontend-only.

---

## Vercel (Frontend) Configuration

Vercel hosts your React frontend which needs Firebase and Stripe public keys.

### Required Environment Variables for Vercel:

```bash
# Backend URL - Your Railway deployment URL
VITE_BACKEND_URL=https://your-railway-app.up.railway.app

# Firebase Configuration (Frontend)
VITE_FIREBASE_API_KEY=AIzaSyA9rhVA4Wj4XhfpUogmsdRgYjVPCtoVQTc
VITE_FIREBASE_AUTH_DOMAIN=precisionprices.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=precisionprices
VITE_FIREBASE_STORAGE_BUCKET=precisionprices.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1019654984116
VITE_FIREBASE_APP_ID=1:1019654984116:web:839cbeaa35714ae54c62e1

# Stripe Publishable Key (Frontend) - TEST MODE
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51Sl7IdKH8sS1fktCiWxARbr0DyVJVnRuYaa9v4kyrrLX9lESurCQLpgj2CmvMBU0sLTs2pSMTyW5m9RG0ToUokAm00lcNwnRmL
```

### How to Set Vercel Environment Variables:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `precision-prices` project
3. Go to **Settings** → **Environment Variables**
4. For each variable:
   - Enter variable name (e.g., `VITE_BACKEND_URL`)
   - Enter value
   - Select environments: **Production**, **Preview**, and **Development**
   - Click **Save**

### Vercel Deployment Checklist:

- [ ] `VITE_BACKEND_URL` - Your Railway backend URL (e.g., `https://precision-prices-production.up.railway.app`)
- [ ] `VITE_FIREBASE_API_KEY` - Firebase API key
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- [ ] `VITE_FIREBASE_PROJECT_ID` - Firebase project ID (precisionprices)
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- [ ] `VITE_FIREBASE_APP_ID` - Firebase app ID
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe public key (test mode)

**Note:** Do NOT add `ANTHROPIC_API_KEY` or `STRIPE_SECRET_KEY` to Vercel - those are backend secrets only!

---

## Important Notes

### 🔒 Security Best Practices

1. **Backend Secrets (Railway only):**
   - `ANTHROPIC_API_KEY` - Never expose to frontend
   - `STRIPE_SECRET_KEY` - Never expose to frontend
   - These should ONLY exist on Railway

2. **Frontend Variables (Vercel only):**
   - All `VITE_*` variables are PUBLIC and visible in browser
   - Firebase config is safe to expose (protected by Firebase rules)
   - Stripe publishable key is safe to expose (it's meant to be public)

3. **Never commit:**
   - `.env` - Already in `.gitignore`
   - `.env.local` - Already in `.gitignore`

### 🔄 Variable Sync Status

✅ **Local Development** - All variables in `.env` file
⏳ **Railway** - Needs manual setup (backend variables only)
⏳ **Vercel** - Needs manual setup (frontend variables only)

### 📍 Getting Your Railway URL

After deploying to Railway:
1. Go to your Railway project
2. Click on your service
3. Go to **Settings** → **Networking**
4. Copy the **Public Domain** (e.g., `https://precision-prices-production.up.railway.app`)
5. Add this as `VITE_BACKEND_URL` in Vercel

### 🧪 Test Mode vs Live Mode

Currently configured for **TEST MODE**:
- Stripe keys start with `sk_test_` and `pk_test_`
- No real charges will be processed
- Safe for development and testing

When ready to go live, you'll need to:
1. Update Railway: Add live `STRIPE_SECRET_KEY` (starts with `sk_live_`)
2. Update Vercel: Add live `VITE_STRIPE_PUBLISHABLE_KEY` (starts with `pk_live_`)
3. Uncomment the Stripe code in `server.js`

---

## Analytics-Specific Variables

The analytics system uses **Firebase Firestore** for data storage. No additional environment variables are needed beyond the existing Firebase configuration.

### What's Already Configured:

✅ Firebase Firestore is enabled in your project
✅ Security rules are deployed
✅ All Firebase env vars are set
✅ Analytics will work automatically once deployed

### Firestore Collections Created Automatically:

The analytics system will automatically create these collections when users interact with your app:
- `sessions` - User session tracking
- `activities` - Activity logs
- `user_stats` - User statistics
- `analytics_daily` - Daily aggregates (future)

---

## Quick Setup Commands

### Deploy to Railway:
```bash
# From your project directory
railway login
railway link
railway up
```

### Deploy to Vercel:
```bash
# From your project directory
vercel login
vercel link
vercel --prod
```

### Verify Environment Variables:

**Railway:**
```bash
railway variables
```

**Vercel:**
```bash
vercel env ls
```

---

## Troubleshooting

### Frontend can't reach backend:
- Check `VITE_BACKEND_URL` is set correctly on Vercel
- Verify Railway service is running
- Check CORS settings in `server.js` include your Vercel domain

### Firebase errors:
- Verify all `VITE_FIREBASE_*` variables are set on Vercel
- Check Firebase security rules are deployed: `firebase deploy --only firestore:rules`
- Ensure Firebase project is active in console

### Analytics not tracking:
- Check browser console for errors
- Verify Firebase rules are deployed
- Check that AnalyticsWrapper is wrapping your app in `main.jsx`

---

## Summary

| Variable | Railway | Vercel | Notes |
|----------|---------|--------|-------|
| `ANTHROPIC_API_KEY` | ✅ | ❌ | Backend only |
| `STRIPE_SECRET_KEY` | ✅ | ❌ | Backend only |
| `VITE_BACKEND_URL` | ❌ | ✅ | Your Railway URL |
| `VITE_FIREBASE_API_KEY` | ❌ | ✅ | Safe to expose |
| `VITE_FIREBASE_AUTH_DOMAIN` | ❌ | ✅ | Safe to expose |
| `VITE_FIREBASE_PROJECT_ID` | ❌ | ✅ | Safe to expose |
| `VITE_FIREBASE_STORAGE_BUCKET` | ❌ | ✅ | Safe to expose |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ❌ | ✅ | Safe to expose |
| `VITE_FIREBASE_APP_ID` | ❌ | ✅ | Safe to expose |
| `VITE_STRIPE_PUBLISHABLE_KEY` | ❌ | ✅ | Safe to expose |

All set! 🚀
