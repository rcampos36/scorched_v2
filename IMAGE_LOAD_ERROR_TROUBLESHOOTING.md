# Image Load Error Troubleshooting

## Error: "Hero slider image failed to load: /uploads/admin-1768273737697-graphics-ts.jpg"

This error means the image file cannot be loaded from the specified path.

## Common Causes

### 1. File Doesn't Exist
The image file might not have been saved correctly or was deleted.

**Check:**
```bash
ls -la public/uploads/admin-1768273737697-graphics-ts.jpg
```

**Fix:**
- Re-upload the image
- Check file permissions: `chmod 644 public/uploads/*`

### 2. Nginx Not Configured (Most Common on Hostinger)

If using Nginx, it must be configured to serve the `/uploads` directory.

**Check Nginx config:**
```bash
sudo cat /etc/nginx/sites-available/scorched-v2 | grep -A 10 "location /uploads"
```

**Fix - Update Nginx config:**
```nginx
# Serve uploads directly from file system (MUST come before location /)
location /uploads {
    alias /var/www/scorched_v2/public/uploads;
    expires 30d;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin *;
    
    # Fallback to Next.js if file doesn't exist
    try_files $uri @nextjs;
}
```

**Then restart Nginx:**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Next.js Not Serving Static Files

Next.js should automatically serve files from `public/`, but sometimes needs a restart.

**Fix:**
```bash
pm2 restart scorched-v2
```

### 4. Wrong Path Format

The path should be `/uploads/filename.jpg` (starts with `/`).

**Check JSON file:**
```bash
cat data/hero-slides.json | grep image
```

Should show paths like: `"/uploads/filename.jpg"`

### 5. File Permissions

Files might not be readable by the web server.

**Fix:**
```bash
chmod 755 public/uploads
chmod 644 public/uploads/*
```

### 6. Next.js Image Component Issue

Next.js Image component might have issues with local uploads.

**The code now includes:**
- `unoptimized={true}` for local uploads
- Fallback to regular `img` tag on error
- Better error logging

## Diagnostic Steps

### Step 1: Verify File Exists

```bash
# On server
cd /var/www/scorched_v2
ls -la public/uploads/admin-1768273737697-graphics-ts.jpg
```

### Step 2: Test Direct Access

**Via Nginx (if configured):**
```bash
curl -I https://yourdomain.com/uploads/admin-1768273737697-graphics-ts.jpg
```

**Via Next.js directly:**
```bash
curl -I http://localhost:3000/uploads/admin-1768273737697-graphics-ts.jpg
```

### Step 3: Check Browser Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Look for the image request
5. Check status code:
   - **200** = File exists, issue is with Image component
   - **404** = File doesn't exist or wrong path
   - **403** = Permission issue

### Step 4: Check Server Logs

```bash
pm2 logs scorched-v2
```

Look for errors related to file access.

### Step 5: Check Nginx Logs

```bash
sudo tail -f /var/log/nginx/error.log
```

## Quick Fixes

### Fix 1: Restart Everything

```bash
pm2 restart scorched-v2
sudo systemctl restart nginx
```

### Fix 2: Fix Permissions

```bash
chmod 755 public/uploads
chmod 644 public/uploads/*
sudo chown -R $USER:$USER public/uploads
```

### Fix 3: Verify Nginx Config

```bash
sudo nginx -t
# If errors, fix them
sudo systemctl restart nginx
```

### Fix 4: Check File Path in JSON

```bash
cat data/hero-slides.json
```

Ensure paths start with `/uploads/` not `uploads/` or `public/uploads/`

## Expected Behavior

✅ **Working:**
- Image loads in browser
- No console errors
- Network tab shows 200 status

❌ **Not Working:**
- Console shows error
- Network tab shows 404 or 403
- Image placeholder or broken image icon

## Code Changes Applied

I've updated the HeroSlider component to:
- Use `unoptimized={true}` for local uploads (bypasses Next.js optimization)
- Add fallback to regular `img` tag on error
- Better error logging to help diagnose issues

## Next Steps

1. **Check if file exists** on server
2. **Verify Nginx config** (if using Nginx)
3. **Check file permissions**
4. **Restart services**
5. **Test direct access** to image URL
6. **Check browser console** for detailed errors

If still not working, the issue is likely:
- Nginx not configured correctly
- File doesn't exist
- Permission issues
