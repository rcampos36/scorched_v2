import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim()
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim()
  
  const isConfigured = !!(cloudName && apiKey && apiSecret)
  
  // Log diagnostic info in case of issues
  if (!isConfigured) {
    console.warn('Cloudinary configuration check:', {
      hasCloudName: !!cloudName,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      nodeEnv: process.env.NODE_ENV
    })
  }
  
  return isConfigured
}

// Upload to Cloudinary
async function uploadToCloudinary(file: File, fileName: string): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim()
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim()

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured. Missing required environment variables.')
  }

  // Convert file to buffer
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  // Convert buffer to base64 data URI
  const base64 = buffer.toString('base64')
  const dataUri = `data:${file.type};base64,${base64}`

  // Generate signature for upload
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = 'scorched-fabrics'
  
  // Create signature string (must match the order of form fields)
  const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
  
  // Create SHA1 signature
  const crypto = await import('crypto')
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex')

  // Upload to Cloudinary using FormData with data URI
  const formData = new FormData()
  formData.append('file', dataUri)
  formData.append('api_key', apiKey)
  formData.append('timestamp', timestamp.toString())
  formData.append('signature', signature)
  formData.append('folder', folder)

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Cloudinary upload error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        cloudName: cloudName?.substring(0, 10) + '...'
      })
      
      // Try to parse error response
      try {
        const errorJson = JSON.parse(errorText)
        throw new Error(errorJson.error?.message || `Cloudinary upload failed: ${response.statusText}`)
      } catch {
        throw new Error(`Cloudinary upload failed: ${response.statusText} - ${errorText}`)
      }
    }

    const result = await response.json()
    
    if (!result.secure_url) {
      throw new Error('Cloudinary response missing secure_url')
    }
    
    return result.secure_url
  } catch (error: any) {
    // Re-throw with more context
    if (error.message?.includes('Cloudinary')) {
      throw error
    }
    throw new Error(`Cloudinary upload failed: ${error.message || 'Unknown error'}`)
  }
}

// Upload to local filesystem (fallback for development)
async function uploadToLocalFilesystem(file: File, fileName: string, request: NextRequest): Promise<string> {
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

    let url: string

    // Check if we're in production/Vercel environment
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
    
    // Try Cloudinary first if configured
    if (isCloudinaryConfigured()) {
      try {
        url = await uploadToCloudinary(file, fileName)
        console.log('Image uploaded to Cloudinary:', url)
      } catch (cloudinaryError: any) {
        console.error('Cloudinary upload failed:', cloudinaryError)
        
        // If in production and Cloudinary fails, don't fall back to filesystem
        if (isProduction) {
          return NextResponse.json(
            { 
              error: `Cloudinary upload failed: ${cloudinaryError.message}`,
              requiresCloudStorage: true,
              setup: {
                message: 'Cloudinary is configured but upload failed. Please check:',
                troubleshooting: [
                  '1. Verify CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set correctly in Vercel',
                  '2. Check that your Cloudinary account is active',
                  '3. Verify API key and secret are correct in Cloudinary dashboard',
                  '4. Check Vercel function logs for detailed error messages',
                ]
              }
            },
            { status: 500 }
          )
        }
        
        // In development, fall back to local filesystem
        try {
          url = await uploadToLocalFilesystem(file, fileName, request)
          console.log('Image uploaded to local filesystem (Cloudinary failed):', url)
        } catch (writeError: any) {
          return NextResponse.json(
            { 
              error: `Both Cloudinary and local upload failed. Cloudinary error: ${cloudinaryError.message}`,
              requiresCloudStorage: true
            },
            { status: 500 }
          )
        }
      }
    } else {
      // Cloudinary not configured
      if (isProduction) {
        // In production, require Cloudinary
        return NextResponse.json(
          { 
            error: 'File system is read-only. Please configure Cloudinary for image uploads.',
            requiresCloudStorage: true,
            setup: {
              message: 'Set these environment variables in Vercel to enable image uploads:',
              variables: [
                'CLOUDINARY_CLOUD_NAME - Your Cloudinary cloud name',
                'CLOUDINARY_API_KEY - Your Cloudinary API key',
                'CLOUDINARY_API_SECRET - Your Cloudinary API secret',
              ],
              instructions: [
                '1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables',
                '2. Add all three CLOUDINARY_* variables',
                '3. Verify variable names are exactly as shown above (case-sensitive)',
                '4. No rebuild needed - variables are read at runtime',
                '5. Get your credentials from https://cloudinary.com/console',
              ],
              diagnostic: {
                hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
                hasApiKey: !!process.env.CLOUDINARY_API_KEY,
                hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
              }
            }
          },
          { status: 500 }
        )
      }
      
      // Fall back to local filesystem (development only)
      try {
        url = await uploadToLocalFilesystem(file, fileName, request)
        console.log('Image uploaded to local filesystem:', url)
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
