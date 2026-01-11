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
  paymentIntentId?: string
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

export async function DELETE(
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
    const orders = await getOrders()
    const orderIndex = orders.findIndex((o) => o.orderId === orderId)

    if (orderIndex === -1) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Remove the order
    orders.splice(orderIndex, 1)
    await saveOrders(orders)

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
    })
  } catch (error) {
    console.error('Delete order error:', error)
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    )
  }
}
