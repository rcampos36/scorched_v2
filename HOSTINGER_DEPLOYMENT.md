# Hostinger Deployment Guide

This guide will help you deploy your Next.js application to Hostinger hosting.

## Important: Hostinger Hosting Types

Hostinger offers different hosting types. Choose the method based on what you have:

1. **Shared Hosting** - Limited Node.js support, not ideal for Next.js
2. **VPS Hosting** - Full control, can deploy Node.js apps
3. **Cloud Hosting** - Better performance, supports Node.js

## Option 1: VPS/Cloud Hosting (Recommended)

If you have VPS or Cloud hosting with Node.js support, follow these steps:

### Prerequisites

- Hostinger VPS or Cloud account
- SSH access enabled
- Node.js 18+ installed on the server
- Domain or subdomain pointed to your server IP

### Step 1: Prepare Your Application

1. **Build your application locally:**
   ```bash
   npm run build
   ```

2. **Test the build:**
   ```bash
   npm start
   ```

### Step 2: Connect to Your Server

1. **Connect via SSH:**
   ```bash
   ssh username@your-server-ip
   ```
   
   Or if you have a domain:
   ```bash
   ssh username@your-domain.com
   ```

   (Use the credentials from your Hostinger control panel)

### Step 3: Set Up the Server

1. **Install Node.js (if not already installed):**
   ```bash
   # Update system packages
   sudo apt update
   
   # Install Node.js 20.x (LTS)
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Verify installation
   node --version
   npm --version
   ```

2. **Install PM2 (Process Manager):**
   ```bash
   sudo npm install -g pm2
   ```

3. **Install Nginx (Reverse Proxy):**
   ```bash
   sudo apt install nginx
   ```

### Step 4: Upload Your Application

**Option A: Using Git (Recommended)**

1. **Install Git on server:**
   ```bash
   sudo apt install git
   ```

2. **Clone your repository:**
   ```bash
   cd /var/www
   sudo git clone https://github.com/yourusername/scorched_v2.git
   sudo chown -R $USER:$USER scorched_v2
   cd scorched_v2
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

**Option B: Using SFTP/FileZilla**

1. **Connect to your server via SFTP:**
   - Host: `your-server-ip` or `your-domain.com`
   - Username: Your SSH username
   - Password: Your SSH password
   - Port: 22

2. **Upload your project folder:**
   - Navigate to `/var/www` (or your preferred directory)
   - Upload your entire project folder

3. **Set permissions:**
   ```bash
   cd /var/www/scorched_v2
   sudo chown -R $USER:$USER .
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

### Step 5: Configure Environment Variables

1. **Create `.env.production` file:**
   ```bash
   nano .env.production
   ```

2. **Add your environment variables:**
   ```env
   NODE_ENV=production
   PORT=3000
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   
   # Stripe
   STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
   
   # Email (Resend or SendGrid)
   RESEND_API_KEY=re_your_resend_api_key
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   
   # File Uploads (you'll need cloud storage or configure local storage)
   # For local storage on VPS, you can use the filesystem
   # Or use cloud storage like S3, Cloudinary, etc.
   ```

3. **Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

### Step 6: Build and Start Your Application

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start with PM2:**
   ```bash
   pm2 start npm --name "scorched-v2" -- start
   ```

3. **Save PM2 configuration:**
   ```bash
   pm2 save
   pm2 startup
   ```
   (Follow the instructions to enable auto-start on reboot)

4. **Check status:**
   ```bash
   pm2 status
   pm2 logs scorched-v2
   ```

### Step 7: Configure Nginx as Reverse Proxy

1. **Create Nginx configuration:**
   ```bash
   sudo nano /etc/nginx/sites-available/scorched-v2
   ```

2. **Add this configuration:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;

       # Serve uploads directly from file system (IMPORTANT: Must come before location /)
       location /uploads {
           alias /var/www/scorched_v2/public/uploads;
           expires 30d;
           add_header Cache-Control "public, immutable";
           add_header Access-Control-Allow-Origin *;
           
           # Fallback to Next.js if file doesn't exist
           try_files $uri @nextjs;
       }

       # Serve Next.js static files (chunks, assets, etc.)
       # This is critical for Next.js to work properly
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
           
           # Override CSP to allow React, Google Fonts, and event handlers
           # Note: This is needed if your hosting provider sets restrictive CSP headers
           # The 'always' flag ensures this header is added even if Next.js sets one
           add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' 'unsafe-hashes'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self';" always;
       }

       # Fallback location for Next.js (if uploads file not found)
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

   **Important:** 
   - Replace `your-domain.com` with your actual domain
   - Replace `/var/www/scorched_v2` with your actual application path
   - The `/uploads` location block MUST come before the `location /` block

3. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/scorched-v2 /etc/nginx/sites-enabled/
   ```

4. **Test Nginx configuration:**
   ```bash
   sudo nginx -t
   ```

5. **Restart Nginx:**
   ```bash
   sudo systemctl restart nginx
   ```

### Step 8: Set Up SSL Certificate (HTTPS)

1. **Install Certbot:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Get SSL certificate:**
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

3. **Test auto-renewal:**
   ```bash
   sudo certbot renew --dry-run
   ```

### Step 9: Configure File Uploads

**✅ Image uploads are now configured for local filesystem storage!** The code has been updated to work on Hostinger VPS.

1. **Create uploads directory:**
   ```bash
   cd /var/www/scorched-v2
   mkdir -p public/uploads
   chmod 755 public/uploads
   ```

2. **Verify permissions:**
   ```bash
   ls -la public/uploads
   # Should show drwxr-xr-x permissions
   ```

3. **That's it!** The upload routes are already configured to:
   - Save files to `public/uploads` directory
   - Return URLs like `/uploads/filename.jpg`
   - Work automatically on VPS hosting (Hostinger)

**Optional: Use Cloud Storage (For Production Scale)**

If you expect high traffic or need better performance, consider using cloud storage:
- AWS S3 - see `IMAGE_UPLOAD_SETUP.md`
- Cloudinary - see `IMAGE_UPLOAD_SETUP.md`

Local filesystem storage works great for VPS hosting and doesn't require additional services or API keys.

### Step 10: Configure Firewall

1. **Allow HTTP, HTTPS, and SSH:**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

## Option 2: Shared Hosting (Limited)

If you only have shared hosting, Next.js deployment is **not recommended** because:
- Shared hosting typically doesn't support Node.js well
- No SSH access usually
- Limited server control

### Alternative Options for Shared Hosting:

1. **Export as Static Site (Limited Functionality)**
   - Only works if you don't need API routes
   - Most of your features won't work (auth, payments, uploads)

2. **Use a Free Alternative:**
   - **Vercel** (recommended for Next.js) - Free tier available
   - **Netlify** - Free tier available
   - **Railway** - Free tier available
   - **Render** - Free tier available

3. **Upgrade to VPS:**
   - Hostinger VPS starts at low cost
   - Full control for deploying Node.js apps

## Troubleshooting

### Application won't start

1. **Check Node.js version:**
   ```bash
   node --version  # Should be 18+
   ```

2. **Check logs:**
   ```bash
   pm2 logs scorched-v2
   ```

3. **Check if port is in use:**
   ```bash
   sudo lsof -i :3000
   ```

### Can't access the site

1. **Check Nginx status:**
   ```bash
   sudo systemctl status nginx
   ```

2. **Check PM2 status:**
   ```bash
   pm2 status
   ```

3. **Check firewall:**
   ```bash
   sudo ufw status
   ```

### File uploads not working

1. **Check directory permissions:**
   ```bash
   ls -la public/uploads
   chmod 755 public/uploads
   ```

2. **Check disk space:**
   ```bash
   df -h
   ```

### Environment variables not working

1. **Verify .env file exists:**
   ```bash
   cat .env.production
   ```

2. **Restart PM2:**
   ```bash
   pm2 restart scorched-v2
   ```

## Maintenance

### Update Your Application

1. **Pull latest changes (if using Git):**
   ```bash
   cd /var/www/scorched-v2
   git pull
   npm install
   npm run build
   pm2 restart scorched-v2
   ```

2. **Or upload new files via SFTP and rebuild**

### View Logs

```bash
# Application logs
pm2 logs scorched-v2

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Backup

1. **Backup your application:**
   ```bash
   tar -czf backup-$(date +%Y%m%d).tar.gz /var/www/scorched-v2
   ```

2. **Backup your database** (if using one):
   ```bash
   # Your database backup command here
   ```

## Important Notes

1. **Image Uploads**: For production, consider using cloud storage (S3, Cloudinary) instead of local filesystem storage
2. **Database**: If you need a database, install PostgreSQL or MySQL on your VPS, or use a managed database service
3. **Email Service**: Make sure to configure email service (Resend or SendGrid) for production
4. **Stripe**: Use live API keys (not test keys) in production
5. **Domain**: Point your domain's A record to your VPS IP address in your domain's DNS settings

## Recommended Next Steps

1. Set up monitoring (PM2 monitoring or external service)
2. Configure automatic backups
3. Set up CI/CD pipeline (GitHub Actions) for automated deployments
4. Use cloud storage for file uploads
5. Set up a database for production data (instead of JSON files)

## Getting Help

- Hostinger Support: https://www.hostinger.com/contact
- PM2 Documentation: https://pm2.keymetrics.io/
- Nginx Documentation: https://nginx.org/en/docs/
