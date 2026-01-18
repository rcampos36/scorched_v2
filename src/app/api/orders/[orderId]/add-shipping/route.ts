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
    if (sendEmail !== false) {
      try {
        await fetch(`${request.nextUrl.origin}/api/orders/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'shipping-notification',
            order,
          }),
        })
      } catch (emailError) {
        console.error('Failed to send shipping notification email:', emailError)
        // Don't fail the update if email fails
      }
    }

    return NextResponse.json({
      success: true,
      order,
    })
  } catch (error) {
    console.error('Add shipping label error:', error)
    return NextResponse.json(
      { error: 'Failed to add shipping label' },
      { status: 500 }
    )
  }
}
