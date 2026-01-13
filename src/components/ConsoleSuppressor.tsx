'use client'

import { useEffect } from 'react'

/**
 * Client component that suppresses console.log in production
 * This prevents development/debugging code from showing console output
 */
export default function ConsoleSuppressor() {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
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
  }, [])

  return null // This component doesn't render anything
}
