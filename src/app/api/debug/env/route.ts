import { NextRequest, NextResponse } from 'next/server'

// This route helps diagnose environment variable issues
// Only enable in development or with proper authentication in production
export async function GET(request: NextRequest) {
  // In production, you might want to add authentication here
  // For now, we'll allow it but you should secure this endpoint
  
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Check environment variables (read from Vercel at runtime)
  // Check both build-time and runtime variables
  const nextPublicClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const runtimeClientId = process.env.PAYPAL_CLIENT_ID
  const paypalClientId = nextPublicClientId || runtimeClientId
  
  const envCheck = {
    nodeEnv: process.env.NODE_ENV,
    paypalClientId: paypalClientId ? 'SET' : 'NOT SET',
    paypalClientIdSource: nextPublicClientId ? 'NEXT_PUBLIC_PAYPAL_CLIENT_ID (build-time)' : 
                         runtimeClientId ? 'PAYPAL_CLIENT_ID (runtime)' : 'NOT SET',
    paypalClientIdPreview: paypalClientId 
      ? `${paypalClientId.substring(0, 20)}...` 
      : 'NOT SET',
    nextPublicPaypalClientId: nextPublicClientId ? 'SET' : 'NOT SET',
    runtimePaypalClientId: runtimeClientId ? 'SET' : 'NOT SET',
    paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET ? 'SET' : 'NOT SET',
    paypalEnvironment: process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT || process.env.PAYPAL_ENVIRONMENT || 'sandbox',
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
    note: 'Environment variables are read from Vercel project settings. Set them in Vercel Dashboard → Settings → Environment Variables.',
    troubleshooting: {
      ifClientIdNotSet: [
        '1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables',
        '2. Add NEXT_PUBLIC_PAYPAL_CLIENT_ID with your PayPal client ID',
        '3. Verify variable name is exactly: NEXT_PUBLIC_PAYPAL_CLIENT_ID (case-sensitive)',
        '4. Redeploy your application (Vercel will automatically rebuild)',
        '5. NEXT_PUBLIC_ variables require a rebuild to take effect',
      ],
      ifClientSecretNotSet: [
        '1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables',
        '2. Add PAYPAL_CLIENT_SECRET with your PayPal client secret',
        '3. Verify variable name is exactly: PAYPAL_CLIENT_SECRET (case-sensitive)',
        '4. Redeploy your application',
        '5. PAYPAL_CLIENT_SECRET is server-side only and does not require NEXT_PUBLIC_ prefix',
      ],
      environment: [
        'Set NEXT_PUBLIC_PAYPAL_ENVIRONMENT to "production" for live mode, or leave unset/empty for "sandbox" mode',
      ],
    },
  })
}
