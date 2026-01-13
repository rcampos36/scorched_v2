# Image Upload Troubleshooting - Images Not Showing in Production

If uploaded images are saved to `/uploads/filename.jpg` but not showing in the frontend, follow these steps:

## Common Issues on VPS/Production

### Issue 1: Next.js Needs to Be Restarted

In production, Next.js might need to be restarted after files are uploaded to recognize new files in the `public` directory.

**Solution:**
```bash
# Restart PM2 process
pm2 restart scorched-v2

# Or if using npm start
# Stop and restart the server
```

### Issue 2: File Permissions

Files might be uploaded but not readable by the web server.

**Solution:**
```bash
# Check file permissions
ls -la public/uploads/

# Fix permissions (readable by all)
chmod 644 public/uploads/*
chmod 755 public/uploads
```

### Issue 3: Files Not in Correct Location

Verify files are actually in `public/uploads/` directory.

**Solution:**
```bash
# Check if files exist
ls -la public/uploads/

# Verify the path
cd public/uploads
pwd
# Should show: /var/www/your-app/public/uploads
```

### Issue 4: Next.js Static File Serving

Next.js serves files from `public/` directory, but in production mode, there might be caching or serving issues.

**Solution:**
1. **Hard refresh browser**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Clear browser cache**
3. **Check if file is accessible directly**: Try accessing `https://yourdomain.com/uploads/admin-1768262331472-graphics-ts.jpg` directly in browser

### Issue 5: Nginx Configuration

If using Nginx as reverse proxy, it might not be serving static files correctly.

**Solution:**
Add this to your Nginx configuration to serve uploads directory:

```nginx
server {
    # ... existing config ...

    location /uploads {
        alias /var/www/your-app/public/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Then restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Issue 6: Next.js Image Component Optimization

If using Next.js `Image` component, it might try to optimize images but fail for local files.

**Solution:**
For local uploads, you might need to use regular `<img>` tags instead of Next.js `Image` component, or configure Next.js to serve static files correctly.

### Issue 7: File Path Issues

Check if the URL path matches the actual file location.

**Solution:**
```bash
# The URL is: /uploads/admin-1768262331472-graphics-ts.jpg
# The file should be at: public/uploads/admin-1768262331472-graphics-ts.jpg

# Verify:
ls -la public/uploads/admin-1768262331472-graphics-ts.jpg
```

## Quick Diagnostic Steps

1. **Check if file exists:**
   ```bash
   ls -la public/uploads/admin-1768262331472-graphics-ts.jpg
   ```

2. **Check file permissions:**
   ```bash
   ls -l public/uploads/
   # Should show: -rw-r--r-- (644 permissions)
   ```

3. **Try accessing directly:**
   - Open: `https://yourdomain.com/uploads/admin-1768262331472-graphics-ts.jpg`
   - If it shows 404, the file isn't accessible
   - If it shows the image, the file is fine but there's a display issue

4. **Check browser console:**
   - Open Developer Tools (F12)
   - Check Console for errors
   - Check Network tab - see if image request fails

5. **Check server logs:**
   ```bash
   # PM2 logs
   pm2 logs scorched-v2

   # Or Next.js logs
   # Check for any errors related to file serving
   ```

## Most Common Fix

**Restart the Next.js application:**
```bash
pm2 restart scorched-v2
```

This is the most common solution for VPS hosting - Next.js needs to be restarted to recognize new files in the `public` directory.

## Alternative: Use Absolute URLs

If images still don't work, you might need to return absolute URLs instead of relative URLs.

Update the upload route to return full URL:

```typescript
// In src/app/api/upload/image/route.ts
const publicUrl = `${request.nextUrl.origin}/uploads/${fileName}`
```

This ensures the URL is always correct regardless of how Next.js serves files.
