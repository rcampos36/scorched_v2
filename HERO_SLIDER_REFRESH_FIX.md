# Hero Slider Not Showing New Images - Fix Applied

## Problem
Images uploaded and saved in admin panel show in preview but don't appear on frontend hero slider.

## Fixes Applied

### 1. Disabled Next.js Caching
- Added `dynamic = 'force-dynamic'` to API route
- Added `revalidate = 0` to prevent caching
- Added cache control headers to API response

### 2. Added Cache Busting
- Frontend now uses timestamp query parameter
- Fetch uses `cache: 'no-store'`
- Added cache control headers to fetch request

### 3. Added Auto-Refresh
- Component refetches slides every 30 seconds
- Component refetches when window gains focus
- Better error handling and logging

### 4. Improved File Writing
- API route now verifies file was written correctly
- Better error messages for debugging

## Testing

After deploying these changes:

1. **Upload a new image** in admin panel
2. **Save the changes**
3. **Wait up to 30 seconds** - The frontend will auto-refresh
4. **Or refresh the page** manually
5. **Or switch tabs** and come back (triggers focus event)

## If Still Not Working

### Check 1: Restart Next.js Server

On Hostinger VPS, restart the server:
```bash
pm2 restart scorched-v2
```

Next.js might be caching the JSON file in memory.

### Check 2: Verify File Was Saved

```bash
cat data/hero-slides.json
```

Check that the image path is correct and the file was updated.

### Check 3: Check Browser Console

Open browser DevTools (F12) and check:
- Network tab - Is the API call returning the new data?
- Console tab - Any errors?

### Check 4: Check Server Logs

```bash
pm2 logs scorched-v2
```

Look for any errors when saving or fetching slides.

### Check 5: Verify Image File Exists

```bash
ls -la public/uploads/
```

Make sure the image file actually exists on the server.

### Check 6: Test API Directly

```bash
curl http://localhost:3000/api/hero-slides
```

Or in browser:
```
https://yourdomain.com/api/hero-slides
```

Check if the API returns the updated data.

## Expected Behavior

✅ **After saving:**
- Admin panel shows success message
- Frontend auto-refreshes within 30 seconds
- Or refresh page manually
- New images should appear

## Changes Made

**Files Modified:**
1. `src/app/api/hero-slides/route.ts`
   - Added cache control
   - Added file verification
   - Disabled Next.js caching

2. `src/components/HeroSlider.tsx`
   - Added cache busting
   - Added periodic refresh (30s)
   - Added focus event listener
   - Better error handling

## Next Steps

1. **Deploy the changes:**
   ```bash
   ./deploy.sh
   ```

2. **Restart the server** (if needed):
   ```bash
   pm2 restart scorched-v2
   ```

3. **Test:**
   - Upload new image
   - Save
   - Wait 30 seconds or refresh page
   - Verify image appears

If issues persist, check the troubleshooting steps above.
