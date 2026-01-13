# How to Verify Stripe Environment Variables Are Set Correctly

## The Problem

You're seeing "Payment system is not configured" even though you've set environment variables. This happens because:

1. **`NEXT_PUBLIC_*` variables are embedded at BUILD TIME**, not runtime
2. If you set them after building, they won't be available
3. You MUST rebuild after setting/updating `NEXT_PUBLIC_*` variables

## Quick Verification Steps

### Step 1: Check if Variable is in .env.production

SSH into your server and check:

```bash
cd /var/www/scorched_v2
cat .env.production | grep STRIPE
```

You should see:
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Important:** Make sure there are NO leading spaces before the variable names!

### Step 2: Verify Variable is Embedded in Build

After building, check if the variable is embedded in the JavaScript bundle:

```bash
# After running npm run build
grep -r "pk_live" .next/static/chunks/ 2>/dev/null | head -1
```

If you see your publishable key (even partially), it's embedded correctly.

### Step 3: Check Server-Side Variable

Test if the server-side variable is available:

```bash
# Create a test file
cat > test-env.js << 'EOF'
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET')
console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'SET' : 'NOT SET')
EOF

# Run it
node test-env.js

# Clean up
rm test-env.js
```

## Common Issues and Solutions

### Issue 1: Variable Set After Build

**Symptom:** Variable is in `.env.production` but still getting error

**Solution:**
```bash
# Rebuild the app
npm run build

# Restart
pm2 restart scorched-v2
```

### Issue 2: Leading Spaces in .env File

**Symptom:** Variable appears to be set but not working

**Solution:**
```bash
# Remove leading spaces
sed -i 's/^[[:space:]]*//' .env.production

# Verify
cat .env.production | grep STRIPE
```

### Issue 3: Wrong File Name

**Symptom:** Variables in `.env` or `.env.local` but not working in production

**Solution:**
- Use `.env.production` for production builds
- `.env.local` is only for local development

### Issue 4: PM2 Not Reading .env.production

**Symptom:** Variables set but PM2 doesn't see them

**Solution:**
```bash
# Option 1: Use PM2 ecosystem file
# Create ecosystem.config.js with env vars

# Option 2: Load .env.production explicitly
# In your start script, use: node -r dotenv/config start dotenv_config_path=.env.production
```

## Complete Setup Checklist

- [ ] `.env.production` file exists on server
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set (no leading spaces)
- [ ] `STRIPE_SECRET_KEY` is set (no leading spaces)
- [ ] Variables are set BEFORE running `npm run build`
- [ ] App has been rebuilt: `npm run build`
- [ ] PM2 has been restarted: `pm2 restart scorched-v2`
- [ ] Verified variable is embedded: `grep -r "pk_live" .next/static/chunks/`

## Testing After Setup

1. **Check browser console:**
   - Open your site in browser
   - Open Developer Tools (F12)
   - Check Console tab
   - Should NOT see "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set" warning

2. **Test checkout flow:**
   - Add item to cart
   - Go to checkout
   - Fill customer info
   - Click "Continue to Payment"
   - Should see payment form (not error message)

3. **Check server logs:**
   ```bash
   pm2 logs scorched-v2 | grep -i stripe
   ```
   Should NOT see "STRIPE_SECRET_KEY is not set" errors

## Still Not Working?

If you've followed all steps and it's still not working:

1. **Double-check the variable names:**
   - Must be exactly: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Must be exactly: `STRIPE_SECRET_KEY`
   - Case-sensitive, no typos

2. **Verify you're using LIVE keys for production:**
   - Publishable key should start with `pk_live_`
   - Secret key should start with `sk_live_`
   - NOT `pk_test_` or `sk_test_` (those are for development)

3. **Check if build actually completed:**
   ```bash
   ls -la .next/
   ```
   Should see build files

4. **Try a clean rebuild:**
   ```bash
   rm -rf .next
   npm run build
   pm2 restart scorched-v2
   ```

5. **Check PM2 environment:**
   ```bash
   pm2 env scorched-v2
   ```
   This shows what environment variables PM2 sees

## Need More Help?

- See `PRODUCTION_ENV_SETUP.md` for detailed setup instructions
- See `STRIPE_SETUP.md` for Stripe-specific setup
- Check server logs: `pm2 logs scorched-v2`
