# Fix: 503 Service Unavailable Error on Hostinger

If you're getting `503 (Service Unavailable)` errors on your Hostinger hosting, this means the Next.js server is not running or not accessible. Here's how to fix it:

## Quick Fix Checklist

### 1. Check if Next.js Server is Running ⚡ (MOST COMMON)

**If using PM2:**
```bash
# Check PM2 status
pm2 status

# Check if your app is running
pm2 list

# If not running, start it:
cd /var/www/scorched-v2  # or your app directory
pm2 start npm --name "scorched-v2" -- start

# Or if already configured:
pm2 restart scorched-v2
```

**If using npm start directly:**
```bash
# Check if process is running
ps aux | grep node

# If not running, start it:
cd /var/www/scorched-v2
npm start
```

### 2. Check Application Logs

**PM2 logs:**
```bash
pm2 logs scorched-v2
# Or to see last 100 lines:
pm2 logs scorched-v2 --lines 100
```

**Check for errors:**
- Application crashes
- Port conflicts
- Missing environment variables
- Database connection issues

### 3. Verify Next.js is Running on Correct Port

Next.js by default runs on port 3000. Check if it's running:

```bash
# Check if port 3000 is in use
sudo lsof -i :3000

# Or
sudo netstat -tlnp | grep 3000

# If nothing is running on port 3000, start the app
```

### 4. Check Nginx Configuration

Your Nginx config should proxy to `localhost:3000`. Verify:

```bash
# Check Nginx config
sudo nano /etc/nginx/sites-available/scorched-v2

# Should have:
# proxy_pass http://localhost:3000;
```

**Test Nginx configuration:**
```bash
sudo nginx -t
```

**Restart Nginx:**
```bash
sudo systemctl restart nginx
```

### 5. Check Application Build

Make sure the application is built:

```bash
cd /var/www/scorched-v2

# Check if .next directory exists
ls -la .next

# If not, build the app:
npm run build

# Then start:
pm2 restart scorched-v2
```

### 6. Check Environment Variables

Missing environment variables can cause the app to crash:

```bash
# Check if .env.production exists
ls -la .env.production

# Check if required variables are set
cat .env.production

# If missing, create it:
nano .env.production
```

Required variables:
- `NODE_ENV=production`
- `GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Email service keys (Resend or SendGrid)

### 7. Check File Permissions

```bash
# Check app directory permissions
ls -la /var/www/scorched-v2

# Fix if needed (replace username with your user):
sudo chown -R $USER:$USER /var/www/scorched-v2
```

### 8. Check System Resources

Application might be crashing due to memory issues:

```bash
# Check memory usage
free -h

# Check disk space
df -h

# Check PM2 memory usage
pm2 monit
```

### 9. Check Firewall

Make sure port 3000 is accessible locally (for Nginx proxy):

```bash
# Check firewall status
sudo ufw status

# Port 3000 should be accessible locally (not blocked by firewall)
# But it doesn't need to be open to the internet (Nginx handles that)
```

### 10. Restart Everything

Sometimes a full restart helps:

```bash
# Restart PM2
pm2 restart all
pm2 save

# Restart Nginx
sudo systemctl restart nginx

# Check status
pm2 status
sudo systemctl status nginx
```

## Step-by-Step Diagnostic Process

1. **SSH into your server**

2. **Check if PM2 is running your app:**
   ```bash
   pm2 status
   ```
   - If app is listed and status is "online" → go to step 4
   - If app is not listed or status is "errored" → go to step 3

3. **Check logs for errors:**
   ```bash
   pm2 logs scorched-v2 --lines 50
   ```
   - Look for error messages
   - Common errors:
     - Port already in use
     - Missing environment variables
     - Build errors
     - Permission errors

4. **Check if port 3000 is accessible:**
   ```bash
   curl http://localhost:3000
   ```
   - If it works: Nginx configuration issue → check step 4
   - If it doesn't work: Next.js server issue → check step 3

5. **Check Nginx configuration:**
   ```bash
   sudo nginx -t
   sudo cat /etc/nginx/sites-available/scorched-v2
   ```
   - Verify `proxy_pass http://localhost:3000;` is correct

## Common Error Messages and Fixes

### "Port 3000 is already in use"
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or change port in package.json
# Add to scripts: "start": "next start -p 3001"
# Update Nginx: proxy_pass http://localhost:3001;
```

### "Cannot find module"
```bash
# Reinstall dependencies
cd /var/www/scorched-v2
rm -rf node_modules
npm install
npm run build
pm2 restart scorched-v2
```

### "Environment variables missing"
```bash
# Create .env.production file
nano .env.production
# Add all required variables
# Restart app
pm2 restart scorched-v2
```

### "Permission denied"
```bash
# Fix permissions
sudo chown -R $USER:$USER /var/www/scorched-v2
chmod -R 755 /var/www/scorched-v2
```

## Quick Fix Command Sequence

Run these commands in order:

```bash
# 1. Navigate to app directory
cd /var/www/scorched-v2

# 2. Check PM2 status
pm2 status

# 3. Check logs
pm2 logs scorched-v2 --lines 20

# 4. Rebuild if needed
npm run build

# 5. Restart PM2
pm2 restart scorched-v2

# 6. Check status again
pm2 status

# 7. Test locally
curl http://localhost:3000

# 8. Restart Nginx
sudo systemctl restart nginx
```

## Still Not Working?

1. **Check Hostinger control panel:**
   - Look for server status
   - Check resource usage
   - Verify Node.js is installed

2. **Try starting manually to see errors:**
   ```bash
   cd /var/www/scorched-v2
   npm start
   # Watch for error messages
   # Press Ctrl+C to stop
   ```

3. **Check Hostinger error logs:**
   ```bash
   # Nginx error logs
   sudo tail -f /var/log/nginx/error.log
   
   # System logs
   sudo journalctl -xe
   ```

4. **Verify Node.js version:**
   ```bash
   node --version
   # Should be 18+ for Next.js 16
   ```

## Prevention

To prevent this issue:

1. **Set up PM2 auto-restart:**
   ```bash
   pm2 startup
   pm2 save
   ```

2. **Monitor your application:**
   ```bash
   pm2 monit
   ```

3. **Set up logging:**
   - Check PM2 logs regularly
   - Set up log rotation
   - Monitor error rates
