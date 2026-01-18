import { NextRequest, NextResponse } from 'next/server'
import { getOrders, type Order } from '@/lib/orders-storage'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const authCookie = request.cookies.get('user-auth')
    const emailCookie = request.cookies.get('user-email')
    
    if (!authCookie || authCookie.value !== 'authenticated' || !emailCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all orders and filter by user email
    const orders = await getOrders()
    const userOrders = orders.filter(order => 
      order.customer?.email?.toLowerCase() === emailCookie.value.toLowerCase()
    )

    // Sort by order date (newest first)
    userOrders.sort((a, b) => 
      new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    )

    return NextResponse.json({ orders: userOrders })
  } catch (error) {
    console.error('Error fetching user orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
