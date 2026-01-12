# Admin Dashboard 404 Error - Troubleshooting Guide

If you're getting a 404 error on `/admin/dashboard`, here are the steps to diagnose and fix the issue.

## Common Causes

1. **Route file not found** - The page.tsx file might not exist or be in the wrong location
2. **Build error** - The route might have a build error preventing it from being created
3. **Middleware interference** - Middleware might be blocking the route incorrectly
4. **Deployment issue** - The route might not have been deployed correctly

## Step 1: Verify Route File Exists

The route file should be at: `/src/app/admin/dashboard/page.tsx`

Check if it exists:
```bash
ls -la src/app/admin/dashboard/page.tsx
```

If it doesn't exist, create it or restore it from your repository.

## Step 2: Check for Build Errors

1. **Build the application locally:**
   ```bash
   npm run build
   ```

2. **Look for errors** related to the dashboard page in the build output

3. **Check browser console** for runtime errors

## Step 3: Test Locally

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to:** `http://localhost:3000/admin/dashboard`

3. **Check if you're redirected** to `/admin/auth` (this is expected if not logged in)

4. **Login first** at `/admin/auth`, then try accessing the dashboard

## Step 4: Check Middleware Configuration

The middleware should protect the route but not prevent it from being accessible when authenticated.

**Current middleware configuration:**
- If you're NOT authenticated → redirects to `/admin/auth`
- If you ARE authenticated → allows access to `/admin/dashboard`

**Verify you're logged in:**
1. Go to `/admin/auth`
2. Login with your credentials
3. Check browser cookies for `admin-auth=authenticated`
4. Then navigate to `/admin/dashboard`

## Step 5: Check Authentication

If you're getting a 404 even after logging in:

1. **Check browser cookies:**
   - Open Developer Tools (F12)
   - Go to Application/Storage → Cookies
   - Look for `admin-auth` cookie with value `authenticated`

2. **Check authentication API:**
   ```bash
   curl http://localhost:3000/api/auth/session
   ```
   Should return: `{"authenticated": true, "email": "..."}`

## Step 6: Verify Route is Registered

1. **Check Next.js routes:**
   - After building, check `.next/server/app/admin/dashboard/page.js` exists
   - Or look in build output for route information

2. **Check if route is accessible:**
   - Try accessing it directly in browser
   - Check network tab for 404 response

## Step 7: Common Fixes

### Fix 1: Rebuild the Application

```bash
# Clean build
rm -rf .next
npm run build
```

### Fix 2: Clear Browser Cache

1. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Try in incognito/private window

### Fix 3: Verify Middleware Matcher

The middleware matcher should include the exact path. Current configuration:

```typescript
export const config = {
  matcher: [
    '/admin/dashboard',
    '/admin/dashboard/:path*',
    '/admin/login',
    '/admin/register',
    '/account',
    '/account/:path*',
  ],
}
```

### Fix 4: Check for Import Errors

Open the dashboard page file and check for any import errors:
- Missing dependencies
- Circular imports
- Type errors

## Step 8: Production Deployment Issues

If this happens on production (Vercel, Hostinger, etc.):

1. **Check build logs** - Look for errors during build
2. **Verify route was deployed** - Check deployment logs
3. **Check environment variables** - Ensure all required vars are set
4. **Clear deployment cache** - Try redeploying

### For Vercel:
```bash
# Redeploy
vercel --prod

# Or check logs
vercel logs
```

### For Hostinger:
```bash
# Rebuild
npm run build

# Restart PM2
pm2 restart scorched-v2
```

## Step 9: Alternative - Direct File Access

If middleware is causing issues, temporarily comment out the middleware protection:

```typescript
// In src/middleware.ts - temporarily comment out:
/*
if (pathname.startsWith('/admin/dashboard')) {
  const authCookie = request.cookies.get('admin-auth')
  
  if (!authCookie || authCookie.value !== 'authenticated') {
    return NextResponse.redirect(new URL('/admin/auth', request.url))
  }
}
*/
```

Then test if the route is accessible. **Remember to uncomment after testing!**

## Step 10: Check Route Structure

Verify your file structure matches:
```
src/
  app/
    admin/
      dashboard/
        page.tsx    ← This file should exist
      auth/
        page.tsx
      login/
        page.tsx
      register/
        page.tsx
```

## Quick Diagnostic Checklist

- [ ] Route file exists at `src/app/admin/dashboard/page.tsx`
- [ ] File exports a default component
- [ ] No TypeScript/build errors
- [ ] Build completes successfully
- [ ] Authenticated (have `admin-auth` cookie)
- [ ] Middleware matcher includes `/admin/dashboard`
- [ ] Development server shows route in terminal
- [ ] No console errors in browser
- [ ] Tried hard refresh/clear cache

## Still Having Issues?

1. **Check the exact URL** you're accessing (should be `/admin/dashboard`)
2. **Check browser console** for JavaScript errors
3. **Check network tab** for failed requests
4. **Verify you're on the correct domain** (not a subdomain issue)
5. **Check if it's a routing issue** - try accessing other routes

## Contact for Help

If none of these steps resolve the issue:
1. Check build logs for errors
2. Check browser console for errors
3. Verify the route file is not corrupted
4. Try creating a minimal test route to verify routing works
