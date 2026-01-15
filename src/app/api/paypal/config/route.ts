import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to get PayPal client ID at runtime
 * This allows the key to be read from Hostinger's environment variables
 * instead of being embedded at build time
 */
export async function GET(request: NextRequest) {
  try {
    // Read from environment variables at runtime (from Hostinger hosting)
    // Try both variable names for compatibility
    const clientId = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    
    // Log for debugging (in production, check server logs)
    if (!clientId) {
      console.error('PayPal client ID not found in environment variables')
      console.error('Checked: PAYPAL_CLIENT_ID, NEXT_PUBLIC_PAYPAL_CLIENT_ID')
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('PAYPAL')))
    }
    
    if (!clientId) {
      return NextResponse.json(
        { 
          error: 'PayPal client ID is not configured',
          message: 'Please set PAYPAL_CLIENT_ID in your Hostinger hosting environment variables. After setting, restart the application with: pm2 restart scorched-v2',
          checkedVariables: ['PAYPAL_CLIENT_ID', 'NEXT_PUBLIC_PAYPAL_CLIENT_ID']
        },
        { status: 500 }
      )
    }

    // Determine if we're in sandbox or live mode
    const environment = process.env.PAYPAL_ENVIRONMENT || 'sandbox'

    return NextResponse.json({
      clientId,
      environment,
    })
  } catch (error: any) {
    console.error('Error getting PayPal config:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get PayPal configuration' },
      { status: 500 }
    )
  }
}
