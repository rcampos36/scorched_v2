import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const ordersFilePath = path.join(process.cwd(), 'data', 'orders.json')

interface Order {
  orderId: string
  items: any[]
  customer: any
  total: number
  orderDate: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  trackingNumber?: string
  shippedDate?: string
}

async function getOrders(): Promise<Order[]> {
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

async function saveOrders(orders: Order[]) {
  await fs.writeFile(ordersFilePath, JSON.stringify(orders, null, 2), 'utf8')
}

function generateTrackingNumber(): string {
  // Generate a random tracking number
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let tracking = ''
  for (let i = 0; i < 12; i++) {
    tracking += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return tracking
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Check authentication (optional - you can add admin auth here)
    const authCookie = request.cookies.get('admin-auth')
    if (!authCookie || authCookie.value !== 'authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { orderId } = await params
    const orders = await getOrders()
    const orderIndex = orders.findIndex((o) => o.orderId === orderId)

    if (orderIndex === -1) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = orders[orderIndex]
    
    // Update order status
    order.status = 'shipped'
    order.trackingNumber = generateTrackingNumber()
    order.shippedDate = new Date().toISOString()

    orders[orderIndex] = order
    await saveOrders(orders)

    // Send shipping notification email
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
      // Don't fail the shipment if email fails
    }

    return NextResponse.json({
      success: true,
      order,
    })
  } catch (error) {
    console.error('Ship order error:', error)
    return NextResponse.json(
      { error: 'Failed to ship order' },
      { status: 500 }
    )
  }
}
