# How to Diagnose "Payment system is not configured" Error

## Quick Diagnostic

Visit this URL on your production site to check environment variables:
```
https://yourdomain.com/api/debug/env
```

This will show you:
- Which environment variables are set
- Which are missing
- Troubleshooting steps

## Step-by-Step Diagnosis

### Step 1: Check the Diagnostic Endpoint

```bash
# On your server or from your browser
curl https://yourdomain.com/api/debug/env
```

Or visit: `https://yourdomain.com/api/debug/env` in your browser

### Step 2: Verify .env.production File

SSH into your server:
```bash
ssh username@your-server-ip
cd /var/www/scorched_v2
```

Check if file exists and has correct content:
```bash
# Check if file exists
ls -la .env.production

# View contents (be careful - this shows secrets!)
cat .env.production

# Check for Stripe variables specifically
cat .env.production | grep STRIPE
```

**Expected output:**
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Common issues:**
- ❌ File doesn't exist → Create it
- ❌ Variables have leading spaces → Remove them
- ❌ Wrong variable names → Fix spelling
- ❌ Using test keys (`pk_test_`) → Switch to live keys (`pk_live_`)

### Step 3: Check if Variable is Embedded in Build

After building, verify the variable is in the JavaScript bundle:
```bash
# After npm run build
grep -r "pk_live" .next/static/chunks/ 2>/dev/null | head -1
```

**If you see output:** Variable is embedded ✅
**If no output:** Variable is NOT embedded ❌ → You need to rebuild

### Step 4: Verify PM2 Environment

Check what PM2 sees:
```bash
pm2 env scorched-v2
```

This shows all environment variables PM2 has access to.

### Step 5: Check Build Logs

Look at the build output for any errors:
```bash
# Check PM2 logs
pm2 logs scorched-v2 --lines 50

# Or check build output if you just built
npm run build 2>&1 | tee build.log
```

## Common Scenarios

### Scenario 1: Variable Set But Still Getting Error

**Symptoms:**
- Variable is in `.env.production`
- Still seeing "Payment system is not configured"

**Cause:** Variable was set AFTER building

**Solution:**
```bash
# Rebuild the app
npm run build

# Restart PM2
pm2 restart scorched-v2
```

### Scenario 2: Variable Not in Build

**Symptoms:**
- `grep -r "pk_live" .next/static/chunks/` returns nothing
- Variable is in `.env.production`

**Cause:** Build happened before variable was set, or Next.js didn't read the file

**Solution:**
```bash
# Remove old build
rm -rf .next

# Rebuild
npm run build

# Verify variable is now embedded
grep -r "pk_live" .next/static/chunks/ 2>/dev/null | head -1

# Restart
pm2 restart scorched-v2
```

### Scenario 3: PM2 Not Reading .env.production

**Symptoms:**
- Variable is in `.env.production`
- `pm2 env scorched-v2` doesn't show it
- Build works but runtime doesn't

**Solution:** Use PM2 ecosystem file or set env vars in PM2:

```bash
# Option 1: Use PM2 ecosystem file
# Create ecosystem.config.js with env vars

# Option 2: Set env vars in PM2 directly
pm2 restart scorched-v2 --update-env
```

### Scenario 4: Wrong File Location

**Symptoms:**
- Variable is in `.env` or `.env.local`
- Not working in production

**Cause:** Next.js uses `.env.production` for production builds

**Solution:**
```bash
# Make sure you're using .env.production for production
# .env.local is only for local development
```

## Complete Fix Checklist

Run through this checklist:

- [ ] `.env.production` file exists on server
- [ ] File is in project root directory (`/var/www/scorched_v2/.env.production`)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is in the file
- [ ] No leading spaces before variable name
- [ ] Variable name is exactly correct (case-sensitive)
- [ ] Using live keys (`pk_live_`) not test keys (`pk_test_`)
- [ ] App has been rebuilt: `npm run build`
- [ ] Variable is embedded: `grep -r "pk_live" .next/static/chunks/` shows result
- [ ] PM2 has been restarted: `pm2 restart scorched-v2`
- [ ] Checked diagnostic endpoint: `/api/debug/env` shows variable as SET

## Still Not Working?

If you've completed all steps and it's still not working:

1. **Check browser console:**
   - Open Developer Tools (F12)
   - Check Console tab
   - Look for any errors or warnings

2. **Check server logs:**
   ```bash
   pm2 logs scorched-v2 --lines 100
   ```
   Look for any Stripe-related errors

3. **Try a completely fresh build:**
   ```bash
   # Clean everything
   rm -rf .next node_modules package-lock.json
   
   # Reinstall
   npm install
   
   # Rebuild
   npm run build
   
   # Restart
   pm2 restart scorched-v2
   ```

4. **Verify the actual key:**
   - Make sure you copied the FULL key from Stripe Dashboard
   - No extra spaces or line breaks
   - Key starts with `pk_live_` (for production)

5. **Check Next.js version compatibility:**
   ```bash
   npm list next
   ```
   Make sure you're using a compatible version

## Getting Help

If none of this works, gather this information:

1. Output of: `cat .env.production | grep STRIPE`
2. Output of: `pm2 env scorched-v2 | grep STRIPE`
3. Output of: `grep -r "pk_live" .next/static/chunks/ 2>/dev/null | head -1`
4. Response from: `curl https://yourdomain.com/api/debug/env`
5. Last 50 lines of PM2 logs: `pm2 logs scorched-v2 --lines 50`

This will help identify exactly where the problem is.
