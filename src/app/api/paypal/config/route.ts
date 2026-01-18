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
          message: 'Please set PAYPAL_CLIENT_ID in your Vercel environment variables and redeploy.',
          debug: {
            PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID ? 'SET' : 'NOT SET',
            NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? 'SET' : 'NOT SET',
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
