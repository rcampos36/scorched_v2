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
 * Get JSON data - prioritizes blob storage (source of truth) if configured
 * Falls back to local files only if blob storage is not configured or fails
 * In serverless environments, blob storage is the primary source since local files are read-only
 */
export async function getJsonDataFallback<T>(blobPath: string, localFilePath: string): Promise<T | null> {
  // If blob storage is configured, try it first (it's the source of truth)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blobData = await getJsonData<T>(blobPath)
      if (blobData !== null) {
        console.log(`Reading ${blobPath} from blob storage`)
        
        // Try to sync to local file for development convenience (but don't fail if it doesn't work)
        try {
          const { promises: fs } = await import('fs')
          const path = await import('path')
          const filePath = path.join(process.cwd(), localFilePath)
          const blobContent = JSON.stringify(blobData, null, 2)
          const dataDir = path.dirname(filePath)
          
          try {
            await fs.access(dataDir)
          } catch {
            await fs.mkdir(dataDir, { recursive: true })
          }
          
          await fs.writeFile(filePath, blobContent, 'utf8')
          console.log(`✓ Synced blob storage data to local file ${localFilePath}`)
        } catch (syncError: any) {
          // In serverless environments, local files are read-only - this is expected
          if (syncError.code === 'EROFS' || syncError.message?.includes('read-only file system')) {
            console.log(`Reading from blob storage (local file system is read-only)`)
          } else {
            console.warn(`Failed to sync blob data to local file:`, syncError.message)
          }
        }
        
        return blobData
      }
    } catch (blobError: any) {
      console.warn(`Failed to read from blob storage for ${blobPath}:`, blobError.message)
      // Fall through to try local file
    }
  }
  
  // Fallback to local file if blob storage is not configured or failed
  try {
    const { promises: fs } = await import('fs')
    const path = await import('path')
    const filePath = path.join(process.cwd(), localFilePath)
    const fileContents = await fs.readFile(filePath, 'utf8')
    console.log(`Reading ${localFilePath} from local file system`)
    return JSON.parse(fileContents) as T
  } catch (error: any) {
    // If local file doesn't exist either, return null
    console.warn(`File ${localFilePath} not found in local file system`)
    return null
  }
}

/**
 * Save JSON data - prioritizes blob storage as the source of truth
 * Also saves to local file system for development convenience (if writable)
 * In serverless environments, blob storage is the primary storage since local files are read-only
 */
export async function saveJsonDataFallback<T>(blobPath: string, localFilePath: string, data: T): Promise<void> {
  const jsonContent = JSON.stringify(data, null, 2)
  let localSaveSuccess = false
  let blobSaveSuccess = false
  
  // PRIORITY: Save to blob storage first (source of truth, works in all environments)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      console.log(`💾 Saving ${blobPath} to blob storage...`)
      await saveJsonData(blobPath, data)
      console.log(`✓ Saved to blob storage`)
      blobSaveSuccess = true
    } catch (blobError: any) {
      console.error(`✗ Failed to save to blob storage:`, blobError.message)
      // This is critical - throw if blob storage fails
      throw new Error(`Failed to save to blob storage: ${blobError.message}`)
    }
  }
  
  // Also try to save to local file system for development convenience
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
    
    console.log(`💾 Saving ${localFilePath} to local file system...`)
    await fs.writeFile(filePath, jsonContent, 'utf8')
    
    // Force file system sync to ensure data is written to disk
    try {
      const fileHandle = await fs.open(filePath, 'r+')
      await fileHandle.sync()
      await fileHandle.close()
      console.log(`✓ File synced to disk`)
    } catch (syncError: any) {
      // In serverless, this is expected - don't fail
      if (syncError.code === 'EROFS' || syncError.message?.includes('read-only file system')) {
        console.log(`Local file system is read-only (serverless environment) - blob storage is the source of truth`)
        localSaveSuccess = false // Mark as not saved, but don't throw
      } else {
        console.warn(`⚠ Warning: Could not sync file to disk:`, syncError.message)
      }
    }
    
    // Verify the file was written correctly (only if we're not in read-only mode)
    try {
      await new Promise(resolve => setTimeout(resolve, 50)) // Small delay before verification
      const stats = await fs.stat(filePath)
      if (stats.size !== jsonContent.length) {
        throw new Error(`File size mismatch: expected ${jsonContent.length} bytes, got ${stats.size} bytes`)
      }
      
      // Read back and verify content matches
      const readBack = await fs.readFile(filePath, 'utf8')
      if (readBack !== jsonContent) {
        throw new Error(`File content mismatch - content doesn't match what was written`)
      }
      
      console.log(`✓ Local file verified - size: ${stats.size} bytes, modified: ${stats.mtime.toISOString()}`)
      localSaveSuccess = true
    } catch (verifyError: any) {
      if (verifyError.code === 'EROFS' || verifyError.message?.includes('read-only file system')) {
        console.log(`Local file system is read-only - blob storage is the source of truth`)
        localSaveSuccess = false
      } else {
        throw verifyError
      }
    }
  } catch (localError: any) {
    // In serverless environments, local files are read-only - this is expected
    if (localError.code === 'EROFS' || localError.message?.includes('read-only file system')) {
      console.log(`Local file system is read-only (serverless environment) - blob storage is the source of truth`)
      localSaveSuccess = false
    } else {
      console.warn(`⚠ Failed to save to local file system:`, localError.message)
      localSaveSuccess = false
    }
  }
  
  // Success summary
  if (blobSaveSuccess && localSaveSuccess) {
    console.log(`✓ Both blob storage and local file are in sync`)
  } else if (blobSaveSuccess && !localSaveSuccess) {
    console.log(`✓ Saved to blob storage (local file system is read-only in serverless environment)`)
  } else if (!blobSaveSuccess) {
    throw new Error(`Failed to save ${localFilePath} - blob storage save failed`)
  }
}

/**
 * Sync data from blob storage to local file
 * Useful for ensuring local files are up to date with blob storage
 */
export async function syncBlobToLocal<T>(blobPath: string, localFilePath: string): Promise<{ data: T | null; error?: string }> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const error = 'Blob storage not configured, cannot sync'
    console.warn(error)
    return { data: null, error }
  }

  try {
    const blobData = await getJsonData<T>(blobPath)
    if (blobData === null) {
      const error = `No data found in blob storage for ${blobPath}`
      console.warn(error)
      return { data: null, error }
    }

    // Try to write to local file system (works in development, not in serverless)
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

      const jsonContent = JSON.stringify(blobData, null, 2)
      await fs.writeFile(filePath, jsonContent, 'utf8')
      
      // Force sync
      const fileHandle = await fs.open(filePath, 'r+')
      await fileHandle.sync()
      await fileHandle.close()
      
      console.log(`✓ Synced ${blobPath} from blob storage to ${localFilePath}`)
    } catch (writeError: any) {
      // In serverless environments (like Vercel), file system is read-only
      // This is expected and not a failure - the data is available from blob storage
      if (writeError.code === 'EROFS' || writeError.message?.includes('read-only file system')) {
        console.log(`✓ Retrieved ${blobPath} from blob storage (read-only file system, skipping local write)`)
      } else {
        // For other write errors, log but don't fail the sync
        console.warn(`⚠ Could not write ${localFilePath} to local file system: ${writeError.message}`)
      }
    }
    
    // Return success since we successfully retrieved data from blob storage
    return { data: blobData }
  } catch (error: any) {
    const errorMsg = `Failed to sync ${blobPath} to ${localFilePath}: ${error.message}`
    console.error(errorMsg)
    return { data: null, error: errorMsg }
  }
}
