'use client'

import { useEffect } from 'react'

/**
 * Client component that suppresses console.log in production
 * and handles unhandled promise rejections from third-party scripts
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

      // Handle unhandled promise rejections (like "Failed to fetch" from third-party scripts)
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        // Check if it's a "Failed to fetch" error from third-party scripts
        const errorMessage = event.reason?.message || event.reason?.toString() || ''
        const errorStack = event.reason?.stack || ''
        
        // Filter out known third-party errors that don't affect functionality
        const isThirdPartyError = 
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('postUserData') ||
          errorStack.includes('postUserData') ||
          errorStack.includes('accounts.google.com') ||
          errorStack.includes('gsi/client')
        
        if (isThirdPartyError) {
          // Suppress third-party fetch errors (they're usually harmless)
          event.preventDefault()
          if (process.env.NODE_ENV === 'development') {
            console.warn('Suppressed third-party fetch error:', errorMessage)
          }
          return
        }
        
        // Log other unhandled rejections in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Unhandled promise rejection:', event.reason)
        }
      }

      window.addEventListener('unhandledrejection', handleUnhandledRejection)

      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      }
    } catch (error) {
      // Silently fail if there's an error - don't break the app
      console.error('ConsoleSuppressor error:', error)
    }
  }, [])

  return null // This component doesn't render anything
}
