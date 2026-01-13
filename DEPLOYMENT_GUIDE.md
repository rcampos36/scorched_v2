# Deployment Guide - Preserving Uploads

## The Problem

When you deploy changes, uploaded images in `public/uploads/` get reset because:
1. The `uploads` folder is **gitignored** (correctly - you don't want to commit user uploads)
2. When you do `git pull`, git doesn't preserve gitignored files
3. The folder structure might get recreated, losing your uploaded images

## Quick Answer

**You DON'T need to run `npm run build` every time!**

### When to Build:
- ✅ Dependencies changed (`package.json` or `package-lock.json` modified)
- ✅ Next.js config changed (`next.config.ts` modified)
- ✅ TypeScript config changed (`tsconfig.json` modified)
- ✅ First deployment or after major changes

### When to Just Restart:
- ✅ Code changes only (components, pages, API routes)
- ✅ CSS/styling changes
- ✅ Content changes in JSON data files
- ✅ Simple bug fixes

## Solution: Use the Deployment Script

I've created a `deploy.sh` script that:
1. **Backs up** your uploads folder before pulling
2. **Pulls** latest changes from git
3. **Restores** your uploads folder
4. **Checks** if rebuild is needed
5. **Restarts** your application

### Setup

1. **Make the script executable:**
   ```bash
   chmod +x deploy.sh
   ```

2. **Run the deployment:**
   ```bash
   ./deploy.sh
   ```

## Manual Deployment (If You Prefer)

### Option 1: Quick Deploy (Code Changes Only)

For simple code changes, you can just pull and restart:

```bash
# 1. Backup uploads (IMPORTANT!)
cp -r public/uploads /tmp/uploads-backup

# 2. Pull changes
git pull

# 3. Restore uploads
mkdir -p public/uploads
cp -r /tmp/uploads-backup/* public/uploads/

# 4. Restart (no build needed)
pm2 restart scorched-v2
```

### Option 2: Full Deploy (Dependencies/Config Changed)

If you changed dependencies or config files:

```bash
# 1. Backup uploads
cp -r public/uploads /tmp/uploads-backup

# 2. Pull changes
git pull

# 3. Restore uploads
mkdir -p public/uploads
cp -r /tmp/uploads-backup/* public/uploads/

# 4. Install dependencies (if package.json changed)
npm install

# 5. Build
npm run build

# 6. Restart
pm2 restart scorched-v2
```

## Understanding the Build Process

### What `npm run build` Does:
- Compiles TypeScript to JavaScript
- Optimizes images
- Bundles JavaScript and CSS
- Generates static pages
- Creates the `.next` folder

### When Build is Required:
- **Dependencies**: New packages need to be bundled
- **Config**: Next.js needs to rebuild with new settings
- **TypeScript**: Type changes need compilation

### When Build is NOT Required:
- **Code changes**: React components, pages, API routes
- **Styling**: CSS changes
- **Data**: JSON file updates

## Best Practices

### 1. Always Backup Uploads Before Deploying

```bash
# Quick backup
cp -r public/uploads /tmp/uploads-backup-$(date +%Y%m%d)
```

### 2. Use the Deployment Script

The `deploy.sh` script handles everything automatically:
```bash
./deploy.sh
```

### 3. Check What Changed

Before deploying, check what files changed:
```bash
git diff HEAD@{1} HEAD --name-only
```

This tells you if you need to rebuild or just restart.

### 4. Test After Deployment

After deploying:
1. Check that images still load
2. Test upload functionality
3. Verify the changes you made work

## Alternative: Use Cloud Storage

For production, consider using cloud storage instead of local filesystem:

- **AWS S3** - See `IMAGE_UPLOAD_SETUP.md`
- **Cloudinary** - See `IMAGE_UPLOAD_SETUP.md`
- **Vercel Blob** - See `IMAGE_UPLOAD_SETUP.md`

**Benefits:**
- ✅ Images persist across deployments
- ✅ No need to backup/restore
- ✅ Better performance (CDN)
- ✅ Scalable storage

## Troubleshooting

### Images Still Missing After Deploy?

1. **Check if files exist:**
   ```bash
   ls -la public/uploads/
   ```

2. **Check permissions:**
   ```bash
   chmod 755 public/uploads
   chmod 644 public/uploads/*
   ```

3. **Restart Next.js:**
   ```bash
   pm2 restart scorched-v2
   ```

4. **Check Nginx config** (if using Nginx):
   - Make sure `/uploads` location is configured
   - See `PRODUCTION_IMAGE_FIX.md` for details

### Build Fails?

1. **Clear cache:**
   ```bash
   rm -rf .next
   npm run build
   ```

2. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

## Summary

- ✅ **Use `deploy.sh`** for automatic deployment with uploads preservation
- ✅ **Only build** when dependencies/config change
- ✅ **Just restart** for code-only changes
- ✅ **Always backup** uploads before deploying
- ✅ **Consider cloud storage** for production
