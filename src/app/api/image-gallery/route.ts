import { NextRequest, NextResponse } from 'next/server'
import { getJsonDataFallback, saveJsonDataFallback } from '@/lib/json-storage'

const BLOB_PATH = 'data/image-gallery.json'
const LOCAL_FILE_PATH = 'data/image-gallery.json'

export async function GET() {
  try {
    const data = await getJsonDataFallback(BLOB_PATH, LOCAL_FILE_PATH)
    
    if (data === null) {
      // Return empty structure if no data found
      console.warn('Gallery images not found, returning empty structure')
      return NextResponse.json({
        heading: '',
        browseAllLink: '',
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
    if (!data.heading || !data.browseAllLink || !data.products || !Array.isArray(data.products)) {
      return NextResponse.json(
        { error: 'Data must have heading, browseAllLink, and products array' },
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

    // Save to local file system (data/image-gallery.json)
    try {
      await saveJsonDataFallback(BLOB_PATH, LOCAL_FILE_PATH, data)
      console.log('✓ Gallery data saved successfully to data/image-gallery.json')
      console.log('  Data saved:', { heading: data.heading, productsCount: data.products?.length || 0 })
    } catch (saveError: any) {
      console.error('✗ Failed to save gallery data:', saveError.message)
      throw saveError
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: `Successfully saved to data/image-gallery.json`
    })
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
