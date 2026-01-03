# Deployment Checklist for Precision Prices

## Issues Found (January 3, 2025)

Your production site is showing errors because environment variables are missing in Vercel:

### Error 1: Invalid Firebase API Key
**Cause:** Firebase environment variables not configured in Vercel
**Fix:** Add Firebase config to Vercel (see step 2 below)

### Error 2: 404 on /api/analyze
**Cause:** Backend URL not configured (Railway deployment incomplete)
**Fix:** Complete Railway deployment and add URL to Vercel (see steps 1 & 2 below)

---

## Step 1: Deploy Backend to Railway

**Note:** Railway requires a $5/month Hobby subscription for production deployments with public domains.

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Find your project**: `precision-prices` or similar
3. **Upgrade to Hobby Plan** (if not already done):
   - Click on your workspace/account settings
   - Select "Hobby" plan ($5/month)
   - Complete payment
4. **Generate Public Domain**:
   - Click on your service
   - Go to "Settings" tab
   - Scroll to "Networking" section
   - Click "Generate Domain"
   - Copy the generated URL (e.g., `https://precision-prices-production.up.railway.app`)

4. **Add Environment Variables in Railway**:
   - Go to "Variables" tab
   - Add:
     ```
     ANTHROPIC_API_KEY=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
     STRIPE_SECRET_KEY=sk_test_51Sl7IdKH8sS1fktCuyNAY0GjltiXaQFiDQash38QeixzmKxnvdgsBmrfoIjm4k3DbXsbyxLUDyDL3AOMLg9nZ40B00tBJ6sWVY
     ```

5. **Deploy**:
   - Railway should auto-deploy from your GitHub repo
   - Or manually trigger deployment
   - Wait for deployment to complete

6. **Verify Backend Works**:
   ```bash
   curl https://your-railway-url.railway.app/api/health
   ```
   Should return: `{"status":"ok","message":"Precision Prices backend is running"}`

---

## Step 2: Configure Vercel Environment Variables

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: `precision-prices`
3. **Go to Settings → Environment Variables**
4. **Add ALL of these variables**:

   ```bash
   # Backend URL (from Railway)
   VITE_BACKEND_URL=https://your-railway-url.railway.app

   # Firebase Configuration
   VITE_FIREBASE_API_KEY=AIzaSyA9rhVA4Wj4XhfpUogmsdRgYjVPCtoVQTc
   VITE_FIREBASE_AUTH_DOMAIN=precisionprices.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=precisionprices
   VITE_FIREBASE_STORAGE_BUCKET=precisionprices.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=1019654984116
   VITE_FIREBASE_APP_ID=1:1019654984116:web:839cbeaa35714ae54c62e1

   # Stripe (already configured, but verify they're present)
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51Sl7IdKH8sS1fktCiWxARbr0DyVJVnRuYaa9v4kyrrLX9lESurCQLpgj2CmvMBU0sLTs2pSMTyW5m9RG0ToUokAm00lcNwnRmL
   ```

5. **Important**: Set all variables for "Production", "Preview", and "Development" environments

6. **Redeploy**:
   - Go to "Deployments" tab
   - Click "..." menu on latest deployment
   - Click "Redeploy"
   - OR push any commit to trigger new deployment

---

## Step 3: Verify Production Site Works

1. **Test the site**: https://www.precisionprices.com
2. **Open browser console** (F12 or Cmd+Option+I)
3. **Try to analyze an item**
4. **Check for**:
   - ✅ No Firebase API errors
   - ✅ No 404 errors on /api/analyze
   - ✅ Successful pricing analysis
   - ✅ Error logging to Firebase (if error occurs)

---

## Step 4: Test Error Logging

Follow the guide in [test-error-logging.md](./test-error-logging.md) to verify errors are being logged to Firebase.

---

## Local Development Setup

Your local `.env` file is now configured with:
- Firebase credentials ✅
- VITE_BACKEND_URL (empty for local dev) ✅
- Stripe TEST keys ✅

**To run locally:**
```bash
# Terminal 1 - Start backend
node server.js

# Terminal 2 - Start frontend
npm run dev
```

---

## Troubleshooting

### "API key not valid" error
- **Cause**: Firebase env vars not in Vercel
- **Fix**: Add all VITE_FIREBASE_* variables to Vercel and redeploy

### "404 Not Found" on /api/analyze
- **Cause**: Backend not deployed or VITE_BACKEND_URL not set
- **Fix**: Complete Railway deployment, add URL to Vercel

### Railway shows "internal" address
- **Cause**: Using private network address instead of public
- **Fix**: Generate public domain in Railway Networking settings

### Changes not showing up
- **Cause**: Vercel deployment cache
- **Fix**: Force redeploy or clear deployment cache

---

## Security Notes

- ✅ Stripe is in TEST mode (no real charges)
- ✅ Firebase rules deployed (bugReports allow anonymous create)
- ✅ Password temporarily set to "pod26" for family testing
- ✅ Trial limit temporarily set to 999999 for family testing

**After family testing, remember to:**
1. Change password back to secure value
2. Restore trial limit to 5
3. Update Firestore rules if needed for production security
