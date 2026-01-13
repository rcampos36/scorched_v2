# Quick Fix: "Payment system is not configured" Error

## The Problem

You're getting this error even though you've set environment variables. This is because `NEXT_PUBLIC_*` variables must be embedded during the build process.

## Quick Fix (5 Steps)

### Step 1: SSH into Your Server
```bash
ssh username@your-server-ip
cd /var/www/scorched_v2
```

### Step 2: Verify .env.production File
```bash
# Check if file exists
ls -la .env.production

# View Stripe variables (should show your keys)
cat .env.production | grep STRIPE
```

**Must show:**
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**If missing or wrong:**
```bash
# Edit the file
nano .env.production

# Add these lines (NO leading spaces!):
STRIPE_SECRET_KEY=sk_live_your_actual_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_key_here

# Save: Ctrl+X, then Y, then Enter
```

### Step 3: Clean and Rebuild
```bash
# Remove old build
rm -rf .next

# Rebuild (this embeds NEXT_PUBLIC_* variables)
NODE_ENV=production npm run build
```

### Step 4: Verify Variable is Embedded
```bash
# This should show your key (even partially)
grep -r "pk_live" .next/static/chunks/ 2>/dev/null | head -1
```

**If you see output:** ✅ Variable is embedded - proceed to Step 5
**If no output:** ❌ Variable not embedded - check Step 2 again

### Step 5: Restart PM2
```bash
pm2 restart scorched-v2
```

## Verify It's Working

1. **Check diagnostic endpoint:**
   Visit: `https://yourdomain.com/api/debug/env`
   Should show `stripePublishableKey: "SET"`

2. **Test checkout:**
   - Add item to cart
   - Go to checkout
   - Fill customer info
   - Click "Continue to Payment"
   - Should see payment form (not error)

## Common Mistakes

❌ **Setting variable after building** → Must rebuild after setting
❌ **Leading spaces in .env.production** → Remove all spaces before variable names
❌ **Wrong file name** → Must be `.env.production` (not `.env` or `.env.local`)
❌ **Using test keys** → Must use `pk_live_` and `sk_live_` for production
❌ **Not restarting PM2** → Always restart after changes

## Still Not Working?

Run this diagnostic:
```bash
# On your server
curl http://localhost:3000/api/debug/env
```

This will show exactly what's set and what's missing.

See `DIAGNOSE_STRIPE_ERROR.md` for detailed troubleshooting.
