# Next.js Image Optimization Error Fix

## Problem

When accessing an image URL like:
```
https://yourdomain.com/_next/image?url=%2Fuploads%2Fadmin-1768274017990-graphics-ts.jpg&w=640&q=75
```

You get: **"The requested resource isn't a valid image"**

## Root Cause

Next.js Image component tries to optimize images through `/_next/image` route, but:
1. It can't access files from `public/uploads/` properly in production
2. If Nginx is serving `/uploads` directly, Next.js optimization API can't reach the file
3. The optimization API expects files to be accessible via Next.js, not directly from filesystem

## Solution

I've updated the code to use a **regular `<img>` tag** for local uploads instead of Next.js `Image` component.

**For images starting with `/uploads/`:**
- ✅ Uses regular `<img>` tag (bypasses Next.js optimization)
- ✅ Direct file access (no optimization API)
- ✅ Works with Nginx direct serving

**For external images (https://):**
- ✅ Still uses Next.js `Image` component (with optimization)

## The Fix

The `HeroSlider` component now checks:
```typescript
slide.image.startsWith('/uploads/') ? (
  // Use regular img tag - no Next.js optimization
  <img src={slide.image} ... />
) : (
  // Use Next.js Image for external URLs
  <Image src={slide.image} ... />
)
```

## Why This Happens

When you use Next.js `Image` component with a local path like `/uploads/file.jpg`:
1. Next.js tries to optimize it via `/_next/image?url=/uploads/file.jpg`
2. The optimization API tries to fetch the file
3. But in production with Nginx, the file might be served directly by Nginx
4. Next.js optimization API can't access it → Error

## Testing

### Direct Image Access (Should Work)
```
https://yourdomain.com/uploads/admin-1768274017990-graphics-ts.jpg
```
✅ Should work if Nginx is configured correctly

### Through Next.js Optimization (Won't Work)
```
https://yourdomain.com/_next/image?url=%2Fuploads%2Fadmin-1768274017990-graphics-ts.jpg
```
❌ This will fail because Next.js can't optimize local uploads

## After the Fix

With the updated code:
- ✅ Images load directly: `/uploads/file.jpg`
- ✅ No Next.js optimization for local uploads
- ✅ Faster loading (no optimization overhead)
- ✅ Works with Nginx direct serving

## Deployment

1. **Deploy the updated code:**
   ```bash
   ./deploy.sh
   ```

2. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

3. **Test:**
   - Images should load directly without going through `/_next/image`
   - Check browser console - should see "Hero slider image loaded successfully"

## If Still Not Working

### Check 1: Verify Code is Deployed
Make sure the updated `HeroSlider.tsx` is deployed with the regular `img` tag fix.

### Check 2: Clear Browser Cache
The browser might be caching the old component that uses Next.js Image.

### Check 3: Check Nginx Config
Ensure Nginx is configured to serve `/uploads`:
```nginx
location /uploads {
    alias /var/www/scorched_v2/public/uploads;
}
```

### Check 4: Verify File Exists
```bash
ls -la public/uploads/admin-1768274017990-graphics-ts.jpg
```

### Check 5: Test Direct Access
Try accessing the image directly (not through Next.js):
```
https://yourdomain.com/uploads/admin-1768274017990-graphics-ts.jpg
```

If this works but `/_next/image` doesn't, that confirms the issue and the fix should work.

## Summary

- **Problem:** Next.js Image optimization can't process local uploads
- **Solution:** Use regular `<img>` tag for `/uploads/` images
- **Result:** Images load directly, no optimization API needed

The fix is already in the code - just deploy it!
