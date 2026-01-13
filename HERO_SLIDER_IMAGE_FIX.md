# Hero Slider Image Display Fix

## Problem
Images uploaded to the hero slider were:
- Not showing preview in admin panel
- Not displaying on the hero slider component

## Root Causes Identified

1. **Next.js Image Component Path Handling**: The Next.js `Image` component in the admin preview might have issues with relative paths from `/uploads/`
2. **Image Path Normalization**: Image paths might not be consistently formatted
3. **State Update Issues**: Images might not refresh immediately after upload
4. **Error Handling**: No error handling for failed image loads

## Fixes Applied

### 1. Admin Panel Preview (Fixed)
- **Changed from Next.js Image to regular `img` tag** for admin preview
- More reliable for admin panel use
- Added proper error handling
- Added key prop to force re-render when image changes
- Normalized image paths to ensure they start with `/`

**File:** `src/app/admin/dashboard/page.tsx` (lines ~1080-1099)

### 2. Hero Slider Component (Fixed)
- **Normalized image paths** to handle both relative and absolute URLs
- Added error handling for failed image loads
- Ensured paths start with `/` for local images

**File:** `src/components/HeroSlider.tsx` (lines ~132-145)

### 3. Image Upload Handler (Fixed)
- **Normalized image URL** after upload to ensure it starts with `/`
- Added console logging for debugging
- Ensures consistent path format

**File:** `src/app/admin/dashboard/page.tsx` (lines ~689-691)

### 4. Save Handler (Fixed)
- **Refreshes slides from API** after saving to ensure consistency
- Prevents stale data issues

**File:** `src/app/admin/dashboard/page.tsx` (lines ~743)

## How It Works Now

1. **Upload Image:**
   ```
   User uploads → API saves to public/uploads/ → Returns /uploads/filename.jpg
   ```

2. **Update State:**
   ```
   URL normalized to /uploads/filename.jpg → State updated → Preview shows
   ```

3. **Save to JSON:**
   ```
   Click Save → Slides saved to data/hero-slides.json → Slides refreshed from API
   ```

4. **Display on Frontend:**
   ```
   HeroSlider fetches from API → Images display with normalized paths
   ```

## Testing Checklist

After deploying these fixes, test:

- [ ] Upload a new image to hero slider in admin panel
- [ ] Verify preview appears immediately after upload
- [ ] Click "Save All Changes"
- [ ] Verify image persists after page refresh
- [ ] Check hero slider on frontend displays the image
- [ ] Verify image loads correctly (check browser console for errors)

## Troubleshooting

### If images still don't show:

1. **Check browser console:**
   - Look for image loading errors
   - Check network tab to see if image requests are 404

2. **Verify file exists:**
   ```bash
   ls -la public/uploads/
   ```

3. **Check image path in JSON:**
   ```bash
   cat data/hero-slides.json
   ```
   - Should show paths like: `"/uploads/filename.jpg"`

4. **Check Nginx config** (if using Nginx):
   - Ensure `/uploads` location is configured correctly
   - See `PRODUCTION_IMAGE_FIX.md` for Nginx setup

5. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

6. **Restart Next.js server:**
   ```bash
   pm2 restart scorched-v2
   ```

## Changes Made

### Files Modified:
1. `src/app/admin/dashboard/page.tsx`
   - Changed admin preview to use `img` tag
   - Added image path normalization
   - Added error handling and logging
   - Added slide refresh after save

2. `src/components/HeroSlider.tsx`
   - Added image path normalization
   - Added error handling

## Expected Behavior

✅ **Admin Panel:**
- Image preview shows immediately after upload
- Preview updates when image URL is changed
- Error message shows if image fails to load

✅ **Frontend Hero Slider:**
- Images display correctly
- Handles both local (`/uploads/`) and external (`https://`) images
- Gracefully handles image load errors

## Next Steps

1. **Deploy the changes:**
   ```bash
   ./deploy.sh
   # or
   git pull && pm2 restart scorched-v2
   ```

2. **Test the functionality:**
   - Upload a new image
   - Verify preview and display

3. **Monitor for issues:**
   - Check browser console
   - Check server logs: `pm2 logs scorched-v2`

If issues persist, check the troubleshooting section above.
