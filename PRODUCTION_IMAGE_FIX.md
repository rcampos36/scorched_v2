# Fix: Images Not Showing in Production

## Problem
Images are uploaded to `/uploads/filename.jpg` but don't display in the frontend on production.

## Quick Fixes (Try in Order)

### Fix 1: Restart Next.js Server ⚡ (MOST COMMON)

On Hostinger VPS, Next.js needs to be restarted after files are uploaded:

```bash
# Restart PM2 process
pm2 restart scorched-v2

# Or if using npm start
# Stop and restart the server
```

**This is the most common solution!** Next.js caches static files and needs a restart to recognize new files in the `public` directory.

### Fix 2: Check File Permissions

Files might exist but not be readable:

```bash
# Check permissions
ls -la public/uploads/

# Fix permissions
chmod 644 public/uploads/*
chmod 755 public/uploads
```

### Fix 3: Verify File Exists

Make sure the file was actually saved:

```bash
# Check if file exists
ls -la public/uploads/admin-1768262331472-graphics-ts.jpg

# Verify full path
cd public/uploads
pwd
```

### Fix 4: Test Direct Access

Try accessing the image directly in your browser:
```
https://yourdomain.com/uploads/admin-1768262331472-graphics-ts.jpg
```

- ✅ **If image shows**: File exists, issue is with Next.js Image component
- ❌ **If 404**: File doesn't exist or isn't accessible

### Fix 5: Clear Browser Cache

- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Clear browser cache
- Try in incognito/private window

### Fix 6: Configure Nginx (If Using Nginx) 🔧 (IMPORTANT)

**This is likely the issue if images upload but don't display!**

If using Nginx as reverse proxy, you need to configure it to serve the uploads directory. Update your Nginx config file (`/etc/nginx/sites-available/scorched-v2`):

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Serve uploads directly from file system (BEFORE the location / block)
    location /uploads {
        alias /var/www/scorched_v2/public/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # Allow CORS if needed
        add_header Access-Control-Allow-Origin *;
        
        # Fallback to Next.js if file doesn't exist (optional)
        try_files $uri @nextjs;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Fallback location for Next.js
    location @nextjs {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Important Notes:**
- Replace `/var/www/scorched_v2` with your actual application path
- The `/uploads` location block MUST come BEFORE the `location /` block
- Make sure the path points to `public/uploads` directory

Then test and restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

**Verify the configuration:**
```bash
# Check if Nginx is running
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test direct access to uploads
curl -I https://yourdomain.com/uploads/test-image.jpg
```

## Why This Happens

1. **Next.js Static File Caching**: Next.js caches static files at build/start time
2. **File Permissions**: Files might not be readable by the web server
3. **Nginx Configuration**: If using Nginx, it might not be serving the uploads directory
4. **Browser Cache**: Browser might be caching 404 responses

## Most Likely Solutions (Ranked by Frequency)

### 🥇 Solution 1: Configure Nginx (90% of cases)

**If you're using Nginx as a reverse proxy, this is almost certainly the issue!**

Nginx needs to be configured to serve the `/uploads` directory directly. Follow **Fix 6** above to update your Nginx configuration.

**After updating Nginx config:**
```bash
# Test the configuration
sudo nginx -t

# If test passes, restart Nginx
sudo systemctl restart nginx

# Verify it's working
curl -I https://yourdomain.com/uploads/filename.jpg
```

### 🥈 Solution 2: Restart Next.js Server

**Restart your Next.js server:**
```bash
pm2 restart scorched-v2
```

This fixes the issue when Next.js hasn't recognized new files in the `public` directory.

### 🥉 Solution 3: Check File Permissions

```bash
# Fix permissions for uploads directory
chmod 755 /var/www/scorched_v2/public/uploads
chmod 644 /var/www/scorched_v2/public/uploads/*
```

## Diagnostic Steps

Run these commands to diagnose the issue:

```bash
# 1. Check if file exists
ls -la /var/www/scorched_v2/public/uploads/

# 2. Test direct access via Next.js (bypassing Nginx)
curl -I http://localhost:3000/uploads/your-filename.jpg

# 3. Test via Nginx
curl -I https://yourdomain.com/uploads/your-filename.jpg

# 4. Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# 5. Check Next.js logs
pm2 logs scorched-v2
```

**What the results mean:**
- ✅ Works on `localhost:3000` but not via domain → **Nginx configuration issue** (Fix 6)
- ❌ 404 on both → File doesn't exist or wrong path
- ✅ Works via domain → Issue is with Next.js Image component or browser cache
