import { NextRequest, NextResponse } from 'next/server'

// This route helps diagnose Vercel Blob Storage configuration
// Only enable in development or with proper authentication in production
export async function GET(request: NextRequest) {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  
  const isConfigured = !!blobToken
  
  const envCheck = {
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL === '1',
    vercelEnv: process.env.VERCEL_ENV,
    isConfigured,
    blobToken: blobToken ? 'SET' : 'NOT SET',
    blobTokenPreview: blobToken 
      ? `${blobToken.substring(0, 10)}...` 
      : 'NOT SET',
    blobTokenLength: blobToken?.length || 0,
  }
  
  return NextResponse.json({
    message: 'Vercel Blob Storage environment variable diagnostic',
    environment: envCheck,
    note: 'BLOB_READ_WRITE_TOKEN is automatically set when you create a Blob store in Vercel Dashboard → Storage. It is read at runtime from Vercel project settings.',
    troubleshooting: {
      ifNotConfigured: [
        '1. Go to Vercel Dashboard → Your Project → Storage tab',
        '2. Click "Create Database" or "Create Store" → Select "Blob"',
        '3. Create a new Blob store (or use existing one)',
        '4. The BLOB_READ_WRITE_TOKEN environment variable will be automatically added',
        '5. Variables are read at runtime, no rebuild needed (but redeploy to be safe)',
        '6. Make sure the Blob store is created for the correct environment (Production/Preview/Development)',
      ],
      ifStillNotWorking: [
        '1. Verify BLOB_READ_WRITE_TOKEN is visible in Vercel Dashboard → Settings → Environment Variables',
        '2. Make sure the variable is set for Production, Preview, AND Development if needed',
        '3. Try redeploying your Vercel project after creating the Blob store',
        '4. Check Vercel function logs for detailed error messages',
        '5. Verify your Blob store is active in Vercel Dashboard → Storage',
      ],
      howToCreateBlobStore: [
        '1. Sign in to https://vercel.com',
        '2. Go to your project → Storage tab',
        '3. Click "Create Database" or "+ Create" → Select "Blob"',
        '4. Name your Blob store (e.g., "scorched-fabrics-blob")',
        '5. Select which environments it applies to',
        '6. The token will be automatically configured',
      ],
    },
  })
}
