import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { promises as fs } from 'fs'
import path from 'path'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const ordersFilePath = path.join(process.cwd(), 'data', 'orders.json')

async function getOrders(): Promise<any[]> {
  try {
    if (!(await fs.access(ordersFilePath).then(() => true).catch(() => false))) {
      return []
    }
    const fileContents = await fs.readFile(ordersFilePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    return []
  }
}

async function saveOrders(orders: any[]) {
  const dataDir = path.dirname(ordersFilePath)
  if (!(await fs.access(dataDir).then(() => true).catch(() => false))) {
    await fs.mkdir(dataDir, { recursive: true })
  }
  await fs.writeFile(ordersFilePath, JSON.stringify(orders, null, 2), 'utf8')
}

async function updateOrderStatus(orderId: string, status: string, paymentIntentId?: string) {
  const orders = await getOrders()
  const orderIndex = orders.findIndex((o) => o.orderId === orderId)
  
  if (orderIndex !== -1) {
    orders[orderIndex].status = status
    if (paymentIntentId) {
      orders[orderIndex].paymentIntentId = paymentIntentId
    }
    await saveOrders(orders)
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing stripe-signature or webhook secret' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const orderId = paymentIntent.metadata.orderId
      
      if (orderId) {
        await updateOrderStatus(orderId, 'processing', paymentIntent.id)
        
        // Send order confirmation email
        try {
          const orders = await getOrders()
          const order = orders.find((o) => o.orderId === orderId)
          
          if (order) {
            await fetch(`${request.nextUrl.origin}/api/orders/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'order-confirmation',
                order,
              }),
            })
          }
        } catch (emailError) {
          console.error('Failed to send order confirmation email:', emailError)
        }
      }
      break

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent
      const failedOrderId = failedPayment.metadata.orderId
      
      if (failedOrderId) {
        await updateOrderStatus(failedOrderId, 'cancelled')
      }
      break

    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
