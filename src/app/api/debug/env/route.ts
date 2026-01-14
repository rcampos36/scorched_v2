import { NextRequest, NextResponse } from 'next/server'

// This route helps diagnose environment variable issues
// Only enable in development or with proper authentication in production
export async function GET(request: NextRequest) {
  // In production, you might want to add authentication here
  // For now, we'll allow it but you should secure this endpoint
  
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Check environment variables (read from Hostinger hosting at runtime)
  const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  const envCheck = {
    nodeEnv: process.env.NODE_ENV,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET',
    stripePublishableKey: stripePublishableKey ? 'SET' : 'NOT SET',
    stripePublishableKeyName: process.env.STRIPE_PUBLISHABLE_KEY ? 'STRIPE_PUBLISHABLE_KEY' : (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY' : 'NOT SET'),
    stripePublishableKeyPreview: stripePublishableKey 
      ? `${stripePublishableKey.substring(0, 20)}...` 
      : 'NOT SET',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT SET',
  }
  
  return NextResponse.json({
    message: 'Environment variable diagnostic',
    environment: envCheck,
    note: 'Environment variables are read at runtime from Hostinger hosting, not from .env files',
    troubleshooting: {
      ifPublishableKeyNotSet: [
        '1. Set STRIPE_PUBLISHABLE_KEY in your Hostinger hosting environment variables',
        '2. Verify variable name is exactly: STRIPE_PUBLISHABLE_KEY (or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as fallback)',
        '3. Restart the application: pm2 restart scorched-v2',
        '4. Variables are read at runtime, no rebuild needed',
      ],
      ifSecretKeyNotSet: [
        '1. Set STRIPE_SECRET_KEY in your Hostinger hosting environment variables',
        '2. Verify variable name is exactly: STRIPE_SECRET_KEY',
        '3. Restart the application: pm2 restart scorched-v2',
        '4. Variables are read at runtime, no rebuild needed',
      ],
    },
  })
}
