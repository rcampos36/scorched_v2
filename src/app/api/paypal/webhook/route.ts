import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

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

async function updateOrderStatus(orderId: string, status: string, transactionId?: string) {
  const orders = await getOrders()
  const orderIndex = orders.findIndex((o) => o.orderId === orderId)
  
  if (orderIndex !== -1) {
    orders[orderIndex].status = status
    if (transactionId) {
      orders[orderIndex].paymentIntentId = transactionId // Keep same field name for compatibility
      orders[orderIndex].paypalTransactionId = transactionId
    }
    await saveOrders(orders)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const eventType = body.event_type
    const resource = body.resource

    // Handle PayPal webhook events
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        // Payment was successfully captured
        const orderId = resource.custom_id || resource.invoice_id
        
        if (orderId) {
          await updateOrderStatus(orderId, 'processing', resource.id)
          
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

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REFUNDED':
        // Payment was denied or refunded
        const failedOrderId = resource.custom_id || resource.invoice_id
        
        if (failedOrderId) {
          await updateOrderStatus(failedOrderId, 'cancelled')
        }
        break

      default:
        console.log(`Unhandled PayPal webhook event type: ${eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('PayPal webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
