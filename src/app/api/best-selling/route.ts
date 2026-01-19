import { NextRequest, NextResponse } from 'next/server'
import { getJsonDataFallback, saveJsonDataFallback } from '@/lib/json-storage'

const BLOB_PATH = 'data/best-selling.json'
const LOCAL_FILE_PATH = 'data/best-selling.json'

export async function GET() {
  try {
    const data = await getJsonDataFallback<any>(BLOB_PATH, LOCAL_FILE_PATH)
    
    if (data === null) {
      // Return empty structure if no data found
      console.warn('Best-selling products not found, returning empty structure')
      return NextResponse.json({
        sectionHeading: '',
        sectionSubtitle: '',
        products: []
      })
    }
    
    // Handle legacy format (array) by converting to new format
    if (Array.isArray(data)) {
      return NextResponse.json({
        sectionHeading: "OUR BEST-SELLING SHIRTS. JUMP RIGHT IN.",
        sectionSubtitle: "Get started with one of our best-selling favorites.",
        products: data
      })
    }
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching best-selling products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch best-selling products', details: error.message },
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
    if (!data.sectionHeading || !data.sectionSubtitle || !Array.isArray(data.products)) {
      return NextResponse.json(
        { error: 'Data must have sectionHeading, sectionSubtitle, and products array' },
        { status: 400 }
      )
    }

    // Validate each product has required fields
    for (const product of data.products) {
      if (!product.id || !product.image || !product.title || !product.description) {
        return NextResponse.json(
          { error: 'Each product must have id, image, title, and description' },
          { status: 400 }
        )
      }
    }

    // Save to local file system (data/best-selling.json)
    try {
      await saveJsonDataFallback(BLOB_PATH, LOCAL_FILE_PATH, data)
      console.log('✓ Best-selling products saved successfully to data/best-selling.json')
      console.log('  Data saved:', { sectionHeading: data.sectionHeading, productsCount: data.products?.length || 0 })
    } catch (saveError: any) {
      console.error('✗ Failed to save best-selling products:', saveError.message)
      throw saveError
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: `Successfully saved to data/best-selling.json`
    })
  } catch (error: any) {
    console.error('Error updating best-selling products:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = error.code || 'UNKNOWN'
    
    return NextResponse.json(
      { 
        error: 'Failed to update best-selling products',
        details: errorMessage,
        code: errorCode
      },
      { status: 500 }
    )
  }
}
