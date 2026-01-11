import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentIntentId, metadata } = body

    if (!paymentIntentId || !metadata) {
      return NextResponse.json(
        { error: 'Payment intent ID and metadata are required' },
        { status: 400 }
      )
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    // Update the payment intent with metadata
    const paymentIntent = await stripe.paymentIntents.update(
      paymentIntentId,
      {
        metadata,
      }
    )

    return NextResponse.json({
      success: true,
      paymentIntent,
    })
  } catch (error: any) {
    console.error('Error updating payment intent:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update payment intent' },
      { status: 500 }
    )
  }
}
