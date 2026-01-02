# Stripe Payment Setup Instructions

## Overview
Precision Prices now uses Stripe for payment processing. Stripe charges **2.9% + $0.30 per transaction** with no monthly fees.

## Setup Steps

### 1. Create a Stripe Account
1. Go to https://stripe.com
2. Click "Sign up" and create a free account
3. Complete the registration process

### 2. Get Your API Keys
1. Log into your Stripe Dashboard: https://dashboard.stripe.com
2. Click on "Developers" in the left sidebar
3. Click on "API keys"
4. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...` for test mode)
   - **Secret key** (starts with `sk_test_...` for test mode, click "Reveal live key" to see it)

### 3. Add Keys to Your Environment File
1. Open `.env.local` in your project root
2. Replace the placeholder values:
   ```
   STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
   ```

### 4. Test Mode vs Live Mode
- **Test Mode** (recommended for development):
  - Use test API keys (starting with `sk_test_` and `pk_test_`)
  - Use test credit card: `4242 4242 4242 4242`
  - Any future expiry date, any 3-digit CVC
  - No real money is charged

- **Live Mode** (for production):
  - Switch to "Live" mode in Stripe Dashboard (toggle in top right)
  - Get your live API keys (starting with `sk_live_` and `pk_live_`)
  - Real credit cards will be charged
  - You need to activate your Stripe account first (provide business details)

### 5. Restart Your Server
After adding the keys:
```bash
npm run server
```

## Pricing Plans
Your current plans are:
- **Monthly**: $1.99/month
- **Quarterly**: $4.99/3 months ($1.66/month - Save 17%)
- **Yearly**: $14.99/year ($1.25/month - Save 37%)

## How It Works
1. User clicks "Subscribe" button
2. Backend creates a Stripe Checkout Session
3. User is redirected to Stripe's secure payment page
4. After payment, user is redirected back to your site
5. Stripe handles all payment processing, PCI compliance, and security

## Webhooks (Optional - For Production)
To handle subscription events (renewals, cancellations, etc.):
1. Go to Developers > Webhooks in Stripe Dashboard
2. Add endpoint: `https://precisionprices.com/api/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the webhook signing secret and add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

## Testing Payments
1. Use test mode API keys
2. Click subscribe on any plan
3. Use test card: `4242 4242 4242 4242`
4. Use any future expiry date and any CVC
5. Complete checkout to test the full flow

## Support
- Stripe Documentation: https://stripe.com/docs
- Test Cards: https://stripe.com/docs/testing
- Dashboard: https://dashboard.stripe.com
