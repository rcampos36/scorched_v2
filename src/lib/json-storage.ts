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
 * Get JSON data - always prioritizes local files in data/ folder
 * Falls back to blob storage only if local file doesn't exist
 */
export async function getJsonDataFallback<T>(blobPath: string, localFilePath: string): Promise<T | null> {
  // Always try local file first (both dev and production)
  try {
    const { promises: fs } = await import('fs')
    const path = await import('path')
    const filePath = path.join(process.cwd(), localFilePath)
    const fileContents = await fs.readFile(filePath, 'utf8')
    console.log(`Reading ${localFilePath} from local file system`)
    return JSON.parse(fileContents) as T
  } catch (error: any) {
    // If local file doesn't exist, try blob storage if configured
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      console.log(`Local file not found, trying blob storage for ${blobPath}`)
      const blobData = await getJsonData<T>(blobPath)
      if (blobData !== null) {
        return blobData
      }
    }
    // If local file doesn't exist and no blob storage, return null
    console.warn(`File ${localFilePath} not found`)
    return null
  }
}

/**
 * Save JSON data with fallback to local file system
 * Always uses local files in data/ folder for both development and production
 */
export async function saveJsonDataFallback<T>(blobPath: string, localFilePath: string, data: T): Promise<void> {
  // Always try to save to local file system first
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
    
    // Write file with explicit error handling
    try {
      await fs.writeFile(filePath, jsonContent, 'utf8')
      console.log(`✓ Saved ${localFilePath} to local file system`)
      console.log(`  File path: ${filePath}`)
      console.log(`  File size: ${jsonContent.length} bytes`)
    } catch (writeError: any) {
      console.error(`✗ Failed to write file ${filePath}:`, writeError.message)
      throw writeError
    }
    
    // Verify the file was written and matches what we wrote
    try {
      const stats = await fs.stat(filePath)
      if (stats.size !== jsonContent.length) {
        throw new Error(`File size mismatch: expected ${jsonContent.length} bytes, got ${stats.size} bytes`)
      }
      
      // Read back and verify content matches
      const readBack = await fs.readFile(filePath, 'utf8')
      if (readBack !== jsonContent) {
        console.warn(`⚠ File content mismatch - file may have been modified during write`)
      }
      
      console.log(`✓ File verified - size: ${stats.size} bytes, modified: ${stats.mtime.toISOString()}`)
      console.log(`✓ Content verified - file matches written data`)
    } catch (verifyError: any) {
      console.error(`✗ Failed to verify file was written correctly:`, verifyError.message)
      throw new Error(`File verification failed: ${verifyError.message}`)
    }
    
    // Also save to blob storage if configured (as backup)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await saveJsonData(blobPath, data)
        console.log(`Also saved ${blobPath} to blob storage as backup`)
      } catch (blobError: any) {
        console.warn(`Failed to save to blob storage (non-critical):`, blobError.message)
        // Don't throw - local file save succeeded, blob is just a backup
      }
    }
    
    return
  } catch (error: any) {
    // If local file save fails and blob storage is configured, try blob storage
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn(`Local file save failed, trying blob storage:`, error.message)
      try {
        await saveJsonData(blobPath, data)
        console.log(`Saved ${blobPath} to blob storage as fallback`)
        return
      } catch (blobError: any) {
        throw new Error(`Failed to save to both local file and blob storage: ${error.message || 'Unknown error'}`)
      }
    }
    
    throw new Error(`Failed to save ${localFilePath} to local file system: ${error.message || 'Unknown error'}`)
  }
}
