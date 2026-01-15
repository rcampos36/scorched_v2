import { NextRequest, NextResponse } from 'next/server'

// This route helps diagnose environment variable issues
// Only enable in development or with proper authentication in production
export async function GET(request: NextRequest) {
  // In production, you might want to add authentication here
  // For now, we'll allow it but you should secure this endpoint
  
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Check environment variables (read from Hostinger hosting at runtime)
  const paypalClientId = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const envCheck = {
    nodeEnv: process.env.NODE_ENV,
    paypalClientId: paypalClientId ? 'SET' : 'NOT SET',
    paypalClientIdName: process.env.PAYPAL_CLIENT_ID ? 'PAYPAL_CLIENT_ID' : (process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? 'NEXT_PUBLIC_PAYPAL_CLIENT_ID' : 'NOT SET'),
    paypalClientIdPreview: paypalClientId 
      ? `${paypalClientId.substring(0, 20)}...` 
      : 'NOT SET',
    paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET ? 'SET' : 'NOT SET',
    paypalEnvironment: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
  }
  
  return NextResponse.json({
    message: 'Environment variable diagnostic',
    environment: envCheck,
    note: 'Environment variables are read at runtime from Hostinger hosting, not from .env files',
    troubleshooting: {
      ifClientIdNotSet: [
        '1. Set PAYPAL_CLIENT_ID in your Hostinger hosting environment variables',
        '2. Verify variable name is exactly: PAYPAL_CLIENT_ID (or NEXT_PUBLIC_PAYPAL_CLIENT_ID as fallback)',
        '3. Restart the application: pm2 restart scorched-v2',
        '4. Variables are read at runtime, no rebuild needed',
      ],
      ifClientSecretNotSet: [
        '1. Set PAYPAL_CLIENT_SECRET in your Hostinger hosting environment variables',
        '2. Verify variable name is exactly: PAYPAL_CLIENT_SECRET',
        '3. Restart the application: pm2 restart scorched-v2',
        '4. Variables are read at runtime, no rebuild needed',
      ],
      environment: [
        'Set PAYPAL_ENVIRONMENT to "production" for live mode, or leave unset/empty for "sandbox" mode',
      ],
    },
  })
}
