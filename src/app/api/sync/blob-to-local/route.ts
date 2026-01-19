import { NextRequest, NextResponse } from 'next/server'
import { syncBlobToLocal } from '@/lib/json-storage'

// Disable Next.js caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// List of all data files that should be synced
const DATA_FILES = [
  { blob: 'data/hero-slides.json', local: 'data/hero-slides.json' },
  { blob: 'data/best-selling.json', local: 'data/best-selling.json' },
  { blob: 'data/about-us.json', local: 'data/about-us.json' },
  { blob: 'data/image-gallery.json', local: 'data/image-gallery.json' },
  { blob: 'data/footer.json', local: 'data/footer.json' },
  { blob: 'data/header.json', local: 'data/header.json' },
  { blob: 'data/how-it-works.json', local: 'data/how-it-works.json' },
]

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authCookie = request.cookies.get('admin-auth')
    if (!authCookie || authCookie.value !== 'authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'Blob storage not configured' },
        { status: 500 }
      )
    }

    console.log('🔄 Starting sync from blob storage to local files...')
    const results: { file: string; success: boolean; error?: string }[] = []

    for (const { blob, local } of DATA_FILES) {
      try {
        console.log(`Syncing ${blob} to ${local}...`)
        const result = await syncBlobToLocal(blob, local)
        if (result.data !== null) {
          results.push({ file: local, success: true })
          console.log(`✓ Synced ${local}`)
        } else {
          results.push({ file: local, success: false, error: result.error || 'No data found in blob storage' })
          console.warn(`⚠ Failed to sync ${local}: ${result.error || 'No data found in blob storage'}`)
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error'
        results.push({ file: local, success: false, error: errorMsg })
        console.error(`✗ Failed to sync ${local}:`, errorMsg)
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    console.log(`🔄 Sync complete: ${successCount} succeeded, ${failCount} failed`)

    return NextResponse.json({
      success: true,
      message: `Synced ${successCount} files, ${failCount} failed`,
      results,
      summary: {
        total: results.length,
        succeeded: successCount,
        failed: failCount
      }
    })
  } catch (error: any) {
    console.error('Error syncing files:', error)
    return NextResponse.json(
      { 
        error: 'Failed to sync files',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Allow GET to check sync status without actually syncing
  return NextResponse.json({
    message: 'Use POST to sync files from blob storage to local',
    files: DATA_FILES.map(f => f.local)
  })
}
