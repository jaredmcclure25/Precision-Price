# Facebook OAuth Setup Guide for Precision Prices

**Copyright © 2025 Jared McClure / PrecisionPrices.Com. All Rights Reserved.**

---

## 🎯 Overview

This guide walks you through setting up Facebook Login for Precision Prices, enabling users to sign in with their Facebook accounts in one click.

---

## 📋 Prerequisites

- Firebase project (already set up)
- Facebook Developer account
- Precision Prices deployed to production domain

---

## 🚀 Step-by-Step Setup

### **Part 1: Create Facebook App**

#### **1. Go to Facebook Developers**
- Visit: https://developers.facebook.com/
- Click **"My Apps"** in top right
- Click **"Create App"**

#### **2. Choose App Type**
- Select **"Consumer"**
- Click **"Next"**

#### **3. App Details**
- **App Name**: `Precision Prices`
- **App Contact Email**: Your email (e.g., `contact@precisionprices.com`)
- **Business Account**: Select your business or create one (optional)
- Click **"Create App"**

#### **4. Complete Security Check**
- Verify you're not a robot
- Your app is created!

---

### **Part 2: Configure Facebook Login Use Case**

#### **5. Customize Your App Use Case**
On your app dashboard, you'll see prestaged options:
- **App customization and requirements**
- **Authenticate and request data from users with Facebook Login** (this is what we need!)
- **Review and complete testing requirements**
- **Business verification**
- **App Review**

Click on **"Customize"** or **"Get Started"** for the **"Authenticate and request data from users with Facebook Login"** use case.

#### **6. Configure Facebook Login**
- You'll be guided through the Facebook Login configuration
- Confirm you want to **use Facebook Login**
- The system will automatically add Facebook Login as a product to your app

#### **7. Add Your Website/Platform**
- When prompted for your platform, select **"Web"**
- **Site URL**: `https://precisionprices.com` (or your domain)
- Click **"Save"** and **"Continue"**

You can skip any quickstart tutorials - we've already implemented the code!

---

### **Part 3: Get App Credentials**

#### **8. Navigate to Settings**
- In left sidebar: **"Settings"** → **"Basic"**

#### **9. Copy Credentials**
You'll see:
- **App ID**: `1234567890123456` (example)
- **App Secret**: Click **"Show"** and copy it

**⚠️ KEEP APP SECRET PRIVATE! Never commit to Git or share publicly.**

---

### **Part 4: Configure Firebase**

#### **10. Go to Firebase Console**
- Visit: https://console.firebase.google.com/
- Select your **Precision Prices** project

#### **11. Navigate to Authentication**
- Click **"Authentication"** in left sidebar
- Click **"Sign-in method"** tab

#### **12. Enable Facebook**
- Find **"Facebook"** in the list
- Click on it
- Toggle **"Enable"** switch

#### **13. Enter Facebook Credentials**
- **App ID**: Paste from Facebook (step 9)
- **App Secret**: Paste from Facebook (step 9)
- Click **"Save"**

#### **14. Copy OAuth Redirect URI**
Firebase will show you a redirect URI like:
```
https://precision-prices-xxxxx.firebaseapp.com/__/auth/handler
```
**Copy this entire URL!**

---

### **Part 5: Configure Facebook App**

#### **15. Go Back to Facebook Developers**
- Return to https://developers.facebook.com/apps/
- Select your **Precision Prices** app

#### **16. Configure Facebook Login Settings**
- Left sidebar: **"Products"** → **"Facebook Login"** → **"Settings"**

#### **17. Add OAuth Redirect URIs**
In the **"Valid OAuth Redirect URIs"** field, add:

```
https://precision-prices-xxxxx.firebaseapp.com/__/auth/handler
https://precisionprices.com/__/auth/handler
https://www.precisionprices.com/__/auth/handler
```

(Replace with your actual Firebase auth handler and domains)

#### **18. Additional Settings**
- **Client OAuth Login**: Toggle **ON**
- **Web OAuth Login**: Toggle **ON**
- **Use Strict Mode for Redirect URIs**: Toggle **ON** (recommended)
- Click **"Save Changes"**

---

### **Part 6: App Review & Go Live**

#### **19. Test in Development Mode**
Your app is in "Development Mode" by default. This means:
- ✅ You can test with your own Facebook account
- ✅ You can add test users
- ❌ Public users cannot use it yet

**To test:**
1. Go to your site: https://precisionprices.com
2. Click "Continue with Facebook"
3. You should be able to sign in with YOUR Facebook account

#### **20. Add Test Users (Optional)**
- Facebook Developers → **"Roles"** → **"Test Users"**
- Click **"Add"**
- Create test accounts to share with team members

#### **21. Go Live (When Ready)**
Once you've tested and are ready for public users:

1. **App Review Preparation:**
   - Facebook Developers → **"App Review"** → **"Permissions and Features"**
   - Ensure "public_profile" and "email" permissions are requested
   - These are automatically approved for Facebook Login

2. **Switch to Live Mode:**
   - Top of dashboard: Toggle from **"Development"** to **"Live"**
   - You may need to add a **Privacy Policy URL** and **Terms of Service URL**

3. **Add Privacy Policy:**
   - Settings → Basic
   - **Privacy Policy URL**: `https://precisionprices.com/privacy`
   - **Terms of Service URL**: `https://precisionprices.com/terms`
   - Click **"Save Changes"**

4. **Make App Public:**
   - Settings → Basic
   - Toggle **"App Mode"** to **"Live"**

Now ANY Facebook user can sign in to Precision Prices!

---

## 🧪 Testing Checklist

### **Development Mode Testing:**

- [ ] Open https://precisionprices.com
- [ ] Click "Continue as Guest"
- [ ] Analyze 2 items (reach limit)
- [ ] Auth gate modal appears
- [ ] Click "Continue with Facebook"
- [ ] Facebook login popup opens
- [ ] Sign in with YOUR Facebook account
- [ ] Popup closes, you're logged in
- [ ] Can now analyze unlimited items
- [ ] Check Firebase Console → Authentication → Users
- [ ] Your Facebook user should appear

### **Production Testing (After Going Live):**

- [ ] Ask a friend to test signup
- [ ] They should be able to sign in with their Facebook
- [ ] Check Firebase for new user record
- [ ] Verify user profile created in Firestore

---

## 🔒 Security Best Practices

### **1. Protect App Secret**
```bash
# In your .env file (NEVER commit to Git)
VITE_FACEBOOK_APP_ID=your_app_id_here
VITE_FACEBOOK_APP_SECRET=your_app_secret_here
```

Add to `.gitignore`:
```
.env
.env.local
.env.production
```

### **2. Use HTTPS Only**
- Facebook requires HTTPS for OAuth
- Vercel provides HTTPS by default
- Local development: use `localhost` (allowed)

### **3. Restrict Domains**
In Facebook Login Settings:
- Only add your actual domains
- Don't use wildcards
- Remove test domains before going live

### **4. Monitor for Abuse**
- Facebook Developers → **"Analytics"**
- Watch for unusual login patterns
- Set up alerts for suspicious activity

---

## 🐛 Troubleshooting

### **Error: "URL Blocked"**
**Problem**: OAuth redirect URI not whitelisted

**Solution**:
1. Facebook Developers → Facebook Login → Settings
2. Add your domain to "Valid OAuth Redirect URIs"
3. Include the full Firebase auth handler URL

### **Error: "App Not Set Up"**
**Problem**: App still in development mode

**Solution**:
- Add yourself as a test user, OR
- Make the app public (go live)

### **Error: "Popup Blocked"**
**Problem**: Browser blocked the OAuth popup

**Solution**:
- User needs to allow popups for your site
- Our code shows a helpful error message

### **Error: "App ID Not Found"**
**Problem**: Wrong App ID entered in Firebase

**Solution**:
- Double-check App ID from Facebook Settings → Basic
- Re-enter in Firebase Authentication

---

## 📊 Analytics & Monitoring

### **Facebook Analytics**
Track login usage:
- Facebook Developers → **"Analytics"**
- See daily/monthly active users
- Monitor login success rate

### **Firebase Analytics**
Track conversion:
- Firebase Console → **"Analytics"**
- Events: `login` with `method: facebook`
- Compare Facebook vs Google vs Email signup rates

---

## 🔄 Ongoing Maintenance

### **Quarterly Reviews:**
- [ ] Check Facebook app permissions still valid
- [ ] Update Privacy Policy if features change
- [ ] Review OAuth redirect URIs (remove old ones)
- [ ] Check for Facebook platform updates

### **If You Change Domains:**
1. Update OAuth redirect URIs in Facebook
2. Update Firebase authorized domains
3. Test login flow on new domain

---

## 📞 Support Resources

- **Facebook Login Docs**: https://developers.facebook.com/docs/facebook-login/web
- **Firebase Auth Docs**: https://firebase.google.com/docs/auth/web/facebook-login
- **Facebook Help**: https://developers.facebook.com/support

---

## ✅ Quick Reference

### **Facebook App Settings**
```
App ID: [Your App ID]
App Secret: [Keep Secret!]
OAuth Redirect URI: https://[project].firebaseapp.com/__/auth/handler
Privacy Policy: https://precisionprices.com/privacy
Terms: https://precisionprices.com/terms
```

### **Firebase Settings**
```
Provider: Facebook
Enabled: YES
App ID: [From Facebook]
App Secret: [From Facebook]
```

---

**Setup Time**: ~15-20 minutes
**Difficulty**: Medium
**Cost**: Free (Facebook Login is free for any scale)

---

**Copyright © 2025 Jared McClure / PrecisionPrices.Com. All Rights Reserved.**
