import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const ordersFilePath = path.join(process.cwd(), 'data', 'orders.json')

interface OrderItem {
  id: number
  image: string
  title: string
  description: string
  price: number
  quantity: number
  size?: string
  color?: string
}

interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  notes?: string
}

interface Order {
  orderId: string
  items: OrderItem[]
  customer: CustomerInfo
  total: number
  orderDate: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  trackingNumber?: string
  shippedDate?: string
  paymentIntentId?: string
  orderType?: 'custom' | 'merch'
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
  const dataDir = path.dirname(ordersFilePath)
  if (!(await fs.access(dataDir).then(() => true).catch(() => false))) {
    await fs.mkdir(dataDir, { recursive: true })
  }
  await fs.writeFile(ordersFilePath, JSON.stringify(orders, null, 2), 'utf8')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customer, total, orderDate, paymentIntentId, status, orderType } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      )
    }

    if (!customer || !customer.email || !customer.firstName || !customer.lastName) {
      return NextResponse.json(
        { error: 'Customer information is required' },
        { status: 400 }
      )
    }

    // Generate order ID and create order
    const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase()
    const orderId = `ORD-${Date.now()}-${randomSuffix}`
    const order: Order = {
      orderId,
      items,
      customer,
      total,
      orderDate: orderDate || new Date().toISOString(),
      status: status || 'pending',
      paymentIntentId,
      orderType: orderType || 'custom', // Default to 'custom' for backward compatibility
    }

    // Load existing orders and add new one
    const orders = await getOrders()
    orders.push(order)
    await saveOrders(orders)

    // Send order confirmation email
    try {
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
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError)
      // Don't fail the order creation if email fails
    }

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      order,
    })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if this is an admin request (optional - you can add auth here)
    const orders = await getOrders()
    return NextResponse.json({ orders })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
