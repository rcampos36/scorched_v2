# Quick Deployment Reference

## The Problem You Asked About

**Q: Why do images get reset when I deploy?**
- The `public/uploads/` folder is gitignored (correctly)
- When you do `git pull`, git doesn't preserve gitignored files
- Your uploaded images get lost

**Q: Do I need to run `npm run build` every time?**
- **NO!** Only when dependencies or config files change
- For code changes, just restart the server

## Quick Solution

### Use the Deployment Script (Easiest)

```bash
./deploy.sh
```

That's it! The script handles everything:
- ✅ Backs up uploads
- ✅ Pulls changes
- ✅ Restores uploads
- ✅ Checks if rebuild needed
- ✅ Restarts server

### Manual Quick Deploy (Code Changes Only)

```bash
# Backup uploads
cp -r public/uploads /tmp/uploads-backup

# Pull changes
git pull

# Restore uploads
mkdir -p public/uploads
cp -r /tmp/uploads-backup/* public/uploads/

# Restart (no build needed!)
pm2 restart scorched-v2
```

### Full Deploy (Dependencies Changed)

```bash
# Backup uploads
cp -r public/uploads /tmp/uploads-backup

# Pull changes
git pull

# Restore uploads
mkdir -p public/uploads
cp -r /tmp/uploads-backup/* public/uploads/

# Install & build (only if package.json changed)
npm install
npm run build

# Restart
pm2 restart scorched-v2
```

## When to Build vs Restart

| Change Type | Action |
|------------|--------|
| Component code | Just restart |
| Page code | Just restart |
| API route code | Just restart |
| CSS/styling | Just restart |
| JSON data files | Just restart |
| `package.json` | Install + Build + Restart |
| `next.config.ts` | Build + Restart |
| `tsconfig.json` | Build + Restart |

## Files Created

- ✅ `deploy.sh` - Automated deployment script
- ✅ `DEPLOYMENT_GUIDE.md` - Detailed guide
- ✅ `QUICK_DEPLOY.md` - This quick reference

## Next Steps

1. **Make script executable** (if not already):
   ```bash
   chmod +x deploy.sh
   ```

2. **Use it for your next deployment:**
   ```bash
   ./deploy.sh
   ```

3. **For production, consider cloud storage** (see `IMAGE_UPLOAD_SETUP.md`):
   - Images persist automatically
   - No backup/restore needed
   - Better performance
