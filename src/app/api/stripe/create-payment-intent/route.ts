import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe only if key is available
// This prevents errors during initialization if key is missing
const getStripeInstance = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return null
  }
  return new Stripe(secretKey, {
    apiVersion: '2023-10-16',
  })
}

export async function POST(request: NextRequest) {
  try {
    // Check Stripe configuration first
    // Reads from Hostinger hosting environment variables at runtime
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not set in environment variables')
      return NextResponse.json(
        { 
          error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in your Hostinger hosting environment variables. ' +
                 'Environment variables are read at runtime from Hostinger, not from .env files.'
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { amount, currency = 'usd', metadata = {} } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    const stripe = getStripeInstance()
    // This should never be null since we checked above, but TypeScript requires the check
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe initialization failed' },
        { status: 500 }
      )
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        ...metadata,
        // Add timestamp for unique order tracking
        timestamp: new Date().toISOString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
