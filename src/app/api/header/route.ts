import { NextRequest, NextResponse } from 'next/server'
import { getJsonDataFallback, saveJsonDataFallback } from '@/lib/json-storage'

const BLOB_PATH = 'data/header.json'
const LOCAL_FILE_PATH = 'data/header.json'

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
          console.warn('Header data not found, returning empty structure')
          return NextResponse.json({
            topBar: { 
              phone: '', 
              phoneLink: '',
              chatText: '',
              chatLink: ''
            },
            logo: { src: '', alt: '', width: 150, height: 40 },
            navigationLinks: [],
            ctaButton: { text: '', url: '' }
          })
        }
      }
      
      // Return empty structure if no data found - match expected interface
      console.warn('Header data blob not found, returning empty structure')
      return NextResponse.json({
        topBar: { 
          phone: '', 
          phoneLink: '',
          chatText: '',
          chatLink: ''
        },
        logo: { src: '', alt: '', width: 150, height: 40 },
        navigationLinks: [],
        ctaButton: { text: '', url: '' }
      })
    }
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching header data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch header data', details: error.message },
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

    let data
    try {
      data = await request.json()
    } catch (parseError) {
      console.error('Failed to parse request JSON:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate data structure
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      )
    }

    if (!data.topBar || !data.logo || !data.navigationLinks || !data.ctaButton) {
      return NextResponse.json(
        { error: 'Missing required fields. Required: topBar, logo, navigationLinks, ctaButton' },
        { status: 400 }
      )
    }

    // Validate navigationLinks is an array
    if (!Array.isArray(data.navigationLinks)) {
      return NextResponse.json(
        { error: 'navigationLinks must be an array' },
        { status: 400 }
      )
    }

    // Save to Vercel Blob Storage (or local filesystem in development)
    await saveJsonDataFallback(BLOB_PATH, LOCAL_FILE_PATH, data)

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error updating header data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = error.code || 'UNKNOWN'
    
    return NextResponse.json(
      { 
        error: 'Failed to update header data',
        details: errorMessage,
        code: errorCode
      },
      { status: 500 }
    )
  }
}
