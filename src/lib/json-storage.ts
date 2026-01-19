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
 * If blob storage has data but local doesn't, syncs blob to local
 */
export async function getJsonDataFallback<T>(blobPath: string, localFilePath: string): Promise<T | null> {
  const { promises: fs } = await import('fs')
  const path = await import('path')
  const filePath = path.join(process.cwd(), localFilePath)
  
  // Always try local file first (both dev and production)
  try {
    const fileContents = await fs.readFile(filePath, 'utf8')
    console.log(`Reading ${localFilePath} from local file system`)
    return JSON.parse(fileContents) as T
  } catch (error: any) {
    // If local file doesn't exist, try blob storage if configured
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      console.log(`Local file not found, trying blob storage for ${blobPath}`)
      const blobData = await getJsonData<T>(blobPath)
      if (blobData !== null) {
        // Sync blob data to local file for future reads
        try {
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
          console.warn(`Failed to sync blob data to local file:`, syncError.message)
        }
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
  let localSaveSuccess = false
  let blobSaveSuccess = false
  
  // CRITICAL: Always save to local file system first - this is the primary storage
  // Retry logic to ensure local file is always written
  let retryCount = 0
  const maxRetries = 3
  
  while (!localSaveSuccess && retryCount < maxRetries) {
    try {
      if (retryCount > 0) {
        console.log(`  Retry attempt ${retryCount} of ${maxRetries - 1}...`)
        await new Promise(resolve => setTimeout(resolve, 100 * retryCount)) // Small delay between retries
      }
      
      console.log(`💾 Saving ${localFilePath} to local file system...`)
      console.log(`  File path: ${filePath}`)
      console.log(`  Content length: ${jsonContent.length} bytes`)
      
      // Write the file
      await fs.writeFile(filePath, jsonContent, 'utf8')
      console.log(`✓ Written to ${localFilePath}`)
      
      // Force file system sync to ensure data is written to disk
      try {
        const fileHandle = await fs.open(filePath, 'r+')
        await fileHandle.sync()
        await fileHandle.close()
        console.log(`✓ File synced to disk`)
      } catch (syncError: any) {
        console.warn(`⚠ Warning: Could not sync file to disk:`, syncError.message)
      }
      
      // Verify the file was written correctly
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
    } catch (localError: any) {
      retryCount++
      console.error(`✗ Attempt ${retryCount} failed to save ${localFilePath} to local file system:`)
      console.error(`  Error: ${localError.message}`)
      if (retryCount >= maxRetries) {
        console.error(`  Stack: ${localError.stack}`)
        console.error(`✗ CRITICAL: Failed to save after ${maxRetries} attempts`)
      }
    }
  }
  
  // Also save to blob storage if configured
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      console.log(`💾 Saving ${blobPath} to blob storage...`)
      await saveJsonData(blobPath, data)
      console.log(`✓ Saved to blob storage`)
      blobSaveSuccess = true
    } catch (blobError: any) {
      console.error(`✗ Failed to save to blob storage:`, blobError.message)
      // Don't throw - continue to try syncing
    }
  }
  
  // If local save failed but blob save succeeded, sync from blob to local
  if (!localSaveSuccess && blobSaveSuccess) {
    console.log(`⚠ Local save failed but blob save succeeded. Syncing from blob to local...`)
    try {
      const blobData = await getJsonData<T>(blobPath)
      if (blobData !== null) {
        const blobContent = JSON.stringify(blobData, null, 2)
        await fs.writeFile(filePath, blobContent, 'utf8')
        const fileHandle = await fs.open(filePath, 'r+')
        await fileHandle.sync()
        await fileHandle.close()
        console.log(`✓ Synced from blob storage to local file`)
        localSaveSuccess = true
      }
    } catch (syncError: any) {
      console.error(`✗ Failed to sync from blob to local:`, syncError.message)
    }
  }
  
  // If both failed, throw error
  if (!localSaveSuccess && !blobSaveSuccess) {
    throw new Error(`Failed to save ${localFilePath} to both local file system and blob storage`)
  }
  
  // If only one succeeded, log warning but don't fail
  if (localSaveSuccess && !blobSaveSuccess) {
    console.warn(`⚠ Local file saved but blob storage failed - local file is the source of truth`)
  }
  if (!localSaveSuccess && blobSaveSuccess) {
    console.warn(`⚠ Blob storage saved but local file failed - synced from blob to local`)
  }
  if (localSaveSuccess && blobSaveSuccess) {
    console.log(`✓ Both local file and blob storage are in sync`)
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
    return { data: blobData }
  } catch (error: any) {
    const errorMsg = `Failed to sync ${blobPath} to ${localFilePath}: ${error.message}`
    console.error(errorMsg)
    return { data: null, error: errorMsg }
  }
}
