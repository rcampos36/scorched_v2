import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to get Stripe publishable key at runtime
 * This allows the key to be read from Hostinger's environment variables
 * instead of being embedded at build time
 */
export async function GET(request: NextRequest) {
  try {
    // Read from environment variables at runtime (from Hostinger hosting)
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    
    if (!publishableKey) {
      return NextResponse.json(
        { 
          error: 'Stripe publishable key is not configured',
          message: 'Please set STRIPE_PUBLISHABLE_KEY in your Hostinger hosting environment variables'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      publishableKey,
    })
  } catch (error: any) {
    console.error('Error getting Stripe config:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get Stripe configuration' },
      { status: 500 }
    )
  }
}
