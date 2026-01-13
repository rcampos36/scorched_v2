# Production Environment Variables Setup

This guide explains how to set environment variables in production to fix the "Payment system is not configured" error.

## Required Environment Variables

For Stripe payment processing to work in production, you need to set these environment variables:

```env
# Stripe Secret Key (Server-side) - REQUIRED
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here

# Stripe Publishable Key (Client-side) - REQUIRED
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here

# Stripe Webhook Secret (For webhook verification) - OPTIONAL but recommended
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Important:**
- Use **live keys** (starting with `sk_live_` and `pk_live_`) for production
- Use **test keys** (starting with `sk_test_` and `pk_test_`) only for development/testing
- Never commit these keys to git (they're already in `.gitignore`)

## How to Get Your Stripe Keys

1. **Sign up/Login to Stripe**: https://stripe.com
2. **Go to API Keys**: https://dashboard.stripe.com/apikeys
3. **Switch to Live Mode** (toggle in top right)
4. **Copy your keys**:
   - **Publishable key** (starts with `pk_live_`)
   - **Secret key** (starts with `sk_live_`) - Click "Reveal test key" to see it
5. **For Webhook Secret**: See webhook setup below

## Setting Environment Variables by Hosting Platform

### Option 1: Hostinger VPS/Cloud Hosting

1. **SSH into your server:**
   ```bash
   ssh username@your-server-ip
   ```

2. **Navigate to your project directory:**
   ```bash
   cd /var/www/scorched_v2
   ```

3. **Create or edit `.env.production` file:**
   ```bash
   nano .env.production
   ```

4. **Add your environment variables:**
   ```env
   NODE_ENV=production
   STRIPE_SECRET_KEY=sk_live_your_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

5. **Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

6. **Restart your application:**
   ```bash
   pm2 restart scorched-v2
   ```

**Alternative: Using PM2 Ecosystem File**

You can also set environment variables in a PM2 ecosystem file:

1. **Create `ecosystem.config.js` in project root:**
   ```javascript
   module.exports = {
     apps: [{
       name: 'scorched-v2',
       script: 'npm',
       args: 'start',
       env: {
         NODE_ENV: 'production',
         STRIPE_SECRET_KEY: 'sk_live_your_secret_key',
         NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_live_your_publishable_key',
         STRIPE_WEBHOOK_SECRET: 'whsec_your_webhook_secret',
       }
     }]
   }
   ```

2. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```

### Option 2: Vercel

1. **Go to your Vercel project dashboard**
2. **Navigate to**: Settings → Environment Variables
3. **Add each variable:**
   - Name: `STRIPE_SECRET_KEY`, Value: `sk_live_...`
   - Name: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, Value: `pk_live_...`
   - Name: `STRIPE_WEBHOOK_SECRET`, Value: `whsec_...`
4. **Select environment**: Production (and Preview if needed)
5. **Redeploy** your application

### Option 3: Netlify

1. **Go to your Netlify site dashboard**
2. **Navigate to**: Site settings → Environment variables
3. **Add each variable** (same as Vercel)
4. **Redeploy** your site

### Option 4: Railway

1. **Go to your Railway project**
2. **Navigate to**: Variables tab
3. **Add each variable**
4. **Redeploy** (automatic)

### Option 5: Render

1. **Go to your Render service**
2. **Navigate to**: Environment tab
3. **Add each variable**
4. **Save** (auto-redeploys)

## Setting Up Stripe Webhook (Production)

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/webhooks
2. **Click "Add endpoint"**
3. **Set endpoint URL**: `https://yourdomain.com/api/stripe/webhook`
4. **Select events to listen for:**
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. **Click "Add endpoint"**
6. **Copy the "Signing secret"** (starts with `whsec_`)
7. **Add it to your environment variables** as `STRIPE_WEBHOOK_SECRET`

## Verifying Environment Variables Are Set

### On Hostinger VPS (SSH)

```bash
# Check if variables are set (without showing values)
cd /var/www/scorched_v2
grep -E "STRIPE|NEXT_PUBLIC" .env.production

# Or check in Node.js
node -e "console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET')"
```

### In Application Code (Temporary Check)

You can temporarily add this to check (remove after verification):

```typescript
// In any API route
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET')
console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'SET' : 'NOT SET')
```

## Testing After Setup

1. **Restart your application** (if using PM2: `pm2 restart scorched-v2`)
2. **Clear browser cache** and reload
3. **Try the checkout flow**:
   - Add items to cart
   - Go to checkout
   - Fill customer information
   - Click "Continue to Payment"
   - You should see the payment form (not an error)

## Troubleshooting

### Error: "Payment system is not configured"

**Possible causes:**
1. Environment variables not set
2. Application not restarted after setting variables
3. Wrong variable names (check for typos)
4. Using test keys in production (should use live keys)

**Solutions:**
1. Verify variables are set (see verification section above)
2. Restart your application: `pm2 restart scorched-v2`
3. Check variable names match exactly:
   - `STRIPE_SECRET_KEY` (not `STRIPE_SECRET` or `STRIPE_KEY`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (must start with `NEXT_PUBLIC_`)
4. Ensure you're using live keys for production

### Error: "Invalid API key"

**Possible causes:**
1. Key has extra spaces or characters
2. Using test key in production mode
3. Key is revoked or incorrect

**Solutions:**
1. Copy key again from Stripe Dashboard (no spaces)
2. Use live keys (`sk_live_` and `pk_live_`) for production
3. Verify key in Stripe Dashboard → API Keys

### Payment Form Not Loading

**Possible causes:**
1. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` not set
2. Key format incorrect
3. Browser cache issue

**Solutions:**
1. Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
2. Check key starts with `pk_live_` or `pk_test_`
3. Clear browser cache and hard refresh (Ctrl+Shift+R)

## Security Best Practices

1. **Never commit keys to git** (already in `.gitignore`)
2. **Use different keys for development and production**
3. **Rotate keys periodically** (Stripe Dashboard → API Keys → Rotate)
4. **Use environment variables**, not hardcoded values
5. **Restrict API key permissions** in Stripe Dashboard if possible
6. **Monitor API usage** in Stripe Dashboard

## Quick Checklist

- [ ] Created Stripe account
- [ ] Got live API keys from Stripe Dashboard
- [ ] Set `STRIPE_SECRET_KEY` in production environment
- [ ] Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in production environment
- [ ] Set `STRIPE_WEBHOOK_SECRET` (optional but recommended)
- [ ] Restarted application after setting variables
- [ ] Tested checkout flow
- [ ] Payment form loads without errors
- [ ] Webhook endpoint configured (for production)

## Need Help?

- **Stripe Support**: https://support.stripe.com
- **Stripe Documentation**: https://stripe.com/docs
- **Project Documentation**: See `STRIPE_SETUP.md` for detailed setup

---

**Last Updated**: After fixing production environment variable handling
