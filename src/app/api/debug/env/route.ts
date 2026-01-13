import { NextRequest, NextResponse } from 'next/server'

// This route helps diagnose environment variable issues
// Only enable in development or with proper authentication in production
export async function GET(request: NextRequest) {
  // In production, you might want to add authentication here
  // For now, we'll allow it but you should secure this endpoint
  
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Check environment variables
  const envCheck = {
    nodeEnv: process.env.NODE_ENV,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET',
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'SET' : 'NOT SET',
    stripePublishableKeyPreview: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
      ? `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 20)}...` 
      : 'NOT SET',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT SET',
  }
  
  return NextResponse.json({
    message: 'Environment variable diagnostic',
    environment: envCheck,
    note: isProduction 
      ? 'In production, NEXT_PUBLIC_* vars must be set BEFORE building and embedded in the client bundle'
      : 'In development, these should be in .env.local',
    troubleshooting: {
      ifPublishableKeyNotSet: [
        '1. Check .env.production file exists on server',
        '2. Verify variable name is exactly: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
        '3. Make sure there are NO leading spaces in .env.production',
        '4. Rebuild the app: npm run build (NEXT_PUBLIC_* vars are embedded at build time)',
        '5. Restart PM2: pm2 restart scorched-v2',
      ],
      ifSecretKeyNotSet: [
        '1. Check .env.production file exists on server',
        '2. Verify variable name is exactly: STRIPE_SECRET_KEY',
        '3. Make sure there are NO leading spaces in .env.production',
        '4. Restart PM2: pm2 restart scorched-v2 (server-side vars work at runtime)',
      ],
    },
  })
}
