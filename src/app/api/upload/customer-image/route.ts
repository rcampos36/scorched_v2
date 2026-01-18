import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  // Check raw values (before trimming)
  const cloudNameRaw = process.env.CLOUDINARY_CLOUD_NAME
  const apiKeyRaw = process.env.CLOUDINARY_API_KEY
  const apiSecretRaw = process.env.CLOUDINARY_API_SECRET
  
  // Trim and check
  const cloudName = cloudNameRaw?.trim()
  const apiKey = apiKeyRaw?.trim()
  const apiSecret = apiSecretRaw?.trim()
  
  const isConfigured = !!(cloudName && apiKey && apiSecret)
  
  // ALWAYS log diagnostic info (not just when not configured)
  // This helps debug issues in production
  console.log('Cloudinary configuration check:', {
    isConfigured,
    hasCloudName: !!cloudName,
    hasApiKey: !!apiKey,
    hasApiSecret: !!apiSecret,
    cloudNameLength: cloudName?.length || 0,
    apiKeyLength: apiKey?.length || 0,
    apiSecretLength: apiSecret?.length || 0,
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL === '1',
    vercelEnv: process.env.VERCEL_ENV,
    // Log first few chars to verify values exist (without exposing secrets)
    cloudNamePreview: cloudName ? `${cloudName.substring(0, 5)}...` : 'NOT SET',
    apiKeyPreview: apiKey ? `${apiKey.substring(0, 5)}...` : 'NOT SET',
    apiSecretPreview: apiSecret ? 'SET (hidden)' : 'NOT SET'
  })
  
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
  
  // Convert buffer to base64 string (without data URI prefix)
  const base64 = buffer.toString('base64')

  // Generate signature for upload
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = 'scorched-fabrics/customer-uploads'
  
  // For signed uploads with base64, we need to include the file parameter
  // The signature must include all parameters in alphabetical order
  const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
  
  // Create SHA1 signature
  const crypto = await import('crypto')
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex')

  // Build form data - Cloudinary accepts base64 data URI as a string
  // Use FormData but with string values (works better in Node.js/serverless)
  const formData = new FormData()
  formData.append('file', `data:${file.type};base64,${base64}`)
  formData.append('api_key', apiKey)
  formData.append('timestamp', timestamp.toString())
  formData.append('signature', signature)
  formData.append('folder', folder)

  try {
    console.log('Uploading to Cloudinary:', {
      cloudName: cloudName?.substring(0, 10) + '...',
      fileName,
      fileSize: buffer.length,
      fileType: file.type,
      folder
    })

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
        cloudName: cloudName?.substring(0, 10) + '...',
        fileName,
        fileSize: buffer.length
      })
      
      // Try to parse error response
      try {
        const errorJson = JSON.parse(errorText)
        const errorMessage = errorJson.error?.message || errorJson.error || response.statusText
        throw new Error(`Cloudinary upload failed: ${errorMessage}`)
      } catch {
        throw new Error(`Cloudinary upload failed (${response.status}): ${errorText}`)
      }
    }

    const result = await response.json()
    
    if (!result.secure_url) {
      console.error('Cloudinary response missing secure_url:', result)
      throw new Error('Cloudinary response missing secure_url')
    }
    
    console.log('Cloudinary upload successful:', result.secure_url)
    return result.secure_url
  } catch (error: any) {
    // Re-throw with more context
    console.error('Cloudinary upload exception:', {
      message: error.message,
      stack: error.stack,
      fileName,
      fileSize: buffer.length
    })
    
    if (error.message?.includes('Cloudinary')) {
      throw error
    }
    throw new Error(`Cloudinary upload failed: ${error.message || 'Unknown error'}`)
  }
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

    let url: string

    // Check if we're in production/Vercel environment
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
    
    // Check Cloudinary configuration (this logs diagnostic info)
    const cloudinaryConfigured = isCloudinaryConfigured()
    
    // In production, ALWAYS require Cloudinary - never try filesystem
    if (isProduction && !cloudinaryConfigured) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME
      const apiKey = process.env.CLOUDINARY_API_KEY
      const apiSecret = process.env.CLOUDINARY_API_SECRET
      
      console.error('Cloudinary not configured in production:', {
        hasCloudName: !!cloudName,
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        cloudNameValue: cloudName ? `${cloudName.substring(0, 3)}...` : 'MISSING',
        apiKeyValue: apiKey ? `${apiKey.substring(0, 3)}...` : 'MISSING',
        apiSecretValue: apiSecret ? 'SET' : 'MISSING',
        allEnvKeys: Object.keys(process.env).filter(k => k.includes('CLOUDINARY'))
      })
      
      return NextResponse.json(
        { 
          error: 'File system is read-only. Please configure Cloudinary for image uploads.',
          requiresCloudStorage: true,
          setup: {
            message: 'Cloudinary environment variables are missing or incorrect. Set these in Vercel:',
            variables: [
              'CLOUDINARY_CLOUD_NAME - Your Cloudinary cloud name',
              'CLOUDINARY_API_KEY - Your Cloudinary API key',
              'CLOUDINARY_API_SECRET - Your Cloudinary API secret',
            ],
            instructions: [
              '1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables',
              '2. Make sure variables are set for Production, Preview, AND Development environments',
              '3. Verify variable names are EXACTLY: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (case-sensitive, no spaces)',
              '4. Check that values don\'t have leading/trailing spaces',
              '5. Redeploy after adding variables (or wait a few minutes for them to propagate)',
              '6. Get credentials from https://cloudinary.com/console',
            ],
            diagnostic: {
              hasCloudName: !!cloudName,
              hasApiKey: !!apiKey,
              hasApiSecret: !!apiSecret,
              cloudNameLength: cloudName?.length || 0,
              apiKeyLength: apiKey?.length || 0,
              apiSecretLength: apiSecret?.length || 0,
              nodeEnv: process.env.NODE_ENV,
              vercelEnv: process.env.VERCEL_ENV
            }
          }
        },
        { status: 500 }
      )
    }
    
    // Try Cloudinary if configured
    if (cloudinaryConfigured) {
      try {
        url = await uploadToCloudinary(file, fileName)
        console.log('Customer image uploaded to Cloudinary:', url)
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
                  '2. Check that your Cloudinary account is active and not over limits',
                  '3. Verify API key and secret are correct in Cloudinary dashboard',
                  '4. Check Vercel function logs for detailed error messages',
                  '5. Test your credentials at https://cloudinary.com/console',
                ]
              }
            },
            { status: 500 }
          )
        }
        
        // In development, fall back to local filesystem
        try {
          url = await uploadToLocalFilesystem(file, fileName)
          console.log('Customer image uploaded to local filesystem (Cloudinary failed):', url)
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
      // Cloudinary not configured - only allow filesystem in development
      if (!isProduction) {
        // Fall back to local filesystem (development only)
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
      } else {
        // This should never happen in production (we check above), but just in case
        return NextResponse.json(
          { 
            error: 'Cloudinary is required but not configured. Please set environment variables in Vercel.',
            requiresCloudStorage: true
          },
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
