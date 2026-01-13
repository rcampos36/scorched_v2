# Fix: Client-Side Exception Error

## Problem
Getting a generic client-side exception error:
```
Application error: a client-side exception has occurred while loading
```

This is a Next.js generic error that means something crashed on the client side.

## Common Causes

1. **Environment variable access** - `process.env` not available or undefined
2. **Missing error boundaries** - Uncaught errors crash the entire app
3. **Hydration mismatches** - Server/client HTML mismatch
4. **Missing dependencies** - Import errors or missing modules
5. **Browser API access** - Using `window` or `document` during SSR

## Solutions Applied

### 1. Fixed ConsoleSuppressor Component

**Problem:** `process.env.NODE_ENV` might not be available in client bundle.

**Fix:** Added safe checks:
```typescript
const isProduction = typeof process !== 'undefined' && 
                    process.env && 
                    process.env.NODE_ENV === 'production'
```

### 2. Added Error Boundary

**Problem:** Uncaught errors crash the entire application.

**Fix:** Added `ErrorBoundary` component to catch and handle errors gracefully.

## How to Debug

### Step 1: Check Browser Console

1. Open your site in browser
2. Open DevTools (F12)
3. Go to **Console** tab
4. Look for the actual error message (not just the generic one)

### Step 2: Check Network Tab

1. Open **Network** tab in DevTools
2. Look for failed requests (red status codes)
3. Check if any JavaScript files failed to load

### Step 3: Check for Specific Errors

Common errors to look for:
- `Cannot read property 'X' of undefined`
- `process is not defined`
- `window is not defined`
- `Module not found`
- `Hydration failed`

### Step 4: Test in Development

Run locally to see better error messages:
```bash
npm run dev
```

Development mode shows full error stack traces.

## Additional Debugging Steps

### Check Server Logs

On your Hostinger server:
```bash
pm2 logs scorched-v2
```

Look for any errors in the server logs.

### Verify Build

Make sure the build completed successfully:
```bash
cd /var/www/scorched_v2
npm run build
```

Check for any build errors or warnings.

### Check Environment Variables

Verify environment variables are set:
```bash
cat .env.production
# or
cat .env
```

Make sure `NODE_ENV=production` is set.

### Test Components Individually

If you can identify which component is causing the issue:

1. Comment out components one by one
2. Rebuild and test
3. Find which component causes the error

## Common Fixes

### Fix 1: Missing 'use client' Directive

If using hooks or browser APIs, add:
```typescript
'use client'
```

### Fix 2: Safe Window/Document Access

```typescript
// ❌ BAD
const width = window.innerWidth

// ✅ GOOD
useEffect(() => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth
  }
}, [])
```

### Fix 3: Safe Process.env Access

```typescript
// ❌ BAD
if (process.env.NODE_ENV === 'production')

// ✅ GOOD
if (typeof process !== 'undefined' && 
    process.env && 
    process.env.NODE_ENV === 'production')
```

### Fix 4: Handle Missing Data

```typescript
// ❌ BAD
const name = user.name.toUpperCase()

// ✅ GOOD
const name = user?.name?.toUpperCase() || ''
```

## Verification

After applying fixes:

1. **Clear browser cache** (Ctrl+Shift+R)
2. **Open in incognito window**
3. **Check console** - Should see no errors
4. **Test all pages** - Should load without crashing

## Still Not Working?

If you're still getting errors:

1. **Get the actual error** from browser console
2. **Check the error stack trace** - It will show which file/line
3. **Look for the component** mentioned in the error
4. **Check if it's a hydration issue** (see REACT_HYDRATION_FIX.md)

## Prevention

1. **Always use error boundaries** for critical sections
2. **Test in production build** before deploying
3. **Use TypeScript** to catch errors early
4. **Add try-catch** around risky operations
5. **Validate data** before using it
