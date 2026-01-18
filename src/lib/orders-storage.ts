import { put, list, head } from '@vercel/blob'

const ORDERS_BLOB_PATH = 'data/orders.json'

export interface OrderItem {
  id: number
  image: string
  title: string
  description: string
  price: number
  quantity: number
  size?: string
  color?: string
}

export interface CustomerInfo {
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

export interface Order {
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

/**
 * Get orders from Vercel Blob Storage
 * Falls back to empty array if blob doesn't exist or on error
 */
export async function getOrders(): Promise<Order[]> {
  try {
    let blobUrl: string | null = null
    
    // Try to get the blob using head() first (checks exact path)
    try {
      const blobInfo = await head(ORDERS_BLOB_PATH)
      blobUrl = blobInfo.url
    } catch (headError: any) {
      // If blob doesn't exist (404), return empty array
      if (headError.status === 404 || headError.message?.includes('not found')) {
        return []
      }
      // For other errors, try list as fallback
      try {
        const blobs = await list({ prefix: ORDERS_BLOB_PATH, limit: 1 })
        if (blobs.blobs.length > 0 && blobs.blobs[0].url) {
          blobUrl = blobs.blobs[0].url
        } else {
          return []
        }
      } catch {
        // If both fail, return empty array
        return []
      }
    }

    if (!blobUrl) {
      return []
    }

    // Fetch the blob content
    const response = await fetch(blobUrl)
    if (!response.ok) {
      console.warn('Failed to fetch orders from blob storage:', response.statusText)
      return []
    }

    const content = await response.text()
    if (!content || content.trim() === '') {
      return []
    }

    return JSON.parse(content)
  } catch (error: any) {
    // If blob storage is not configured or blob doesn't exist, return empty array
    if (error.message?.includes('BLOB_READ_WRITE_TOKEN') || 
        error.message?.includes('not found') ||
        error.code === 'ENOENT' ||
        error.status === 404) {
      console.warn('Orders blob not found or blob storage not configured, starting with empty orders')
      return []
    }
    
    console.error('Error reading orders from blob storage:', error)
    return []
  }
}

/**
 * Save orders to Vercel Blob Storage
 */
export async function saveOrders(orders: Order[]): Promise<void> {
  try {
    const jsonContent = JSON.stringify(orders, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })

    // Upload/update the orders blob
    await put(ORDERS_BLOB_PATH, blob, {
      access: 'public',
      addRandomSuffix: false, // Use fixed path so we can find it later
    })
  } catch (error: any) {
    console.error('Error saving orders to blob storage:', error)
    
    // Provide helpful error message if blob storage is not configured
    if (error.message?.includes('BLOB_READ_WRITE_TOKEN')) {
      throw new Error(
        'Blob storage is not configured. Please set BLOB_READ_WRITE_TOKEN in your Vercel environment variables.'
      )
    }
    
    throw error
  }
}
