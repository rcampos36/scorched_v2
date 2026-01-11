import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

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

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images (JPEG, PNG, WebP, GIF) are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Check if Vercel Blob is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN is not set')
      return NextResponse.json(
        { 
          error: 'Image upload is not configured. Please set BLOB_READ_WRITE_TOKEN environment variable. See IMAGE_UPLOAD_SETUP.md for instructions.',
          requiresConfiguration: true
        },
        { status: 500 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `admin-${timestamp}-${sanitizedFileName}`

    try {
      // Upload to Vercel Blob Storage
      const blob = await put(fileName, file, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })

      return NextResponse.json({ 
        success: true, 
        url: blob.url,
        fileName: fileName
      })
    } catch (blobError: any) {
      console.error('Vercel Blob upload error:', blobError)
      return NextResponse.json(
        { 
          error: blobError.message || 'Failed to upload image to cloud storage',
          details: process.env.NODE_ENV === 'development' ? blobError.stack : undefined
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to upload image',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
