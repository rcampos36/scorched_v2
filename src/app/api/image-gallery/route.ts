import { NextRequest, NextResponse } from 'next/server'
import { getJsonDataFallback, saveJsonDataFallback } from '@/lib/json-storage'

const BLOB_PATH = 'data/image-gallery.json'
const LOCAL_FILE_PATH = 'data/image-gallery.json'

export async function GET() {
  try {
    const data = await getJsonDataFallback(BLOB_PATH, LOCAL_FILE_PATH)
    
    if (data === null) {
      // Only fall back to local files if blob storage is NOT configured (development mode only)
      if (process.env.NODE_ENV === 'development' && !process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          const { promises: fs } = await import('fs')
          const path = await import('path')
          const filePath = path.join(process.cwd(), LOCAL_FILE_PATH)
          const fileContents = await fs.readFile(filePath, 'utf8')
          const localData = JSON.parse(fileContents)
          return NextResponse.json(localData)
        } catch {
          // Return empty structure if no data found
          console.warn('Gallery images not found, returning empty structure')
          return NextResponse.json({
            heading: '',
            products: []
          })
        }
      }
      
      // Return empty structure if no data found
      console.warn('Gallery images blob not found, returning empty structure')
      return NextResponse.json({
        heading: '',
        products: []
      })
    }
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching gallery images:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gallery images', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCookie = request.cookies.get('admin-auth')
    if (!authCookie || authCookie.value !== 'authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()

    // Validate data structure
    if (!data.heading || !data.products || !Array.isArray(data.products)) {
      return NextResponse.json(
        { error: 'Data must have heading and products array' },
        { status: 400 }
      )
    }

    // Validate each product has required fields
    for (const product of data.products) {
      if (!product.id || !product.image || !product.productType || !product.description || !product.price) {
        return NextResponse.json(
          { error: 'Each product must have id, image, productType, description, and price' },
          { status: 400 }
        )
      }
    }

    // Save to Vercel Blob Storage (or local filesystem in development)
    await saveJsonDataFallback(BLOB_PATH, LOCAL_FILE_PATH, data)

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error updating gallery images:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = error.code || 'UNKNOWN'
    
    return NextResponse.json(
      { 
        error: 'Failed to update gallery images',
        details: errorMessage,
        code: errorCode
      },
      { status: 500 }
    )
  }
}
