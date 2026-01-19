import { NextRequest, NextResponse } from 'next/server'
import { getJsonDataFallback, saveJsonDataFallback } from '@/lib/json-storage'

const BLOB_PATH = 'data/footer.json'
const LOCAL_FILE_PATH = 'data/footer.json'

export async function GET() {
  try {
    const data = await getJsonDataFallback(BLOB_PATH, LOCAL_FILE_PATH)
    
    if (data === null) {
      // Return empty structure if no data found - match expected interface
      console.warn('Footer data not found, returning empty structure')
      return NextResponse.json({
        contact: {
          heading: '',
          phone: '',
          email: '',
          hours: {
            weekdays: '',
            weekends: ''
          }
        },
        navigateLinks: [],
        companyLinks: [],
        additionalLinks: [],
        socialMedia: [],
        copyright: '',
        newsletter: {
          heading: '',
          description: ''
        }
      })
    }
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching footer data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch footer data', details: error.message },
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
    if (!data.contact || !data.navigateLinks || !data.companyLinks || !data.additionalLinks || !data.socialMedia || !data.copyright || !data.newsletter) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate socialMedia is an array
    if (!Array.isArray(data.socialMedia)) {
      return NextResponse.json(
        { error: 'socialMedia must be an array' },
        { status: 400 }
      )
    }

    // Validate each social media link has required fields
    for (const social of data.socialMedia) {
      if (!social.name || !social.url || !social.icon) {
        return NextResponse.json(
          { error: 'Each social media link must have name, url, and icon fields' },
          { status: 400 }
        )
      }
    }

    // Save to local file system (data/footer.json)
    await saveJsonDataFallback(BLOB_PATH, LOCAL_FILE_PATH, data)

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error updating footer data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = error.code || 'UNKNOWN'
    
    return NextResponse.json(
      { 
        error: 'Failed to update footer data',
        details: errorMessage,
        code: errorCode
      },
      { status: 500 }
    )
  }
}
