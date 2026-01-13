# Why Your Admin Panel Images Get Deleted

## Simple Explanation

```
┌─────────────────────────────────────────────────────────┐
│  You add image via admin panel                          │
│  ↓                                                       │
│  Image saved to: public/uploads/admin-123-image.jpg     │
│  ↓                                                       │
│  .gitignore says: "Don't commit /public/uploads/*"      │
│  (This is CORRECT - you don't want to commit uploads)   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  You deploy changes:                                     │
│  ↓                                                       │
│  git pull                                                │
│  ↓                                                       │
│  Git: "I only preserve files that are tracked"           │
│  Git: "uploads/* is gitignored, so I'll ignore it"      │
│  ↓                                                       │
│  ❌ Your images get deleted!                            │
└─────────────────────────────────────────────────────────┘
```

## The Fix

### Use the Deployment Script

```bash
./deploy.sh
```

**What happens:**
```
1. Backup: public/uploads/ → /tmp/backup
2. Pull: git pull (images get deleted)
3. Restore: /tmp/backup → public/uploads/
4. Build: npm run build (if needed)
5. Restart: pm2 restart
```

**Result:** ✅ Images are preserved!

## Quick Reference

| Action | Images Preserved? |
|--------|------------------|
| `git pull` alone | ❌ NO - Images deleted |
| `./deploy.sh` | ✅ YES - Images preserved |
| Manual backup/restore | ✅ YES - If done correctly |
| Cloud storage | ✅ YES - Always preserved |

## Next Steps

1. **Use `./deploy.sh` for all future deployments**
2. **Or manually backup before `git pull`**
3. **Consider cloud storage for production** (see `IMAGE_UPLOAD_SETUP.md`)
