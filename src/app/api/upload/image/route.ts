import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    try {
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }
    } catch (mkdirError) {
      console.error('Failed to create uploads directory:', mkdirError)
      return NextResponse.json(
        { error: 'Failed to create uploads directory. Check server permissions.' },
        { status: 500 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `admin-${timestamp}-${sanitizedFileName}`
    const filePath = join(uploadsDir, fileName)

    try {
      // Convert file to buffer and save
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)
    } catch (writeError: any) {
      console.error('Failed to write file:', writeError)
      
      // Check if it's a permission error
      if (writeError.code === 'EACCES' || writeError.code === 'EROFS') {
        return NextResponse.json(
          { 
            error: 'File system is read-only. For serverless hosting (like Vercel), use cloud storage (S3, Cloudinary). See IMAGE_UPLOAD_SETUP.md for instructions.',
            requiresCloudStorage: true
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to save file: ${writeError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    // Return the public URL
    const publicUrl = `/uploads/${fileName}`
    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      fileName: fileName
    })
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
