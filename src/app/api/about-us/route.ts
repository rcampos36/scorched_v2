import { NextRequest, NextResponse } from 'next/server'
import { getJsonDataFallback, saveJsonDataFallback } from '@/lib/json-storage'

const BLOB_PATH = 'data/about-us.json'
const LOCAL_FILE_PATH = 'data/about-us.json'

export async function GET() {
  try {
    const data = await getJsonDataFallback(BLOB_PATH, LOCAL_FILE_PATH)
    
    if (data === null) {
      // Return empty structure if no data found
      console.warn('About us data not found, returning empty structure')
      return NextResponse.json({
        heading: '',
        paragraph1: { icon: '', text: '' },
        paragraph2: { icon: '', text: '' },
        button1: { text: '', link: '' },
        button2: { text: '', link: '' },
        image: ''
      })
    }
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching about us data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch about us data', details: error.message },
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
    if (!data.heading || !data.paragraph1 || !data.paragraph2 || !data.button1 || !data.button2 || !data.image) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Save to local file system (data/about-us.json)
    await saveJsonDataFallback(BLOB_PATH, LOCAL_FILE_PATH, data)

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error updating about us data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = error.code || 'UNKNOWN'
    
    return NextResponse.json(
      { 
        error: 'Failed to update about us data',
        details: errorMessage,
        code: errorCode
      },
      { status: 500 }
    )
  }
}
