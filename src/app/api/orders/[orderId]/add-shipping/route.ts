import { NextRequest, NextResponse } from 'next/server'
import { getOrders, saveOrders, type Order } from '@/lib/orders-storage'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Check admin authentication
    const authCookie = request.cookies.get('admin-auth')
    if (!authCookie || authCookie.value !== 'authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { orderId } = await params
    const body = await request.json()
    const { trackingNumber, carrier, sendEmail } = body

    if (!trackingNumber || trackingNumber.trim() === '') {
      return NextResponse.json(
        { error: 'Tracking number is required' },
        { status: 400 }
      )
    }

    const orders = await getOrders()
    const orderIndex = orders.findIndex((o) => o.orderId === orderId)

    if (orderIndex === -1) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = orders[orderIndex]
    
    // Update order with shipping information
    order.trackingNumber = trackingNumber.trim()
    order.carrier = carrier || 'Other'
    order.shippedDate = new Date().toISOString()
    order.status = 'shipped'

    orders[orderIndex] = order
    await saveOrders(orders)

    // Send shipping notification email if requested
    let emailError = null
    if (sendEmail !== false) {
      try {
        const emailResponse = await fetch(`${request.nextUrl.origin}/api/orders/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'shipping-notification',
            order,
          }),
        })

        if (!emailResponse.ok) {
          const emailErrorData = await emailResponse.json().catch(() => ({ error: 'Unknown error' }))
          emailError = emailErrorData.error || emailErrorData.details || 'Failed to send email'
          console.error('Failed to send shipping notification email:', emailErrorData)
        } else {
          const emailResult = await emailResponse.json()
          console.log('Shipping notification email sent successfully:', emailResult)
        }
      } catch (emailError_) {
        emailError = emailError_ instanceof Error ? emailError_.message : 'Unknown error'
        console.error('Exception sending shipping notification email:', emailError_)
      }
    }

    // Return response with email status
    const response: any = {
      success: true,
      order,
    }

    if (sendEmail !== false && emailError) {
      response.emailSent = false
      response.emailError = emailError
    } else if (sendEmail !== false) {
      response.emailSent = true
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Add shipping label error:', error)
    return NextResponse.json(
      { error: 'Failed to add shipping label' },
      { status: 500 }
    )
  }
}
