# Image Upload Setup Guide

## Problem

On Vercel (and other serverless platforms), the filesystem is **read-only** except for `/tmp`. This means you cannot write files to `/public/uploads` in production. The current file upload implementation will fail on Vercel with "Failed to upload image" error.

**Current Status:** The upload routes have been updated to detect Vercel and return a helpful error message. To fix the upload functionality, you need to implement cloud storage.

## Solution: Use Cloud Storage

You need to configure cloud storage for image uploads. Here are recommended options:

### Option 1: Vercel Blob Storage (Recommended for Vercel)

Vercel Blob Storage is the easiest solution for Vercel deployments.

#### Setup:

1. **Install Vercel Blob package:**
   ```bash
   npm install @vercel/blob
   ```

2. **Create a Blob Store:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Navigate to your project → Storage → Create Database
   - Select "Blob" and create a store

3. **Get your token:**
   - Go to your project settings
   - Navigate to Storage → Your Blob Store
   - Copy the `BLOB_READ_WRITE_TOKEN`

4. **Add environment variable:**
   - In Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `BLOB_READ_WRITE_TOKEN` = `your_token_here`

5. **Update upload routes:**
   - See example file: `src/app/api/upload/image-vercel-blob.ts.example`
   - Replace the content of `/api/upload/image/route.ts` with the Vercel Blob implementation
   - Also update `/api/upload/customer-image/route.ts`

#### Quick Implementation Steps:

1. Install the package:
   ```bash
   npm install @vercel/blob
   ```

2. Replace `/src/app/api/upload/image/route.ts` with this code:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authCookie = request.cookies.get('admin-auth')
    if (!authCookie || authCookie.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images (JPEG, PNG, WebP, GIF) are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}-${sanitizedFileName}`

    // Upload to Vercel Blob
    const blob = await put(fileName, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return NextResponse.json({ 
      success: true, 
      url: blob.url,
      fileName: fileName
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    )
  }
}
```

### Option 2: AWS S3

#### Setup:

1. **Install AWS SDK:**
   ```bash
   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
   ```

2. **Create S3 Bucket:**
   - Go to AWS S3 Console
   - Create a new bucket
   - Configure CORS and public access as needed

3. **Create IAM User:**
   - Create IAM user with S3 permissions
   - Generate access keys

4. **Add environment variables:**
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `AWS_S3_BUCKET_NAME`

5. **Update upload routes** to use S3 SDK

### Option 3: Cloudinary

#### Setup:

1. **Install Cloudinary:**
   ```bash
   npm install cloudinary
   ```

2. **Create Cloudinary Account:**
   - Sign up at [cloudinary.com](https://cloudinary.com)
   - Get your API credentials

3. **Add environment variables:**
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

4. **Update upload routes** to use Cloudinary SDK

#### Example Implementation:

```typescript
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// In your upload route:
const bytes = await file.arrayBuffer()
const buffer = Buffer.from(bytes)

const result = await new Promise((resolve, reject) => {
  cloudinary.uploader.upload_stream(
    { folder: 'uploads' },
    (error, result) => {
      if (error) reject(error)
      else resolve(result)
    }
  ).end(buffer)
})

return NextResponse.json({ 
  success: true, 
  url: result.secure_url,
  fileName: result.public_id
})
```

## Quick Fix: Vercel Blob (Simplest)

For the quickest fix, use Vercel Blob Storage:

1. Install: `npm install @vercel/blob`
2. Create Blob store in Vercel Dashboard
3. Add `BLOB_READ_WRITE_TOKEN` environment variable
4. Update both upload routes (`/api/upload/image` and `/api/upload/customer-image`) to use Vercel Blob

## Files That Need Updating

- `/src/app/api/upload/image/route.ts` - Admin image uploads
- `/src/app/api/upload/customer-image/route.ts` - Customer image uploads

Both files currently use filesystem writes which don't work on Vercel.

## Testing

After implementing cloud storage:

1. Test admin image uploads in the dashboard
2. Test customer image uploads in the product customization modal
3. Verify images are accessible via the returned URLs
4. Check that images persist after deployment

## Cost Considerations

- **Vercel Blob**: Free tier includes 256 MB storage, 1 GB bandwidth/month
- **AWS S3**: Very affordable, pay-as-you-go (first 5GB free)
- **Cloudinary**: Free tier includes 25 GB storage, 25 GB bandwidth/month

Choose based on your expected usage and preferences.
