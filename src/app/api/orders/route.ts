import { NextRequest, NextResponse } from 'next/server'
import { getOrders, saveOrders, type Order, type OrderItem, type CustomerInfo } from '@/lib/orders-storage'

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

    // Generate order ID if not provided, or use the provided one
    let orderId = body.orderId
    if (!orderId) {
      const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase()
      orderId = `ORD-${Date.now()}-${randomSuffix}`
    }
    
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
  } catch (error: any) {
    console.error('Order creation error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    })
    
    // Provide helpful error message if blob storage is not configured
    const errorMessage = error.message || 'Failed to create order'
    const isBlobError = errorMessage.includes('BLOB_READ_WRITE_TOKEN') || 
                       errorMessage.includes('blob storage') ||
                       errorMessage.includes('read-only file system')
    
    return NextResponse.json(
      { 
        error: isBlobError 
          ? 'Orders cannot be saved. Blob storage is not configured. Please set BLOB_READ_WRITE_TOKEN in your Vercel environment variables.'
          : errorMessage
      },
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
