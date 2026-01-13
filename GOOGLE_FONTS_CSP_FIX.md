# Fix: Google Fonts Blocked by CSP

## Problem
Getting CSP error blocking Google Fonts:
```
Loading the font 'https://fonts.gstatic.com/s/inter/v20/...' violates the following Content Security Policy directive: "font-src 'self' https://roktcdn1.akamaized.net https://apps.rokt.com". The action has been blocked.
```

## Root Cause

The CSP (Content Security Policy) is blocking fonts from `https://fonts.gstatic.com` because:
1. **Hosting provider CSP** - Your hosting provider (Hostinger) or CDN might be setting restrictive CSP headers
2. **Nginx CSP headers** - If you've set CSP in Nginx, it might not include Google Fonts
3. **Next.js Google Fonts** - Next.js automatically loads fonts from `fonts.gstatic.com` when using `next/font/google`

## Solutions

### Solution 1: Update Next.js CSP Headers (✅ Applied)

CSP headers have been added to `next.config.ts` to allow Google Fonts:

```typescript
{
  source: '/:path*',
  headers: [
    {
      key: 'Content-Security-Policy',
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' data: https://fonts.gstatic.com", // ✅ Allows Google Fonts
        "img-src 'self' data: https: blob:",
        "connect-src 'self'",
      ].join('; ')
    },
  ],
}
```

**After updating:**
```bash
npm run build
pm2 restart scorched-v2
```

### Solution 2: Update Nginx Configuration

If your hosting provider or Nginx is setting CSP headers, update your Nginx config:

```nginx
location / {
    proxy_pass http://localhost:3000;
    # ... other proxy settings ...
    
    # Override CSP to allow Google Fonts
    add_header Content-Security-Policy "font-src 'self' data: https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;" always;
}
```

**Important:** The `always` flag ensures the header is added even if Next.js doesn't set it.

**After updating Nginx:**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Solution 3: Check Hosting Provider CSP

If you're using Hostinger's managed hosting or CDN, they might be setting CSP headers. Check:

1. **Hostinger Control Panel** - Look for security settings or CSP configuration
2. **CDN Settings** - If using a CDN, check its security settings
3. **Contact Support** - Ask Hostinger support to allow `fonts.gstatic.com` in CSP

### Solution 4: Use Self-Hosted Fonts (Alternative)

If you can't modify CSP, you can self-host the fonts:

1. **Download fonts** from Google Fonts
2. **Place in `public/fonts/`** directory
3. **Update `layout.tsx`** to use local fonts:

```typescript
// Instead of next/font/google
import localFont from 'next/font/local'

const geistSans = localFont({
  src: './fonts/Geist-Regular.woff2',
  variable: '--font-geist-sans',
})
```

## Verification

### Step 1: Check if Fonts Load

1. **Open browser DevTools** (F12)
2. **Go to Network tab**
3. **Filter by "Font"**
4. **Reload page**
5. **Check if fonts from `fonts.gstatic.com` load** (should be 200 OK)

### Step 2: Check CSP Headers

1. **Open Network tab**
2. **Click on the main document request**
3. **Check Response Headers**
4. **Look for `Content-Security-Policy` header**
5. **Verify it includes `font-src ... https://fonts.gstatic.com`**

### Step 3: Test in Browser

1. **Clear browser cache** (Ctrl+Shift+R)
2. **Reload page**
3. **Check console** - Should see no CSP errors
4. **Verify fonts render correctly**

## Troubleshooting

### If Fonts Still Don't Load

1. **Check which CSP is being applied:**
   ```bash
   # On server, check response headers
   curl -I https://yourdomain.com | grep -i "content-security-policy"
   ```

2. **Check Nginx headers:**
   ```bash
   sudo grep -r "Content-Security-Policy" /etc/nginx/
   ```

3. **Check if multiple CSP headers exist:**
   - Multiple CSP headers can conflict
   - Only one should be set (preferably from Next.js)

4. **Check browser console:**
   - Look for the exact CSP directive that's blocking
   - The error message will show which directive failed

### If CSP is Set by Hosting Provider

If Hostinger or your CDN is setting CSP and you can't modify it:

1. **Contact Hostinger Support** - Ask them to add `fonts.gstatic.com` to `font-src`
2. **Use Self-Hosted Fonts** - Download and host fonts yourself
3. **Use Font Display Swap** - Ensure fonts have fallbacks so text is visible even if fonts fail to load

## Current Configuration

✅ **Next.js CSP** - Updated to allow Google Fonts
✅ **Nginx Guide** - Updated with CSP header example
✅ **Documentation** - This guide created

## Next Steps

1. **Rebuild application:**
   ```bash
   npm run build
   ```

2. **Restart Next.js:**
   ```bash
   pm2 restart scorched-v2
   ```

3. **Update Nginx** (if needed):
   ```bash
   sudo nano /etc/nginx/sites-available/scorched-v2
   # Add the CSP header as shown in Solution 2
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Test in browser** - Fonts should now load without CSP errors

## Additional Notes

- **Next.js Font Optimization** - Next.js automatically optimizes Google Fonts, so they load efficiently
- **Font Fallbacks** - The fonts have fallbacks (`system-ui`, `arial`, `monospace`) so text is always visible
- **Performance** - Google Fonts are cached by browsers, so subsequent loads are fast

## Summary

The CSP has been updated to allow Google Fonts. If you're still seeing errors:
1. Check if your hosting provider is setting CSP headers
2. Update Nginx configuration if needed
3. Contact hosting support if CSP is managed by them
4. Consider self-hosting fonts as a last resort
