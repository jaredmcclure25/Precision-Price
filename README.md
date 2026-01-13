# Precision Prices

**Copyright © 2025 Jared McClure / PrecisionPrices.Com. All Rights Reserved.**

---

## 🎯 AI-Powered Marketplace Pricing Tool

Precision Prices helps sellers price their items optimally using advanced AI market analysis. Get instant, accurate pricing recommendations for any item you want to sell online.

### ✨ Features

- 🤖 **AI Price Analysis** - Upload photos, get instant pricing using Claude AI
- 📊 **Market Insights** - Real-time demand and competition analysis
- 🎯 **Optimal Pricing** - Min/max/optimal price recommendations
- 📱 **Facebook Marketplace Integration** - Create shareable listings with one click
- 🔗 **Public Listing Pages** - SEO-optimized pages at `/item/{id}`
- 📈 **Analytics & Tracking** - View counts, share counts, conversion metrics
- 🔐 **Authentication** - Google, Facebook, and Email login options
- 👤 **Guest Mode** - Try 2 analyses before signing up
- 💾 **History & Dashboard** - Track all your priced items

### 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### 📚 Documentation

- [Facebook Marketplace Integration](FACEBOOK_MARKETPLACE_INTEGRATION.md)
- [Authentication Gate Setup](AUTHENTICATION_GATE_SUMMARY.md)
- [Facebook OAuth Configuration](FACEBOOK_OAUTH_SETUP.md)

### 🔧 Tech Stack

- **Frontend**: React 19 + Vite
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **Auth**: Firebase Authentication (Google, Facebook, Email/Password)
- **Database**: Cloud Firestore
- **Backend**: Express.js (Node.js)
- **AI**: Anthropic Claude API
- **Hosting**: Vercel
- **Icons**: Lucide React

### 🔐 Environment Variables

Create a `.env` file:

```bash
# Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Anthropic AI
ANTHROPIC_API_KEY=your_anthropic_key
```

### 📦 Project Structure

```
precision-prices/
├── src/
│   ├── components/         # Reusable React components
│   │   ├── AuthGateModal.jsx
│   │   ├── FacebookMarketplaceButton.jsx
│   │   ├── BullseyePriceTarget.jsx
│   │   └── ...
│   ├── pages/             # Route pages
│   │   ├── ListingPage.jsx
│   │   ├── TermsOfService.jsx
│   │   └── PrivacyPolicy.jsx
│   ├── hooks/             # Custom React hooks
│   ├── App.jsx            # Main application component
│   ├── AuthContext.jsx    # Authentication context & state
│   ├── firebase.js        # Firebase configuration
│   ├── listingStorage.js  # Firestore listing operations
│   └── main.jsx           # Application entry point
├── public/                # Static assets
├── server.js              # Express backend server
└── firestore.rules        # Firestore security rules
```

### 🔥 Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication (Email, Google, Facebook)
3. Create a Firestore database
4. Deploy security rules: `firebase deploy --only firestore:rules`
5. Add your Firebase config to `.env`

See [FACEBOOK_OAUTH_SETUP.md](FACEBOOK_OAUTH_SETUP.md) for detailed Facebook Login configuration.

### 🌐 Deployment

**Vercel (Recommended):**
```bash
npm run build
vercel --prod
```

**Railway:**
```bash
git push origin main
# Auto-deploys via GitHub integration
```

### 📊 Analytics & Metrics

Track these key demand signals:
- Guest → Authenticated conversion rate
- Analyses per user
- 7-day retention rate
- Share/export actions
- Signup method preference (Google vs Facebook vs Email)

### 🛡️ Security

- All API keys in environment variables
- Firebase security rules enforced
- HTTPS required for OAuth
- Input validation and sanitization
- Content filtering for prohibited items

### 📄 License

**Proprietary and Confidential**

Copyright © 2025 Jared McClure / PrecisionPrices.Com

All rights reserved. Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited.

### 👨‍💻 Author

**Jared McClure**
- Website: https://precisionprices.com
- Email: contact@precisionprices.com

---

**Built with ❤️ for marketplace sellers everywhere**

