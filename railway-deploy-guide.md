# Railway Public Domain Setup

Your backend needs a PUBLIC URL, not the internal one.

## Steps to Get Public URL:

### 1. In Railway Dashboard:

**A. Go to your service:**
- Click on your deployed service (precision-prices)

**B. Settings Tab:**
- Scroll to "Networking" section
- Click "Generate Domain" button
- Railway will create a public URL like:
  `precision-prices-production.up.railway.app`

### 2. Alternative - Add Custom Domain:

If you want to use your own domain (e.g., api.precisionprices.com):

**A. In Railway:**
- Settings → Networking → Custom Domain
- Add: api.precisionprices.com

**B. In Your Domain Registrar (Namecheap/GoDaddy):**
- Add CNAME record:
  - Type: CNAME
  - Name: api
  - Value: precision-prices-production.up.railway.app

**C. Wait for DNS (5-30 minutes)**

### 3. Copy Your Public URL:

Once you have the public domain, copy it and:

**In Vercel:**
- Dashboard → Your Project → Settings → Environment Variables
- Add:
  - Name: `VITE_BACKEND_URL`
  - Value: `https://precision-prices-production.up.railway.app` (or your custom domain)

**Then Redeploy:**
- Deployments tab → Latest → Redeploy

---

## Troubleshooting:

**If you see "precision-price.railway.internal":**
- That's the INTERNAL address (only works within Railway)
- You NEED the public domain from the Networking settings

**To find your public domain:**
1. Railway Dashboard
2. Your service
3. Settings
4. Networking section
5. Look for "Domains" - should see something.railway.app

**If no domain exists:**
- Click "Generate Domain" button in Networking section
