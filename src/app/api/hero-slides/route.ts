import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const dataFilePath = path.join(process.cwd(), 'data', 'hero-slides.json')

// Disable Next.js caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // Read file fresh each time (no caching)
    const fileContents = await fs.readFile(dataFilePath, 'utf8')
    const slides = JSON.parse(fileContents)
    
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

    // Write file and ensure it's flushed
    await fs.writeFile(dataFilePath, JSON.stringify(slides, null, 2), 'utf8')
    
    // Verify the file was written by reading it back
    const verifyContents = await fs.readFile(dataFilePath, 'utf8')
    const verifySlides = JSON.parse(verifyContents)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Hero slides saved:', verifySlides.length, 'slides')
    }

    return NextResponse.json({ success: true, slides: verifySlides })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update slides' },
      { status: 500 }
    )
  }
}
