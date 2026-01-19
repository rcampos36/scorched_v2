import { NextRequest, NextResponse } from 'next/server'
import { getJsonDataFallback, saveJsonDataFallback } from '@/lib/json-storage'

const BLOB_PATH = 'data/how-it-works.json'
const LOCAL_FILE_PATH = 'data/how-it-works.json'

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
          console.warn('How it works data not found, returning empty structure')
          return NextResponse.json({
            heading: '',
            subtitle: '',
            steps: []
          })
        }
      }
      
      // Return empty structure if no data found
      console.warn('How it works data blob not found, returning empty structure')
      return NextResponse.json({
        heading: '',
        subtitle: '',
        steps: []
      })
    }
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching how it works data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch how it works data', details: error.message },
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
    if (!data.heading || !data.subtitle || !data.steps || !Array.isArray(data.steps) || data.steps.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Save to Vercel Blob Storage (or local filesystem in development)
    await saveJsonDataFallback(BLOB_PATH, LOCAL_FILE_PATH, data)

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error updating how it works data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = error.code || 'UNKNOWN'
    
    return NextResponse.json(
      { 
        error: 'Failed to update how it works data',
        details: errorMessage,
        code: errorCode
      },
      { status: 500 }
    )
  }
}
