import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const dataFilePath = path.join(process.cwd(), 'data', 'hero-slides.json')

export async function GET() {
  try {
    const fileContents = await fs.readFile(dataFilePath, 'utf8')
    const slides = JSON.parse(fileContents)
    return NextResponse.json(slides)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch slides' },
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

    await fs.writeFile(dataFilePath, JSON.stringify(slides, null, 2), 'utf8')

    return NextResponse.json({ success: true, slides })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update slides' },
      { status: 500 }
    )
  }
}
