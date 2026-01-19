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
      if (process.env.NODE_ENV === 'development') {
        try {
          const { promises: fs } = await import('fs')
          const path = await import('path')
          const filePath = path.join(process.cwd(), LOCAL_FILE_PATH)
          const fileContents = await fs.readFile(filePath, 'utf8')
          const localSlides = JSON.parse(fileContents)
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Hero slides API: Returning', localSlides.length, 'slides (from local file)')
          }
          
          return NextResponse.json(localSlides, {
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Content-Type-Options': 'nosniff',
            },
          })
        } catch {
          return NextResponse.json(
            { error: 'Hero slides not found' },
            { status: 404 }
          )
        }
      }
      
      return NextResponse.json(
        { error: 'Hero slides not found' },
        { status: 404 }
      )
    }
    
    // Log for debugging (remove in production if needed)
    if (process.env.NODE_ENV === 'development') {
      console.log('Hero slides API: Returning', slides.length, 'slides')
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

    // Save to Vercel Blob Storage (or local filesystem in development)
    await saveJsonDataFallback(BLOB_PATH, LOCAL_FILE_PATH, slides)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Hero slides saved:', slides.length, 'slides')
    }

    return NextResponse.json({ success: true, slides })
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
