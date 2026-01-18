import { NextRequest, NextResponse } from 'next/server'
import { getOrders, saveOrders, type Order } from '@/lib/orders-storage'

async function updateOrderStatus(
  orderId: string, 
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled', 
  transactionId?: string
) {
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
              const emailResponse = await fetch(`${request.nextUrl.origin}/api/orders/send-email`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  type: 'order-confirmation',
                  order,
                }),
              })
              
              const responseText = await emailResponse.text()
              console.log('Email API Response Status:', emailResponse.status)
              console.log('Email API Response:', responseText)
              
              if (!emailResponse.ok) {
                let emailError
                try {
                  emailError = JSON.parse(responseText)
                } catch {
                  emailError = { error: responseText || 'Unknown email error', rawResponse: responseText }
                }
                console.error('❌ Failed to send order confirmation email:', JSON.stringify(emailError, null, 2))
              } else {
                let emailResult
                try {
                  emailResult = JSON.parse(responseText)
                } catch {
                  emailResult = { rawResponse: responseText }
                }
                console.log('✅ Order confirmation email sent:', emailResult)
              }
            }
          } catch (emailError: any) {
            console.error('❌ Exception sending order confirmation email:', emailError.message || emailError)
            console.error('Error stack:', emailError.stack)
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
