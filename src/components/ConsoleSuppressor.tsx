'use client'

import { useEffect } from 'react'

/**
 * Client component that suppresses console.log in production
 * This prevents development/debugging code from showing console output
 */
export default function ConsoleSuppressor() {
  useEffect(() => {
    try {
      // Check if we're in production (safely handle undefined env)
      const isProduction = typeof process !== 'undefined' && 
                          process.env && 
                          process.env.NODE_ENV === 'production'
      
      if (typeof window !== 'undefined' && isProduction) {
        // Suppress console.log, debug, and info in production
        const originalLog = console.log
        const originalDebug = console.debug
        const originalInfo = console.info

        console.log = () => {}
        console.debug = () => {}
        console.info = () => {}

        // Cleanup on unmount (restore original methods)
        return () => {
          console.log = originalLog
          console.debug = originalDebug
          console.info = originalInfo
        }
      }
    } catch (error) {
      // Silently fail if there's an error - don't break the app
      console.error('ConsoleSuppressor error:', error)
    }
  }, [])

  return null // This component doesn't render anything
}
