# Why Images Get Deleted When You Deploy

## The Root Cause

When you add an image through the admin panel, it gets saved to:
```
public/uploads/admin-1234567890-filename.jpg
```

**The problem:** This folder is **gitignored** (see `.gitignore` line 28):
```
/public/uploads/*
```

This means:
- ✅ Images are **NOT** committed to git (correct - you don't want to commit user uploads)
- ❌ When you do `git pull`, git **doesn't preserve** gitignored files
- ❌ Your uploaded images get **lost** during deployment

## What Happens During Deployment

### Current Process (Problematic):
```bash
git pull          # ← This overwrites your local files
npm run build     # ← Next.js doesn't delete uploads, but git pull already did
pm2 restart       # ← Server restarts, but images are already gone
```

**Result:** Images are deleted because `git pull` doesn't preserve gitignored files.

### Why Git Pull Deletes Them

When you do `git pull`:
1. Git checks out the latest code from the repository
2. Git **only preserves files that are tracked** (committed)
3. Gitignored files (like `public/uploads/*`) are **not preserved**
4. If the folder structure changes or gets recreated, your images are gone

## The Solution

### Option 1: Use the Deployment Script (Recommended)

I've created `deploy.sh` that automatically preserves your uploads:

```bash
./deploy.sh
```

**What it does:**
1. ✅ Backs up `public/uploads/` before pulling
2. ✅ Pulls latest code changes
3. ✅ Restores `public/uploads/` after pulling
4. ✅ Checks if rebuild is needed
5. ✅ Restarts the server

### Option 2: Manual Backup Before Deploying

**Before deploying:**
```bash
# 1. Backup uploads folder
cp -r public/uploads /tmp/uploads-backup

# 2. Pull changes
git pull

# 3. Restore uploads
mkdir -p public/uploads
cp -r /tmp/uploads-backup/* public/uploads/

# 4. Restart (or build if needed)
pm2 restart scorched-v2
```

### Option 3: Use Cloud Storage (Best for Production)

For production, use cloud storage instead of local filesystem:

- **AWS S3** - See `IMAGE_UPLOAD_SETUP.md`
- **Cloudinary** - See `IMAGE_UPLOAD_SETUP.md`
- **Vercel Blob** - See `IMAGE_UPLOAD_SETUP.md`

**Benefits:**
- ✅ Images persist automatically (not affected by deployments)
- ✅ No backup/restore needed
- ✅ Better performance (CDN)
- ✅ Scalable storage
- ✅ Works with serverless hosting

## Understanding the Build Process

**Important:** `npm run build` does **NOT** delete your uploads folder!

- Next.js build process only touches:
  - `.next/` folder (build output)
  - `out/` folder (if static export)
  - `public/` folder is **copied as-is** (not modified)

**The real culprit is `git pull`**, not the build process.

## Quick Fix Right Now

If you just deployed and lost images:

1. **Check if you have a backup:**
   ```bash
   ls -la /tmp/uploads-backup/
   ```

2. **If backup exists, restore:**
   ```bash
   cp -r /tmp/uploads-backup/* public/uploads/
   ```

3. **If no backup, images are lost** (sorry!)
   - You'll need to re-upload them through the admin panel
   - **Use the deployment script next time** to prevent this

## Prevention Checklist

- [ ] Use `./deploy.sh` for all deployments
- [ ] Or manually backup uploads before `git pull`
- [ ] Consider migrating to cloud storage for production
- [ ] Set up automated backups of the uploads folder

## Summary

**Why images get deleted:**
- `public/uploads/` is gitignored (correctly)
- `git pull` doesn't preserve gitignored files
- Images get lost during deployment

**How to fix:**
- ✅ Use `./deploy.sh` (automatically preserves uploads)
- ✅ Or manually backup/restore before/after `git pull`
- ✅ Or use cloud storage (best for production)

**Remember:** The build process (`npm run build`) is NOT the problem - it's `git pull` that deletes your images!
