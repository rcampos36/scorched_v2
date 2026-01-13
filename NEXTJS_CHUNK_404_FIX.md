# Fix: Next.js Chunk 404 Errors

## Problem
Getting 404 errors for Next.js chunk files in production:
```
https://yourdomain.com/_next/static/chunks/767293924107717f.js net::ERR_ABORTED 404 (Not Found)
```

## Root Causes

1. **Missing `.next` folder** - Build artifacts not deployed
2. **Incorrect Nginx configuration** - Not serving `/_next/static/` paths
3. **Build mismatch** - Build done on different machine/environment
4. **Next.js server not running** - The Node.js server isn't running or accessible

## Solutions

### Solution 1: Verify Build and Deployment ⚡ (MOST COMMON)

**On your server, check:**

1. **Verify the build exists:**
   ```bash
   cd /var/www/scorched_v2
   ls -la .next/
   ```

   You should see:
   - `.next/static/` directory
   - `.next/server/` directory
   - Various build files

2. **If `.next` folder is missing, rebuild:**
   ```bash
   cd /var/www/scorched_v2
   npm run build
   ```

3. **Verify Next.js server is running:**
   ```bash
   pm2 status
   # Should show scorched-v2 running
   
   # Or check if process is running
   ps aux | grep "next start"
   ```

4. **Check if Next.js is serving on port 3000:**
   ```bash
   curl http://localhost:3000/_next/static/chunks/
   # Should return something (not 404)
   ```

### Solution 2: Update Nginx Configuration

**The Nginx config must include a location block for `/_next/static/`:**

```nginx
# Serve Next.js static files (chunks, assets, etc.)
location /_next/static {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    add_header Cache-Control "public, max-age=31536000, immutable";
}

# Serve other Next.js internal paths
location /_next {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**After updating Nginx:**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Solution 3: Rebuild and Restart

**Complete rebuild process:**

```bash
cd /var/www/scorched_v2

# 1. Stop the application
pm2 stop scorched-v2

# 2. Clean old build (optional but recommended)
rm -rf .next

# 3. Reinstall dependencies (if needed)
npm install

# 4. Build the application
npm run build

# 5. Verify build succeeded
ls -la .next/static/

# 6. Start the application
pm2 start npm --name "scorched-v2" -- start

# 7. Check logs
pm2 logs scorched-v2
```

### Solution 4: Check File Permissions

**Ensure Next.js can read the `.next` folder:**

```bash
cd /var/www/scorched_v2
chmod -R 755 .next
chown -R $USER:$USER .next
```

### Solution 5: Verify Environment Variables

**Make sure production environment is set:**

```bash
# Check .env.production or .env file
cat .env.production

# Should have:
# NODE_ENV=production
```

## Diagnostic Steps

### Step 1: Test Direct Access to Next.js

```bash
# On your server, test if Next.js is serving chunks
curl -I http://localhost:3000/_next/static/chunks/

# Should return 200 OK, not 404
```

### Step 2: Test via Nginx

```bash
# Test if Nginx is proxying correctly
curl -I https://yourdomain.com/_next/static/chunks/

# Compare with direct Next.js access
```

### Step 3: Check Browser Network Tab

1. Open your site in browser
2. Open DevTools → Network tab
3. Look for failed requests to `/_next/static/chunks/`
4. Check the response - is it 404, 502, or something else?

### Step 4: Check Server Logs

```bash
# Next.js logs
pm2 logs scorched-v2

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

## Common Issues

### Issue 1: Build Done Locally, Not on Server

**Problem:** You built on your local machine, but `.next` folder is gitignored, so it wasn't deployed.

**Solution:** Build on the server:
```bash
# On server
cd /var/www/scorched_v2
git pull
npm install
npm run build
pm2 restart scorched-v2
```

### Issue 2: Nginx Not Proxying `/_next/` Paths

**Problem:** Nginx config doesn't have location blocks for `/_next/static/`.

**Solution:** Add the location blocks (see Solution 2 above).

### Issue 3: Next.js Server Not Running

**Problem:** PM2 process crashed or isn't running.

**Solution:**
```bash
pm2 restart scorched-v2
pm2 logs scorched-v2  # Check for errors
```

### Issue 4: Port Mismatch

**Problem:** Next.js running on different port than Nginx expects.

**Solution:**
```bash
# Check what port Next.js is using
pm2 logs scorched-v2 | grep "port"

# Update Nginx config if needed
# Change proxy_pass http://localhost:3000 to correct port
```

## Quick Fix Checklist

- [ ] `.next` folder exists on server
- [ ] `npm run build` completed successfully
- [ ] Next.js server is running (`pm2 status`)
- [ ] Nginx has `/_next/static` location block
- [ ] Nginx config tested (`sudo nginx -t`)
- [ ] Nginx restarted (`sudo systemctl restart nginx`)
- [ ] Can access `http://localhost:3000/_next/static/` directly
- [ ] File permissions are correct

## Verification

After applying fixes:

1. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Open site in incognito/private window**
3. **Check browser console** - should see no 404 errors
4. **Check Network tab** - all `/_next/static/` requests should return 200

## Still Not Working?

If you're still getting 404s:

1. **Check the exact error in browser console** - note the full URL
2. **Verify the file exists on server:**
   ```bash
   ls -la .next/static/chunks/ | grep 767293924107717f
   ```
3. **Check if chunk hash matches** - Next.js generates new hashes on each build
4. **Try a hard refresh** - the browser might be caching old chunk references

## Prevention

1. **Always build on the server** (or use CI/CD)
2. **Don't commit `.next` folder** (it's gitignored for a reason)
3. **Use PM2 to manage the process** (auto-restart on failure)
4. **Monitor logs regularly** (`pm2 logs scorched-v2`)
