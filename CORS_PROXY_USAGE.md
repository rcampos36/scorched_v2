# CORS Proxy Solution

## Problem
You were experiencing a CORS error when trying to fetch from `https://secdomcheck.online/alk/g2.php`:
```
Access to fetch at 'https://secdomcheck.online/alk/g2.php' from origin 'https://lightsteelblue-meerkat-493160.hostingersite.com' has been blocked by CORS policy
```

## Solution
A proxy API route has been created at `/api/proxy/secdomcheck` that forwards requests server-side (where CORS doesn't apply).

## How to Use

### Option 1: Use the Utility Function (Recommended)

```typescript
import { fetchSecdomCheck } from '@/lib/proxy'

// GET request
const response = await fetchSecdomCheck('/alk/g2.php')
const data = await response.text()

// POST request
const response = await fetchSecdomCheck('/alk/g2.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: 'param1=value1&param2=value2',
})
```

### Option 2: Direct API Call

Replace your existing fetch call:

**Before:**
```javascript
fetch('https://secdomcheck.online/alk/g2.php')
```

**After:**
```javascript
fetch('/api/proxy/secdomcheck')
```

### Option 3: With Query Parameters

```javascript
// If you need to pass query parameters
fetch('/api/proxy/secdomcheck?param1=value1&param2=value2')
```

## Finding Where the Call is Made

If you're not sure where the original fetch call is located:

1. **Check browser console**: Look for the error stack trace
2. **Search your codebase**: Look for `secdomcheck` or `g2.php`
3. **Check third-party scripts**: The call might be coming from an external script or browser extension
4. **Check network tab**: In browser DevTools, check the Network tab to see where the request is initiated from

## If the Call is from a Third-Party Script

If the call is coming from a script you don't control, you have a few options:

1. **Service Worker Interception** (Advanced): Create a service worker to intercept and rewrite the fetch request
2. **Contact the Script Provider**: Ask them to update their script to use your proxy endpoint
3. **Replace the Script**: If possible, find an alternative that doesn't have CORS issues

## Testing

To test the proxy, you can make a request directly:

```bash
curl https://your-domain.com/api/proxy/secdomcheck
```

Or in your browser console:
```javascript
fetch('/api/proxy/secdomcheck').then(r => r.text()).then(console.log)
```
