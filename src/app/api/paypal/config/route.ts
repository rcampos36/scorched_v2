import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to get PayPal client ID at runtime
 */
export async function GET(request: NextRequest) {
  try {
    // Read from environment variables - check multiple possible names
    const clientId = 
      process.env.PAYPAL_CLIENT_ID || 
      process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
      null

    const environment = 
      process.env.PAYPAL_ENVIRONMENT || 
      process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT ||
      'sandbox'

    // Debug logging
    console.log('PayPal Config - Checking environment variables:', {
      PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? 'SET' : 'NOT SET',
      PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET ? 'SET' : 'NOT SET',
      finalClientId: clientId ? 'FOUND' : 'NOT FOUND',
    })

    if (!clientId) {
      return NextResponse.json(
        { 
          error: 'PayPal client ID is not configured',
          message: 'PayPal client ID is not configured. Please set NEXT_PUBLIC_PAYPAL_CLIENT_ID in your Vercel environment variables and redeploy.',
          debug: {
            PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID ? 'SET' : 'NOT SET',
            NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? 'SET' : 'NOT SET',
          },
          instructions: {
            step1: 'Go to your Vercel project dashboard → Settings → Environment Variables',
            step2: 'Add NEXT_PUBLIC_PAYPAL_CLIENT_ID with your PayPal client ID',
            step3: 'Add PAYPAL_CLIENT_SECRET with your PayPal client secret (server-side only)',
            step4: 'Redeploy your application (Vercel will automatically rebuild)',
            step5: 'Verify variables are loaded by checking /api/debug/env',
            note: 'NEXT_PUBLIC_ variables are baked into the build at build-time. PAYPAL_CLIENT_SECRET must remain server-side only. After setting NEXT_PUBLIC_ variables, Vercel will automatically trigger a new deployment.',
          }
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      clientId,
      environment,
    })
  } catch (error: any) {
    console.error('PayPal config error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get PayPal configuration',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
