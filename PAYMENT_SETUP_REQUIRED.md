# ⚠️ Payment Processing Setup Required

## Critical Missing Items

### 1. **Environment Variables** (REQUIRED - Payment won't work without this)

You need to create a `.env.local` file in the project root with your Stripe API keys:

```env
# Required for server-side Stripe operations
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Required for client-side Stripe Elements
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Required for webhook signature verification (production)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**How to get these keys:**
1. Sign up at https://stripe.com (free account)
2. Go to https://dashboard.stripe.com/test/apikeys
3. Copy your **Publishable key** (starts with `pk_test_`)
4. Copy your **Secret key** (starts with `sk_test_`)
5. For webhook secret, see webhook setup below

### 2. **Stripe Account** (REQUIRED)

- [ ] Create Stripe account
- [ ] Verify email address
- [ ] Get test API keys from dashboard
- [ ] (For production) Complete business verification

### 3. **Webhook Setup** (REQUIRED for production, optional for testing)

**For Local Development:**
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy the webhook secret (starts with whsec_) to .env.local
```

**For Production:**
1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Set URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the "Signing secret" to `.env.local` as `STRIPE_WEBHOOK_SECRET`

## ✅ What's Already Working

- ✅ Stripe packages installed
- ✅ Payment form component created
- ✅ API routes configured
- ✅ Checkout flow integrated
- ✅ Order creation after payment
- ✅ Success page created

## 🧪 Testing

Once you add the environment variables:

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Test with Stripe test cards:**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`
   - Expiry: Any future date (e.g., 12/34)
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

3. **Test the flow:**
   - Add items to cart
   - Go to checkout
   - Fill customer info
   - Enter test card details
   - Complete payment

## 🔍 Verification Checklist

Run through this checklist to verify everything works:

- [ ] `.env.local` file exists with all 3 Stripe keys
- [ ] Dev server restarted after adding env vars
- [ ] Can see payment form when clicking "Continue to Payment"
- [ ] Payment form loads without errors
- [ ] Test payment succeeds with `4242 4242 4242 4242`
- [ ] Order is created after successful payment
- [ ] Success page displays correctly
- [ ] Cart is cleared after payment

## 🐛 Troubleshooting

**"Stripe is not configured" error:**
- Check `.env.local` exists in project root
- Verify `STRIPE_SECRET_KEY` is set
- Restart dev server: `npm run dev`

**Payment form not loading:**
- Check `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Verify key starts with `pk_test_` or `pk_live_`
- Check browser console for errors

**"Invalid API key" error:**
- Verify keys are correct (no extra spaces)
- Ensure using test keys for development
- Check keys in Stripe Dashboard

**Webhook not working:**
- For local: Use Stripe CLI `stripe listen`
- For production: Verify webhook URL is correct
- Check webhook secret matches

## 📝 Quick Start Steps

1. **Create `.env.local` file:**
   ```bash
   touch .env.local
   ```

2. **Add your Stripe keys:**
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

4. **Test payment:**
   - Use test card: `4242 4242 4242 4242`
   - Complete checkout flow

## 🚀 Production Checklist

Before going live:

- [ ] Switch to live API keys (not test keys)
- [ ] Set up production webhook endpoint
- [ ] Test with real payment method (small amount)
- [ ] Verify order creation works
- [ ] Verify email notifications work
- [ ] Set up error monitoring
- [ ] Test refund process (if needed)

## 📚 Additional Resources

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe API Reference](https://stripe.com/docs/api)

---

**Status:** ⚠️ **Payment processing is NOT functional until environment variables are configured.**
