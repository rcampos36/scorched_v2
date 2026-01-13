# Data Files Reset Issue - Fixed!

## The Problem

When you deploy code changes, your production data gets reset because:

1. **JSON files are tracked by git** - Files in `/data` like:
   - `hero-slides.json`
   - `best-selling.json`
   - `about-us.json`
   - `orders.json`
   - etc.

2. **When you do `git pull`** - Git overwrites these files with whatever is in the repository

3. **Result:** All your production changes (images, content, orders) get lost!

## Why This Happens

```
Production Server:
├── You add images via admin panel
├── Images saved to: public/uploads/
├── Image paths saved to: data/hero-slides.json
└── You make code changes

Deployment:
├── git pull ← Overwrites data/*.json with old versions!
├── Your production changes are lost
└── Images still exist but paths are wrong/old
```

## The Solution

I've updated `deploy.sh` to:

1. ✅ **Backup JSON files** before `git pull`
2. ✅ **Backup uploads folder** before `git pull`
3. ✅ **Pull code changes** from git
4. ✅ **Restore JSON files** after `git pull`
5. ✅ **Restore uploads folder** after `git pull`

## Updated Deployment Script

The `deploy.sh` script now preserves:

- ✅ **Uploads folder** (`public/uploads/`)
- ✅ **Data files** (`data/*.json`)
- ✅ **Your production changes**

## How to Use

### Option 1: Use the Updated Script (Recommended)

```bash
./deploy.sh
```

This will:
1. Backup your uploads and data files
2. Pull code changes
3. Restore your uploads and data files
4. Restart the server

### Option 2: Manual Backup (If You Prefer)

```bash
# 1. Backup everything
cp -r public/uploads /tmp/uploads-backup
cp -r data /tmp/data-backup

# 2. Pull changes
git pull

# 3. Restore everything
mkdir -p public/uploads data
cp -r /tmp/uploads-backup/* public/uploads/
cp -r /tmp/data-backup/* data/

# 4. Restart
pm2 restart scorched-v2
```

## What Gets Preserved

### ✅ Preserved (Backed up and restored):
- Uploaded images (`public/uploads/`)
- Hero slides data (`data/hero-slides.json`)
- Products data (`data/best-selling.json`)
- About us data (`data/about-us.json`)
- Gallery data (`data/image-gallery.json`)
- Footer data (`data/footer.json`)
- Header data (`data/header.json`)
- How it works data (`data/how-it-works.json`)
- Orders data (`data/orders.json`)
- Users data (`data/users.json`)
- Admins data (`data/admins.json`)

### ⚠️ Not Preserved (Gitignored):
- Newsletter subscriptions (`data/newsletter-subscriptions.json`)
  - This is gitignored and will be lost on `git pull`
  - Consider backing this up separately if needed

## Why JSON Files Are in Git

The JSON files are committed to git because:
- They contain initial/default data
- They serve as templates for new deployments
- They ensure the app has data to start with

**But in production**, you want to preserve your changes, not reset to defaults!

## Alternative Solutions

### Option 1: Keep Current Setup (Recommended)
- Use `deploy.sh` to preserve data files
- Simple and works well

### Option 2: Move Data to Database
- Migrate from JSON files to PostgreSQL/MySQL
- Data persists automatically
- Better for production scale
- More complex setup

### Option 3: Use Cloud Storage
- Move images to S3/Cloudinary
- Images persist automatically
- Better performance
- See `IMAGE_UPLOAD_SETUP.md`

## Testing the Fix

1. **Make some changes in production:**
   - Add a new hero slide
   - Upload an image
   - Update product data

2. **Deploy code changes:**
   ```bash
   ./deploy.sh
   ```

3. **Verify changes are preserved:**
   - Check hero slides still show your images
   - Check products still have your updates
   - Check admin panel shows your data

## Troubleshooting

### If data still gets reset:

1. **Check if you're using the script:**
   ```bash
   # Make sure you're using deploy.sh, not just git pull
   ./deploy.sh
   ```

2. **Check backup was created:**
   ```bash
   # The script creates a temp backup
   # If it fails, check the error messages
   ```

3. **Check file permissions:**
   ```bash
   ls -la data/
   chmod 644 data/*.json
   ```

4. **Check git status:**
   ```bash
   git status
   # Make sure you're not in a weird state
   ```

## Summary

**Problem:** `git pull` overwrites production JSON files  
**Solution:** `deploy.sh` now backs up and restores data files  
**Result:** Your production changes are preserved! ✅

Always use `./deploy.sh` instead of just `git pull` to preserve your data!
