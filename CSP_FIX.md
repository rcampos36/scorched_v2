# Fix: Content Security Policy (CSP) Warnings

## Problem
Getting CSP warnings about blocking inline scripts and styles:
```
The Content Security Policy (CSP) prevents cross-site scripting attacks by blocking inline execution of scripts and style sheets.
```

## Understanding the Issue

### Important Note
**React's `onClick` handlers are NOT inline scripts!** They are event handlers attached by React's JavaScript bundle, which is loaded from external files. The CSP warning you're seeing is likely from:

1. **SVG Image CSP** - The CSP in `next.config.ts` only applies to SVG images, not your entire page
2. **Hosting Provider CSP** - Your hosting provider (Hostinger) might be setting CSP headers
3. **Browser Extensions** - Some extensions inject CSP warnings

## What's Actually Happening

### React onClick Handlers (✅ Safe)
```tsx
<button onClick={() => setOpen(true)}>Click</button>
```
This is **NOT** an inline script. React compiles this to:
```javascript
// React attaches event listeners via external JS bundle
element.addEventListener('click', handler)
```

### Actual Inline Scripts (❌ Blocked by CSP)
```html
<!-- This would be blocked -->
<button onclick="alert('bad')">Click</button>
<script>alert('bad')</script>
```

## Solutions

### Solution 1: Verify CSP Source

The CSP in `next.config.ts` is **only for SVG images**, not your entire page. Check if your hosting provider is setting CSP headers:

**Check Nginx headers:**
```bash
# On your server
sudo nano /etc/nginx/sites-available/scorched-v2
```

Look for any `add_header Content-Security-Policy` directives.

### Solution 2: Add Proper CSP Headers (If Needed)

If you need to set CSP headers for the entire site, add them in `next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Allow React
            "style-src 'self' 'unsafe-inline'", // Allow inline styles
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self'",
          ].join('; ')
        },
      ],
    },
  ]
}
```

**⚠️ Warning:** `'unsafe-inline'` reduces security. Only use if necessary.

### Solution 3: Use Nonces (Recommended for Production)

For better security, use nonces:

```typescript
// In a middleware or API route
import { randomBytes } from 'crypto'

const nonce = randomBytes(16).toString('base64')

// Add to CSP
`script-src 'self' 'nonce-${nonce}'`
```

Then add nonce to scripts:
```tsx
<script nonce={nonce}>...</script>
```

### Solution 4: Remove SVG CSP (If Not Using SVGs)

If you're not using SVG images, you can remove the CSP from image config:

```typescript
images: {
  // ... other config
  dangerouslyAllowSVG: false, // Remove SVG support
  // Remove contentSecurityPolicy
}
```

## Current Configuration

The CSP in `next.config.ts` has been updated to allow inline styles for SVG images:
```typescript
contentSecurityPolicy: "default-src 'self'; script-src 'none'; style-src 'unsafe-inline' 'self'; sandbox;"
```

This only affects SVG images, not your React components.

## Verification

### Check if CSP is Actually Blocking

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Look for actual CSP violations** (not just warnings)
4. **Check Network tab** - See if scripts are being blocked

### Test Your Site

1. **Clear browser cache** (Ctrl+Shift+R)
2. **Test all interactive elements**:
   - Buttons with onClick
   - Forms
   - Modals
   - Navigation

If everything works, the CSP warning is likely a false positive or from browser extensions.

## Common False Positives

### Browser Extensions
Some extensions (like ad blockers, privacy tools) inject CSP warnings. Test in:
- **Incognito/Private window** (extensions disabled)
- **Different browser**

### Development vs Production
CSP warnings might only appear in:
- **Development mode** (Next.js dev server)
- **Production** (if hosting provider sets CSP)

## Best Practices

### ✅ DO:
- Use React event handlers (`onClick`, `onChange`, etc.)
- Load scripts from external files
- Use CSS modules or Tailwind classes
- Validate and sanitize user input

### ❌ DON'T:
- Use HTML `onclick` attributes
- Inline `<script>` tags
- Inline `<style>` tags (use CSS modules instead)
- Use `eval()` or `Function()` constructor

## If You Must Use Inline Scripts

If you absolutely need inline scripts (not recommended):

1. **Use nonces** (most secure)
2. **Use hashes** (second best)
3. **Use 'unsafe-inline'** (least secure, but works)

Example with nonce:
```typescript
// Generate nonce server-side
const nonce = crypto.randomBytes(16).toString('base64')

// Add to CSP
`script-src 'self' 'nonce-${nonce}'`

// Use in component
<script nonce={nonce}>
  // Your inline script
</script>
```

## Next Steps

1. **Verify the warning source** - Check if it's from hosting provider or browser
2. **Test functionality** - If everything works, it's likely a false positive
3. **Check actual CSP violations** - Look in browser console for real errors
4. **Update CSP if needed** - Only if you have actual blocking issues

## Summary

- React `onClick` handlers are **safe** and **not inline scripts**
- The CSP in `next.config.ts` only affects **SVG images**
- If your site works, the warning is likely a **false positive**
- Check your **hosting provider** for CSP headers
- Test in **incognito mode** to rule out browser extensions
