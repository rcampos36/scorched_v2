# Fix: Inline Event Handler CSP Violation

## Problem
Getting CSP error blocking inline event handlers:
```
Executing inline event handler violates the following Content Security Policy directive 'script-src 'self''. Either the 'unsafe-inline' keyword, a hash ('sha256-...'), or a nonce ('nonce-...') is required to enable inline execution.
```

## Root Cause

The CSP is set to `script-src 'self'` which blocks:
- Inline scripts (`<script>...</script>`)
- Inline event handlers (`onclick="..."` in HTML)
- `javascript:` URLs

**Important Note:** React's `onClick` handlers are **NOT** inline event handlers - they're event listeners attached by React's JavaScript bundle. However, if your hosting provider is setting a restrictive CSP, it might be blocking React's event attachment mechanism.

## Solutions

### Solution 1: Update Next.js CSP (✅ Applied)

Updated `next.config.ts` to include `'unsafe-hashes'` for event handlers:

```typescript
"script-src 'self' 'unsafe-eval' 'unsafe-inline' 'unsafe-hashes'"
```

The `'unsafe-hashes'` keyword allows:
- Event handlers (like `onclick` attributes)
- Style attributes with JavaScript
- `javascript:` URLs

### Solution 2: Override CSP in Nginx (If Hosting Provider Sets CSP)

If your hosting provider (Hostinger) is setting CSP headers, override them in Nginx:

```nginx
location / {
    # ... proxy settings ...
    
    # Override restrictive CSP from hosting provider
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' 'unsafe-hashes'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self';" always;
}
```

**Important:** The `always` flag ensures this header is added even if the hosting provider sets one.

### Solution 3: Contact Hosting Provider

If you can't override CSP in Nginx, contact Hostinger support and ask them to:
1. Remove or relax CSP headers
2. Add `'unsafe-inline'` and `'unsafe-hashes'` to `script-src`
3. Allow you to set your own CSP headers

## Understanding React Event Handlers

### React onClick (✅ Safe)
```tsx
<button onClick={() => setOpen(true)}>Click</button>
```
This is **NOT** an inline event handler. React compiles this to:
```javascript
// React attaches event listeners via external JS bundle
element.addEventListener('click', handler)
```

### Actual Inline Event Handlers (❌ Blocked)
```html
<!-- This would be blocked by CSP -->
<button onclick="alert('bad')">Click</button>
```

## Verification

### Step 1: Check Which CSP is Active

1. **Open browser DevTools** (F12)
2. **Go to Network tab**
3. **Click on the main document request**
4. **Check Response Headers**
5. **Look for `Content-Security-Policy` header**
6. **Verify it includes `'unsafe-inline'` and `'unsafe-hashes'`**

### Step 2: Test Functionality

1. **Clear browser cache** (Ctrl+Shift+R)
2. **Test all interactive elements:**
   - Buttons with onClick
   - Forms
   - Modals
   - Navigation
3. **Check console** - Should see no CSP errors

### Step 3: Check for CSP Conflicts

If you see multiple CSP headers:
```bash
# On server, check response headers
curl -I https://yourdomain.com | grep -i "content-security-policy"
```

Multiple CSP headers can conflict. Only one should be set.

## Troubleshooting

### If CSP is Still Blocking

1. **Check Nginx configuration:**
   ```bash
   sudo grep -r "Content-Security-Policy" /etc/nginx/
   ```

2. **Check if hosting provider sets CSP:**
   ```bash
   # Test from server
   curl -I https://yourdomain.com | grep -i "content-security-policy"
   ```

3. **Check browser console:**
   - Look for the exact CSP directive that's blocking
   - The error message will show which directive failed

### If Multiple CSP Headers Exist

If you see multiple CSP headers:
- **Remove duplicate headers** - Only one CSP should be set
- **Use Nginx to override** - Set CSP in Nginx with `always` flag
- **Contact hosting support** - Ask them to remove their CSP headers

## Security Considerations

### ⚠️ Warning: `'unsafe-inline'` and `'unsafe-hashes'`

These keywords reduce security by allowing:
- Inline scripts (potential XSS risk)
- Inline event handlers (potential XSS risk)

**However**, for React applications:
- React doesn't use inline scripts (uses external bundles)
- React's onClick handlers are safe (not inline event handlers)
- The risk is minimal if you're not using `dangerouslySetInnerHTML`

### Better Alternatives (For Future)

For better security, consider:
1. **Use nonces** - Generate nonces server-side and add to scripts
2. **Use hashes** - Calculate hashes for inline scripts
3. **Avoid inline scripts** - Move all JavaScript to external files

## Current Configuration

✅ **Next.js CSP** - Updated with `'unsafe-hashes'`
✅ **Nginx Guide** - Updated with CSP override example
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

3. **Update Nginx** (if hosting provider sets CSP):
   ```bash
   sudo nano /etc/nginx/sites-available/scorched-v2
   # Add the CSP header override as shown in Solution 2
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Test in browser** - Event handlers should now work without CSP errors

## Summary

- React `onClick` handlers are **safe** and not inline event handlers
- The CSP has been updated to allow event handlers with `'unsafe-hashes'`
- If hosting provider sets CSP, override it in Nginx
- Test functionality - if everything works, CSP is properly configured
