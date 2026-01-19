import { NextRequest, NextResponse } from 'next/server'
import { getJsonDataFallback, saveJsonDataFallback } from '@/lib/json-storage'

const BLOB_PATH = 'data/header.json'
const LOCAL_FILE_PATH = 'data/header.json'

// Disable Next.js caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const data = await getJsonDataFallback(BLOB_PATH, LOCAL_FILE_PATH)
    
    if (data === null) {
      // Return empty structure if no data found - match expected interface
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
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
      },
    })
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
      // Read the raw body first to see what we're actually receiving
      const rawBody = await request.text()
      console.log('📥 Raw request body:', rawBody)
      
      data = JSON.parse(rawBody)
      console.log('📥 Parsed header data to save:')
      console.log('  Phone:', data.topBar?.phone)
      console.log('  Phone Link:', data.topBar?.phoneLink)
      console.log('  Full data:', JSON.stringify(data, null, 2))
      
      // Validate that we actually have the phone number
      if (!data.topBar || !data.topBar.phone) {
        console.error('⚠️ WARNING: No phone number in data!')
        console.error('  topBar:', data.topBar)
      }
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

    // Save to local file system (data/header.json)
    try {
      console.log('💾 Attempting to save header data...')
      console.log('  Phone being saved:', data.topBar.phone)
      console.log('  Full data being saved:', JSON.stringify(data, null, 2))
      
      const { promises: fs } = await import('fs')
      const path = await import('path')
      const filePath = path.join(process.cwd(), LOCAL_FILE_PATH)
      console.log('  Target file path:', filePath)
      console.log('  Current working directory:', process.cwd())
      
      // Check if file exists and what's in it before writing
      try {
        const beforeWrite = await fs.readFile(filePath, 'utf8')
        const beforeParsed = JSON.parse(beforeWrite)
        console.log('  Before write - Phone in file:', beforeParsed.topBar?.phone)
      } catch (e) {
        console.log('  File does not exist yet or cannot be read')
      }
      
      // Use the saveJsonDataFallback function
      await saveJsonDataFallback(BLOB_PATH, LOCAL_FILE_PATH, data)
      console.log('✓ Header data saved successfully to data/header.json')
      console.log('  Saved phone:', data.topBar.phone)
      
      // Wait longer for file system to flush
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Verify the save by reading it back immediately
      console.log('  Verifying file at path:', filePath)
      
      try {
        const readBack = await fs.readFile(filePath, 'utf8')
        const parsed = JSON.parse(readBack)
        console.log('✓ Verified saved data:')
        console.log('  Phone in file:', parsed.topBar?.phone)
        console.log('  Full file content:', JSON.stringify(parsed, null, 2))
        
        if (parsed.topBar?.phone !== data.topBar.phone) {
          console.error('⚠️ WARNING: Phone number mismatch after save!')
          console.error('  Expected:', data.topBar.phone)
          console.error('  Got from file:', parsed.topBar?.phone)
          console.error('  This indicates the file write may have failed or been overwritten')
          
          // Try writing directly with fs.writeFile
          console.log('  Attempting direct write with fs.writeFile...')
          const jsonContent = JSON.stringify(data, null, 2)
          await fs.writeFile(filePath, jsonContent, 'utf8')
          
          // Force sync
          const fileHandle = await fs.open(filePath, 'r+')
          await fileHandle.sync()
          await fileHandle.close()
          
          // Wait longer and verify again
          await new Promise(resolve => setTimeout(resolve, 500))
          const readBack2 = await fs.readFile(filePath, 'utf8')
          const parsed2 = JSON.parse(readBack2)
          console.log('  After direct write retry - Phone in file:', parsed2.topBar?.phone)
          
          if (parsed2.topBar?.phone !== data.topBar.phone) {
            console.error('✗ File write still failed after retry!')
            console.error('  This is a critical error - file system may be read-only or there is a permission issue')
            // Don't throw - return error response instead
            return NextResponse.json({
              error: 'File write verification failed',
              details: `Expected ${data.topBar.phone} but got ${parsed2.topBar?.phone}. File system may be read-only.`,
              savedData: data,
              fileData: parsed2
            }, { status: 500 })
          } else {
            console.log('✓ Direct write retry succeeded')
          }
        } else {
          console.log('✓ File write verified successfully')
        }
      } catch (verifyError: any) {
        console.error('✗ Failed to verify saved data:', verifyError.message)
        console.error('  Verify error stack:', verifyError.stack)
        // Don't throw - the save might have succeeded even if verification failed
      }
    } catch (saveError: any) {
      console.error('✗ Failed to save header data:', saveError.message)
      console.error('  Error stack:', saveError.stack)
      throw saveError
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: `Successfully saved to data/header.json`
    })
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
