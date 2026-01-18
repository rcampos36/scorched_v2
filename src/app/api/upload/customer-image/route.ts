import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    console.log('Customer image upload request received')
    
    // Public endpoint for customer uploads (no authentication required)
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.error('No file provided in request')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type)
      return NextResponse.json(
        { error: 'Invalid file type. Only images (JPEG, PNG, WebP, GIF) are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      console.error('File too large:', file.size)
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `customer-${timestamp}-${randomSuffix}-${sanitizedFileName}`

    // Upload to Vercel Blob Storage
    try {
      console.log('Uploading to Vercel Blob Storage:', {
        fileName,
        fileSize: file.size,
        fileType: file.type
      })

      const blob = await put(`customer-uploads/${fileName}`, file, {
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
    console.error('Upload error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause
    })
    
    // Return detailed error for debugging
    const errorMessage = error?.message || 'Failed to upload image'
    const errorDetails = process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview'
      ? {
          message: error?.message,
          stack: error?.stack,
          name: error?.name
        }
      : undefined
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    )
  }
}
