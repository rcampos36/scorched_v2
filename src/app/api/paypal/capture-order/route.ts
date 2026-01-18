import { NextRequest, NextResponse } from 'next/server'

/**
 * Capture a PayPal order after approval
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Check PayPal configuration - all variables are server-side only
    const clientId = process.env.PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET || process.env.paypal_client_secret
    const environment = process.env.PAYPAL_ENVIRONMENT || 'sandbox'

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { 
          error: 'PayPal is not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET (both server-side only) in your environment variables.'
        },
        { status: 500 }
      )
    }

    // Get PayPal access token
    const baseUrl = environment === 'production' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com'

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('PayPal token error:', errorText)
      return NextResponse.json(
        { error: 'Failed to authenticate with PayPal' },
        { status: 500 }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Capture the order
    const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text()
      console.error('PayPal capture error:', errorText)
      return NextResponse.json(
        { error: 'Failed to capture PayPal order' },
        { status: 500 }
      )
    }

    const captureData = await captureResponse.json()

    return NextResponse.json({
      success: true,
      order: captureData,
      transactionId: captureData.id,
      payer: captureData.payer,
    })
  } catch (error: any) {
    console.error('Error capturing PayPal order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to capture PayPal order' },
      { status: 500 }
    )
  }
}
