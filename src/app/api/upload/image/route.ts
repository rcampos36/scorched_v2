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

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `admin-${timestamp}-${sanitizedFileName}`

    // Upload to Vercel Blob Storage
    try {
      console.log('Uploading admin image to Vercel Blob Storage:', {
        fileName,
        fileSize: file.size,
        fileType: file.type
      })

      const blob = await put(`admin-uploads/${fileName}`, file, {
        access: 'public',
        addRandomSuffix: true, // Ensures unique filenames
      })

      console.log('Upload successful to Vercel Blob:', blob.url)
      
      return NextResponse.json({ 
        success: true, 
        url: blob.url,
        fileName: fileName
      })
    } catch (uploadError: any) {
      console.error('Vercel Blob upload failed:', {
        message: uploadError?.message,
        stack: uploadError?.stack,
        fileName,
        fileSize: file.size
      })
      
      return NextResponse.json(
        { 
          error: `Upload failed: ${uploadError?.message || 'Unknown error'}`,
          details: process.env.NODE_ENV === 'development' 
            ? { message: uploadError?.message, stack: uploadError?.stack }
            : undefined,
          setup: {
            message: 'If upload continues to fail, please check:',
            troubleshooting: [
              '1. Verify BLOB_READ_WRITE_TOKEN is set in Vercel Dashboard → Settings → Environment Variables',
              '2. Make sure you have created a Blob store in Vercel Dashboard → Storage',
              '3. Check that the token has read/write permissions',
              '4. Verify file size is under 10MB',
            ]
          }
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
