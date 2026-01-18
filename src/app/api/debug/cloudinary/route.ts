import { NextRequest, NextResponse } from 'next/server'

// This route helps diagnose Cloudinary environment variable issues
// Only enable in development or with proper authentication in production
export async function GET(request: NextRequest) {
  // In production, you might want to add authentication here
  // For now, we'll allow it but you should secure this endpoint
  
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim()
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim()
  
  const isConfigured = !!(cloudName && apiKey && apiSecret)
  
  const envCheck = {
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL === '1',
    isConfigured,
    cloudName: cloudName ? 'SET' : 'NOT SET',
    apiKey: apiKey ? 'SET' : 'NOT SET',
    apiSecret: apiSecret ? 'SET' : 'NOT SET',
    cloudNamePreview: cloudName 
      ? `${cloudName.substring(0, 10)}...` 
      : 'NOT SET',
    apiKeyPreview: apiKey
      ? `${apiKey.substring(0, 10)}...`
      : 'NOT SET',
    apiSecretPreview: apiSecret
      ? `${apiSecret.substring(0, 10)}...`
      : 'NOT SET',
    // Show all Cloudinary-related env vars
    allCloudinaryVars: Object.keys(process.env)
      .filter(key => key.toUpperCase().includes('CLOUDINARY'))
      .reduce((acc: any, key) => {
        const value = process.env[key]
        acc[key] = value ? `${value.substring(0, 10)}... (length: ${value?.length})` : 'NOT SET'
        return acc
      }, {}),
  }
  
  return NextResponse.json({
    message: 'Cloudinary environment variable diagnostic',
    environment: envCheck,
    note: 'All Cloudinary variables are server-side only and read at runtime from Vercel project settings. They are NOT baked into the build. Set them in Vercel Dashboard → Settings → Environment Variables.',
    troubleshooting: {
      ifNotConfigured: [
        '1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables',
        '2. Add CLOUDINARY_CLOUD_NAME with your Cloudinary cloud name',
        '3. Add CLOUDINARY_API_KEY with your Cloudinary API key',
        '4. Add CLOUDINARY_API_SECRET with your Cloudinary API secret',
        '5. Verify variable names are exactly as shown (case-sensitive)',
        '6. Variables are read at runtime, no rebuild needed (but redeploy to be safe)',
        '7. Get your credentials from https://cloudinary.com/console',
      ],
      ifStillNotWorking: [
        '1. Double-check variable names are exactly: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET',
        '2. Make sure there are no extra spaces in the variable values',
        '3. Try redeploying your Vercel project after adding variables',
        '4. Check Vercel function logs for detailed error messages',
        '5. Verify your Cloudinary account is active and credentials are correct',
      ],
      howToGetCredentials: [
        '1. Sign up/login at https://cloudinary.com',
        '2. Go to Dashboard',
        '3. Copy your Cloud Name, API Key, and API Secret',
        '4. Add them to Vercel as environment variables',
      ],
    },
  })
}
