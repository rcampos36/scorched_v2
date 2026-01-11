# Stripe Payment Processing Checklist

## ✅ What's Already Implemented

1. **Stripe Packages Installed**
   - ✅ `stripe` (v14.25.0)
   - ✅ `@stripe/stripe-js` (v2.4.0)
   - ✅ `@stripe/react-stripe-js` (v2.9.0)

2. **API Routes Created**
   - ✅ `/api/stripe/create-payment-intent` - Creates payment intents
   - ✅ `/api/stripe/webhook` - Handles webhook events
   - ✅ `/api/stripe/update-payment-intent` - Updates payment metadata

3. **Components Created**
   - ✅ `StripePaymentForm.tsx` - Payment form with Stripe Elements
   - ✅ `Checkout.tsx` - Updated with Stripe integration
   - ✅ `/checkout/success` - Success page

4. **Order Integration**
   - ✅ Orders API updated to handle payment intent IDs
   - ✅ Order creation after successful payment
   - ✅ Email notifications on payment success

## ❌ What's Missing (Required for Payment Processing)

### 1. Environment Variables (CRITICAL)

Create a `.env.local` file in the project root with:

```env
# Stripe Secret Key (Server-side)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Stripe Publishable Key (Client-side)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Stripe Webhook Secret (For webhook verification)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**How to get these:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** > **API keys**
3. Copy your **Publishable key** and **Secret key**
4. For webhook secret, go to **Developers** > **Webhooks** and create an endpoint

### 2. Stripe Account Setup

- [ ] Create Stripe account at https://stripe.com
- [ ] Complete account verification (for production)
- [ ] Get test API keys from dashboard
- [ ] Set up webhook endpoint (for production)

### 3. Webhook Configuration (For Production)

**Local Development:**
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Use the webhook secret provided by CLI
```

**Production:**
- [ ] Add webhook endpoint in Stripe Dashboard
- [ ] URL: `https://yourdomain.com/api/stripe/webhook`
- [ ] Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
- [ ] Copy webhook signing secret to `.env.local`

### 4. Testing

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`
- Use any future expiry date (e.g., 12/34)
- Use any 3-digit CVC
- Use any ZIP code

### 5. Error Handling (Optional Improvements)

Current implementation has basic error handling. Consider adding:
- [ ] Better error messages for users
- [ ] Retry logic for failed payments
- [ ] Payment status tracking in database
- [ ] Admin dashboard for viewing payments

## 🚀 Quick Start

1. **Install dependencies** (if not done):
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Create `.env.local`**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Stripe keys
   ```

3. **Get Stripe keys**:
   - Sign up at https://stripe.com
   - Get test keys from dashboard
   - Add to `.env.local`

4. **Test locally**:
   ```bash
   npm run dev
   # Use test card: 4242 4242 4242 4242
   ```

5. **Set up webhook** (for production):
   - Use Stripe CLI for local testing
   - Configure webhook in dashboard for production

## ⚠️ Common Issues

1. **"Stripe is not configured"**
   - Check that `STRIPE_SECRET_KEY` is set in `.env.local`
   - Restart dev server after adding env vars

2. **"Invalid API key"**
   - Verify keys are correct (no extra spaces)
   - Ensure using test keys for development

3. **Webhook not working**
   - Verify webhook URL is correct
   - Check webhook secret matches
   - Use Stripe CLI for local testing

4. **Payment form not loading**
   - Check `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
   - Verify key starts with `pk_test_` or `pk_live_`

## 📝 Next Steps

Once environment variables are set:
1. Test payment flow with test cards
2. Verify order creation after payment
3. Check email notifications are sent
4. Set up production webhook
5. Switch to live keys for production

## 🔒 Security Notes

- Never commit `.env.local` to git
- Use test keys for development
- Use live keys only in production
- Always verify webhook signatures
- Keep API keys secure
