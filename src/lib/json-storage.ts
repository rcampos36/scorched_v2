import { put, head, list } from '@vercel/blob'

/**
 * Generic JSON storage utility for Vercel Blob Storage
 * Use this for storing JSON configuration files (header, footer, hero-slides, etc.)
 */

/**
 * Get JSON data from Vercel Blob Storage
 * Falls back to null if blob doesn't exist or on error
 */
export async function getJsonData<T>(blobPath: string): Promise<T | null> {
  try {
    // Check if BLOB_READ_WRITE_TOKEN is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn(`BLOB_READ_WRITE_TOKEN not configured. Cannot read ${blobPath} from blob storage.`)
      return null
    }

    let blobUrl: string | null = null
    
    // Try to get the blob using head() first (checks exact path)
    try {
      const blobInfo = await head(blobPath)
      blobUrl = blobInfo.url
    } catch (headError: any) {
      // If blob doesn't exist (404), return null
      if (headError.status === 404 || headError.message?.includes('not found') || headError.message?.includes('404')) {
        return null
      }
      // If it's a configuration error, return null gracefully
      if (headError.message?.includes('BLOB_READ_WRITE_TOKEN') || headError.message?.includes('token')) {
        console.warn(`Blob storage configuration error for ${blobPath}:`, headError.message)
        return null
      }
      // For other errors, try list as fallback
      try {
        const blobs = await list({ prefix: blobPath, limit: 1 })
        if (blobs.blobs.length > 0 && blobs.blobs[0].url) {
          blobUrl = blobs.blobs[0].url
        } else {
          return null
        }
      } catch (listError: any) {
        // If it's a configuration error, return null gracefully
        if (listError.message?.includes('BLOB_READ_WRITE_TOKEN') || listError.message?.includes('token')) {
          console.warn(`Blob storage configuration error for ${blobPath}:`, listError.message)
        }
        return null
      }
    }

    if (!blobUrl) {
      return null
    }

    // Fetch the blob content
    const response = await fetch(blobUrl)
    if (!response.ok) {
      console.warn(`Failed to fetch ${blobPath} from blob storage:`, response.statusText)
      return null
    }

    const content = await response.text()
    if (!content || content.trim() === '') {
      return null
    }

    return JSON.parse(content) as T
  } catch (error: any) {
    // If blob storage is not configured or blob doesn't exist, return null
    if (error.message?.includes('BLOB_READ_WRITE_TOKEN') || 
        error.message?.includes('not found') ||
        error.code === 'ENOENT' ||
        error.status === 404) {
      console.warn(`${blobPath} blob not found or blob storage not configured`)
      return null
    }
    
    console.error(`Error reading ${blobPath} from blob storage:`, error)
    return null
  }
}

/**
 * Save JSON data to Vercel Blob Storage
 */
export async function saveJsonData<T>(blobPath: string, data: T): Promise<void> {
  // Check if BLOB_READ_WRITE_TOKEN is configured
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const errorMsg = `BLOB_READ_WRITE_TOKEN is not configured. Please set BLOB_READ_WRITE_TOKEN in your Vercel environment variables. Cannot save ${blobPath} without blob storage.`
    console.error(errorMsg)
    throw new Error(errorMsg)
  }

  try {
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })

    // Upload/update the blob
    await put(blobPath, blob, {
      access: 'public',
      addRandomSuffix: false, // Use fixed path so we can find it later
    })
    
    console.log(`Successfully saved ${blobPath} to Vercel Blob Storage`)
  } catch (error: any) {
    console.error(`Error saving ${blobPath} to blob storage:`, error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      stack: error.stack,
    })
    
    // Provide helpful error message if blob storage is not configured
    if (error.message?.includes('BLOB_READ_WRITE_TOKEN') || 
        error.message?.includes('blob storage') ||
        !process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error(
        `Blob storage is not configured. Please set BLOB_READ_WRITE_TOKEN in your Vercel environment variables. The filesystem is read-only in Vercel serverless functions.`
      )
    }
    
    // Re-throw with more context
    throw new Error(`Failed to save ${blobPath} to blob storage: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Fallback to local file system for development
 * Only use this when BLOB_READ_WRITE_TOKEN is not set (local dev only)
 */
export async function getJsonDataFallback<T>(blobPath: string, localFilePath: string): Promise<T | null> {
  // If blob storage is configured, ONLY use blob storage (don't fall back to local files)
  // This ensures we always read from the same place we save to
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blobData = await getJsonData<T>(blobPath)
    return blobData // Return null if blob doesn't exist, don't fall back to local
  }

  // Only use local file system if blob storage is NOT configured (development only)
  if (process.env.NODE_ENV === 'development') {
    try {
      const { promises: fs } = await import('fs')
      const path = await import('path')
      const filePath = path.join(process.cwd(), localFilePath)
      const fileContents = await fs.readFile(filePath, 'utf8')
      return JSON.parse(fileContents) as T
    } catch (error) {
      // If local file doesn't exist either, return null
      return null
    }
  }

  return null
}

/**
 * Save JSON data with fallback to local file system for development
 * Only use this when BLOB_READ_WRITE_TOKEN is not set (local dev only)
 */
export async function saveJsonDataFallback<T>(blobPath: string, localFilePath: string, data: T): Promise<void> {
  // Try blob storage first if token is configured
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await saveJsonData(blobPath, data)
    return
  }

  // Fallback to local file system (development only)
  if (process.env.NODE_ENV === 'development') {
    try {
      const { promises: fs } = await import('fs')
      const path = await import('path')
      const filePath = path.join(process.cwd(), localFilePath)
      
      // Ensure directory exists
      const dataDir = path.dirname(filePath)
      try {
        await fs.access(dataDir)
      } catch {
        await fs.mkdir(dataDir, { recursive: true })
      }

      const jsonContent = JSON.stringify(data, null, 2)
      await fs.writeFile(filePath, jsonContent, 'utf8')
      console.log(`Saved ${localFilePath} to local file system (development mode)`)
      console.log(`File path: ${filePath}`)
      console.log(`File size: ${jsonContent.length} bytes`)
      // Verify the file was written
      try {
        const stats = await fs.stat(filePath)
        console.log(`File verified - size: ${stats.size} bytes, modified: ${stats.mtime}`)
      } catch (verifyError) {
        console.error(`Failed to verify file was written:`, verifyError)
      }
      return
    } catch (error: any) {
      throw new Error(`Failed to save ${localFilePath} to local file system: ${error.message || 'Unknown error'}`)
    }
  }

  throw new Error(
    `Cannot save ${blobPath}: BLOB_READ_WRITE_TOKEN is not configured and not in development mode. Please set BLOB_READ_WRITE_TOKEN in your Vercel environment variables.`
  )
}
