import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to get Stripe publishable key at runtime
 * This allows the key to be read from Hostinger's environment variables
 * instead of being embedded at build time
 */
export async function GET(request: NextRequest) {
  try {
    // Read from environment variables at runtime (from Hostinger hosting)
    // Try both variable names for compatibility
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    
    // Log for debugging (in production, check server logs)
    if (!publishableKey) {
      console.error('Stripe publishable key not found in environment variables')
      console.error('Checked: STRIPE_PUBLISHABLE_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('STRIPE')))
    }
    
    if (!publishableKey) {
      return NextResponse.json(
        { 
          error: 'Stripe publishable key is not configured',
          message: 'Please set STRIPE_PUBLISHABLE_KEY in your Hostinger hosting environment variables. After setting, restart the application with: pm2 restart scorched-v2',
          checkedVariables: ['STRIPE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY']
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
