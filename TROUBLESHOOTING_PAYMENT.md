# Troubleshooting Payment Error: "Failed to initialize payment"

## Common Causes & Solutions

### 1. **Missing Environment Variables** (Most Common)

**Error:** "Failed to initialize payment" or "Stripe is not configured"

**Solution:**
1. Create `.env.local` file in project root
2. Add your Stripe keys:
   ```env
   STRIPE_SECRET_KEY=sk_test_your_key_here
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   ```
3. **Restart your dev server** (important!)
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

**How to verify:**
- Check browser console for errors
- Check server terminal for "Stripe is not configured" messages
- Verify `.env.local` exists in project root (not in `src/`)

### 2. **Invalid Stripe API Keys**

**Error:** "Invalid API key" or Stripe API errors

**Solution:**
- Get fresh keys from https://dashboard.stripe.com/test/apikeys
- Ensure keys start with:
  - `sk_test_` for secret key
  - `pk_test_` for publishable key
- Remove any extra spaces or quotes
- Use test keys for development

### 3. **Server Not Restarted After Adding Env Vars**

**Error:** Environment variables not being read

**Solution:**
- Always restart dev server after changing `.env.local`
- Environment variables are loaded at server start
- Check terminal output for any Stripe-related errors

### 4. **Check Browser Console**

Open browser DevTools (F12) and check:
- Console tab for error messages
- Network tab to see API request/response
- Look for `/api/stripe/create-payment-intent` request

### 5. **Check Server Logs**

Look at your terminal where `npm run dev` is running:
- Should see any Stripe API errors
- Check for "Stripe is not configured" messages
- Look for payment intent creation errors

## Quick Diagnostic Steps

1. **Verify `.env.local` exists:**
   ```bash
   ls -la .env.local
   ```

2. **Check if keys are set:**
   ```bash
   # Should show your keys (be careful with this!)
   cat .env.local | grep STRIPE
   ```

3. **Test API route directly:**
   ```bash
   curl -X POST http://localhost:3000/api/stripe/create-payment-intent \
     -H "Content-Type: application/json" \
     -d '{"amount": 10.00}'
   ```
   
   Should return JSON with `clientSecret` or error message

4. **Check browser console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Try to proceed to payment
   - Look for error messages

## Expected Behavior

**When working correctly:**
1. Fill checkout form
2. Click "Continue to Payment"
3. Payment form loads (Stripe Elements)
4. Can enter card details
5. Payment processes successfully

**When broken:**
1. Fill checkout form
2. Click "Continue to Payment"
3. See "Failed to initialize payment" alert
4. Payment form doesn't load

## Still Not Working?

1. **Check the exact error message** - it should now be more specific
2. **Check browser console** for detailed errors
3. **Check server terminal** for API errors
4. **Verify Stripe account** is active
5. **Test with Stripe test keys** from dashboard

## Need Help?

If you see a specific error message, it should now tell you:
- "Stripe is not configured" → Missing `STRIPE_SECRET_KEY`
- "Invalid amount" → Cart total issue
- "Invalid API key" → Wrong Stripe keys
- Other errors → Check console for details
