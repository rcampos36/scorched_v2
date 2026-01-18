import { NextRequest, NextResponse } from 'next/server'

// This route helps diagnose environment variable issues
// Only enable in development or with proper authentication in production
export async function GET(request: NextRequest) {
  // In production, you might want to add authentication here
  // For now, we'll allow it but you should secure this endpoint
  
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Check environment variables (read from Vercel at runtime - all server-side only)
  const paypalClientId = process.env.PAYPAL_CLIENT_ID
  
  const envCheck = {
    nodeEnv: process.env.NODE_ENV,
    paypalClientId: paypalClientId ? 'SET' : 'NOT SET',
    paypalClientIdSource: paypalClientId ? 'PAYPAL_CLIENT_ID (server-side, runtime)' : 'NOT SET',
    paypalClientIdPreview: paypalClientId 
      ? `${paypalClientId.substring(0, 20)}...` 
      : 'NOT SET',
    paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET ? 'SET' : 'NOT SET',
    paypalEnvironment: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
    // Show all PayPal-related env vars
    allPaypalVars: Object.keys(process.env)
      .filter(key => key.toUpperCase().includes('PAYPAL'))
      .reduce((acc: any, key) => {
        const value = process.env[key]
        acc[key] = value ? `${value.substring(0, 10)}... (length: ${value.length})` : 'NOT SET'
        return acc
      }, {}),
  }
  
  return NextResponse.json({
    message: 'Environment variable diagnostic',
    environment: envCheck,
    note: 'All PayPal variables are server-side only and read at runtime from Vercel project settings. They are NOT baked into the build. Set them in Vercel Dashboard → Settings → Environment Variables.',
    troubleshooting: {
      ifClientIdNotSet: [
        '1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables',
        '2. Add PAYPAL_CLIENT_ID with your PayPal client ID (server-side only)',
        '3. Verify variable name is exactly: PAYPAL_CLIENT_ID (case-sensitive)',
        '4. Variables are read at runtime, no rebuild needed',
        '5. The client ID is served to the client via /api/paypal/config route',
      ],
      ifClientSecretNotSet: [
        '1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables',
        '2. Add PAYPAL_CLIENT_SECRET with your PayPal client secret (server-side only)',
        '3. Verify variable name is exactly: PAYPAL_CLIENT_SECRET (case-sensitive)',
        '4. Variables are read at runtime, no rebuild needed',
        '5. PAYPAL_CLIENT_SECRET must remain server-side only (never exposed to client)',
      ],
      environment: [
        'Set PAYPAL_ENVIRONMENT to "production" for live mode, or leave unset/empty for "sandbox" mode',
      ],
    },
  })
}
