import { NextRequest, NextResponse } from 'next/server'
import { getJsonDataFallback, saveJsonDataFallback } from '@/lib/json-storage'

const BLOB_PATH = 'data/footer.json'
const LOCAL_FILE_PATH = 'data/footer.json'

// Disable Next.js caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
      },
    })
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
    
    console.log('Footer save request received:', {
      socialMediaCount: data.socialMedia?.length || 0,
      socialMedia: data.socialMedia
    })

    // Validate data structure
    if (!data.contact || !data.navigateLinks || !data.companyLinks || !data.additionalLinks || !data.socialMedia || !data.copyright || !data.newsletter) {
      console.error('Footer validation failed: Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate socialMedia is an array
    if (!Array.isArray(data.socialMedia)) {
      console.error('Footer validation failed: socialMedia is not an array')
      return NextResponse.json(
        { error: 'socialMedia must be an array' },
        { status: 400 }
      )
    }

    // Validate each social media link has required fields
    // Allow empty strings and "#" as valid URLs
    for (let i = 0; i < data.socialMedia.length; i++) {
      const social = data.socialMedia[i]
      if (!social.name || social.name.trim() === '' || 
          social.url === undefined || social.url === null || 
          !social.icon || social.icon.trim() === '') {
        console.error(`Footer validation failed: Social media link ${i} is missing required fields:`, social)
        return NextResponse.json(
          { error: `Each social media link must have name, url, and icon fields. Link ${i + 1} is missing: ${!social.name || social.name.trim() === '' ? 'name' : ''} ${social.url === undefined || social.url === null ? 'url' : ''} ${!social.icon || social.icon.trim() === '' ? 'icon' : ''}` },
          { status: 400 }
        )
      }
      // Ensure URL is a string (convert to string if needed, but allow "#" and empty string)
      if (typeof social.url !== 'string') {
        data.socialMedia[i].url = String(social.url)
      }
    }

    // Save to local file system (data/footer.json)
    try {
      await saveJsonDataFallback(BLOB_PATH, LOCAL_FILE_PATH, data)
      console.log('✓ Footer data saved successfully to data/footer.json')
      console.log('  Saved social media links:', data.socialMedia.map((s: any) => ({ name: s.name, url: s.url, icon: s.icon })))
    } catch (saveError: any) {
      console.error('✗ Failed to save footer data:', saveError.message)
      throw saveError
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: `Successfully saved to data/footer.json`
    })
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
