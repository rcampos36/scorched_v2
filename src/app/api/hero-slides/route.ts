import { NextRequest, NextResponse } from 'next/server'
import { getJsonDataFallback, saveJsonDataFallback } from '@/lib/json-storage'

const BLOB_PATH = 'data/hero-slides.json'
const LOCAL_FILE_PATH = 'data/hero-slides.json'

// Disable Next.js caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const slides = await getJsonDataFallback<any[]>(BLOB_PATH, LOCAL_FILE_PATH)
    
    if (slides === null || !Array.isArray(slides)) {
      // Return empty array if no data found - frontend will use defaults
      console.warn('Hero slides not found, returning empty array')
      return NextResponse.json([], {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    }
    
    // Log for debugging
    console.log('Hero slides API: Returning', slides.length, 'slides')
    if (slides.length > 0) {
      console.log('First slide image:', slides[0]?.image)
    }
    
    // Add cache control headers to prevent stale data
    return NextResponse.json(slides, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error: any) {
    console.error('Error reading hero slides:', error)
    return NextResponse.json(
      { error: 'Failed to fetch slides', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
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

    const slides = await request.json()

    // Validate slides structure
    if (!Array.isArray(slides)) {
      return NextResponse.json(
        { error: 'Slides must be an array' },
        { status: 400 }
      )
    }

    // Validate each slide has required fields
    for (const slide of slides) {
      if (!slide.id || !slide.image || !slide.title || !slide.description || !slide.ctaText || !slide.ctaButton) {
        return NextResponse.json(
          { error: 'Each slide must have id, image, title, description, ctaText, and ctaButton' },
          { status: 400 }
        )
      }
    }

    // Save to local file system (data/hero-slides.json)
    try {
      await saveJsonDataFallback(BLOB_PATH, LOCAL_FILE_PATH, slides)
      console.log('✓ Hero slides saved successfully to data/hero-slides.json')
      console.log('  Data saved:', { slidesCount: slides.length })
    } catch (saveError: any) {
      console.error('✗ Failed to save hero slides:', saveError.message)
      throw saveError
    }

    return NextResponse.json({ 
      success: true, 
      slides,
      message: `Successfully saved ${slides.length} slides to data/hero-slides.json`
    })
  } catch (error: any) {
    console.error('Error updating hero slides:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = error.code || 'UNKNOWN'
    
    return NextResponse.json(
      { 
        error: 'Failed to update slides',
        details: errorMessage,
        code: errorCode
      },
      { status: 500 }
    )
  }
}
