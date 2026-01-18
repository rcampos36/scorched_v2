import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to get PayPal client ID at runtime
 */
export async function GET(request: NextRequest) {
  try {
    // Read from server-side environment variables only (not baked into build)
    const clientId = process.env.PAYPAL_CLIENT_ID || null
    const environment = process.env.PAYPAL_ENVIRONMENT || 'sandbox'

    // Debug logging
    console.log('PayPal Config - Checking environment variables:', {
      PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID ? 'SET' : 'NOT SET',
      PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET ? 'SET' : 'NOT SET',
      finalClientId: clientId ? 'FOUND' : 'NOT FOUND',
    })

    if (!clientId) {
      return NextResponse.json(
        { 
          error: 'PayPal client ID is not configured',
          message: 'PayPal client ID is not configured. Please set PAYPAL_CLIENT_ID in your Vercel environment variables.',
          debug: {
            PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID ? 'SET' : 'NOT SET',
          },
          instructions: {
            step1: 'Go to your Vercel project dashboard → Settings → Environment Variables',
            step2: 'Add PAYPAL_CLIENT_ID with your PayPal client ID (server-side only)',
            step3: 'Add PAYPAL_CLIENT_SECRET with your PayPal client secret (server-side only)',
            step4: 'Variables are read at runtime, no rebuild needed',
            step5: 'Verify variables are loaded by checking /api/debug/env',
            note: 'All PayPal variables are server-side only and read at runtime. They are NOT baked into the build. The client ID is served to the client via this API route for PayPal SDK initialization.',
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
