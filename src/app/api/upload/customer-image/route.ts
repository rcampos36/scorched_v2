import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}

// Upload to Cloudinary
async function uploadToCloudinary(file: File, fileName: string): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured')
  }

  // Convert file to base64
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const base64 = buffer.toString('base64')
  const dataUri = `data:${file.type};base64,${base64}`

  // Generate signature for upload
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = 'scorched-fabrics/customer-uploads'
  
  // Create signature string
  const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
  
  // Create SHA1 signature
  const crypto = await import('crypto')
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex')

  // Upload to Cloudinary
  const formData = new FormData()
  formData.append('file', dataUri)
  formData.append('api_key', apiKey)
  formData.append('timestamp', timestamp.toString())
  formData.append('signature', signature)
  formData.append('folder', folder)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Cloudinary upload error:', errorText)
    throw new Error('Failed to upload to Cloudinary')
  }

  const result = await response.json()
  return result.secure_url
}

// Upload to local filesystem (fallback for development)
async function uploadToLocalFilesystem(file: File, fileName: string): Promise<string> {
  const uploadsDir = join(process.cwd(), 'public', 'uploads')
  
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true })
  }

  const filePath = join(uploadsDir, fileName)
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  await writeFile(filePath, buffer)

  return `/uploads/${fileName}`
}

export async function POST(request: NextRequest) {
  try {
    // Public endpoint for customer uploads (no authentication required)
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
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `customer-${timestamp}-${randomSuffix}-${sanitizedFileName}`

    let url: string

    // Try Cloudinary first if configured
    if (isCloudinaryConfigured()) {
      try {
        url = await uploadToCloudinary(file, fileName)
        console.log('Customer image uploaded to Cloudinary:', url)
      } catch (cloudinaryError: any) {
        console.error('Cloudinary upload failed:', cloudinaryError)
        return NextResponse.json(
          { error: `Cloudinary upload failed: ${cloudinaryError.message}` },
          { status: 500 }
        )
      }
    } else {
      // Fall back to local filesystem
      try {
        url = await uploadToLocalFilesystem(file, fileName)
        console.log('Customer image uploaded to local filesystem:', url)
      } catch (writeError: any) {
        console.error('Failed to write file:', writeError)
        
        // Check if it's a permission error (read-only filesystem)
        if (writeError.code === 'EACCES' || writeError.code === 'EROFS') {
          return NextResponse.json(
            { 
              error: 'File system is read-only. Please configure Cloudinary for image uploads.',
              requiresCloudStorage: true,
              setup: {
                message: 'Set these environment variables to enable image uploads:',
                variables: [
                  'CLOUDINARY_CLOUD_NAME - Your Cloudinary cloud name',
                  'CLOUDINARY_API_KEY - Your Cloudinary API key',
                  'CLOUDINARY_API_SECRET - Your Cloudinary API secret',
                ],
                instructions: [
                  '1. Create a free Cloudinary account at https://cloudinary.com',
                  '2. Get your credentials from the Cloudinary dashboard',
                  '3. Add the environment variables to your hosting',
                  '4. Rebuild and restart the application',
                ]
              }
            },
            { status: 500 }
          )
        }
        
        return NextResponse.json(
          { error: `Failed to save file: ${writeError.message || 'Unknown error'}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ 
      success: true, 
      url: url,
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
