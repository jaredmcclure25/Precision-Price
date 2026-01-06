# Quick Analytics Guide - FREE & Easy

## ⚡ Fastest Way to View Analytics (Firebase Console)

### Bookmark These Links:

**All Sessions:**
```
https://console.firebase.google.com/project/precisionprices/firestore/data/~2Fsessions
```

**All Activities:**
```
https://console.firebase.google.com/project/precisionprices/firestore/data/~2Factivities
```

**User Stats:**
```
https://console.firebase.google.com/project/precisionprices/firestore/data/~2Fuser_stats
```

---

## 📊 What Each Collection Shows:

### **sessions** - User Sessions
Click to see:
- How long people stay on your site
- What device/browser they use
- Guest vs registered users
- Session start/end times

**Key Fields:**
- `duration` - How long they stayed (milliseconds)
- `deviceInfo.type` - mobile/desktop/tablet
- `isGuest` - true/false
- `pageViews` - Array of pages visited

### **activities** - All Events
Click to see:
- Every action users take
- Page views
- Analyses performed
- Images uploaded

**Key Fields:**
- `activityType` - What happened (analysis, page_view, etc.)
- `timestamp` - When it happened
- `metadata` - Details (item name, image count, etc.)

### **user_stats** - User Summaries
Click to see:
- Total analyses per user
- Total images per user
- First/last visit dates

---

## 🔍 Quick Queries (No Code)

### See Today's Activity:
1. Open `activities` collection
2. Click filter icon
3. Add: `timestamp` >= `[today's date]`

### Count Total Sessions:
1. Open `sessions` collection
2. Look at document count at bottom

### Find All Analyses:
1. Open `activities` collection
2. Click filter icon
3. Add: `activityType` == `analysis`

### See Guest Users:
1. Open `sessions` collection
2. Click filter icon
3. Add: `isGuest` == `true`

---

## 💰 Cost: **$0/month**

Firebase Free Tier includes:
- ✅ 1GB storage (plenty for analytics)
- ✅ 50K reads/day
- ✅ 20K writes/day
- ✅ Unlimited console access

You'll likely never hit these limits for analytics.

---

## 📱 Mobile Access

Download **Firebase Console App** (iOS/Android):
- View analytics on your phone
- Get notifications
- Quick stats on the go

---

## 📊 Weekly Summary (Manual)

Every Monday morning:
1. Open Firebase Console
2. Click `sessions` collection
3. Check document count vs last week
4. Click `activities` collection
5. Filter by `activityType == "analysis"`
6. Count how many analyses this week

**5 minutes, completely free, all the insights you need!**

---

## 🚀 Optional: Export to Spreadsheet

If you want charts/graphs:

1. Open Firebase Console
2. Click collection (`sessions` or `activities`)
3. Click "..." menu → "Export collection"
4. Download as CSV
5. Open in Google Sheets or Excel
6. Create charts

**Still free, still easy!**

---

## ❌ What NOT to Do (Too Expensive/Complex)

- ❌ Google Analytics 4 - Overkill for small sites
- ❌ BigQuery - Costs money after free tier
- ❌ Custom dashboard - Takes dev time
- ❌ Third-party analytics - Monthly fees

---

## ✅ Summary

**Best Solution:** Just use Firebase Console
- **Cost:** FREE forever
- **Time:** 2 clicks to view data
- **Setup:** Already done ✅
- **Learning curve:** None (visual interface)

**Your Analytics Links:**
- Sessions: https://console.firebase.google.com/project/precisionprices/firestore/data/~2Fsessions
- Activities: https://console.firebase.google.com/project/precisionprices/firestore/data/~2Factivities
- User Stats: https://console.firebase.google.com/project/precisionprices/firestore/data/~2Fuser_stats

That's it! No coding, no monthly fees, instant insights. 🎉
