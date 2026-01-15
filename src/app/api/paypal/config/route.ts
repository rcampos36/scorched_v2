import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to get PayPal client ID at runtime
 * This allows the key to be read from Hostinger's environment variables
 * instead of being embedded at build time
 */
export async function GET(request: NextRequest) {
  try {
    // Read from environment variables at runtime (from Hostinger hosting)
    // Try multiple variable name variations for compatibility
    const clientId = 
      process.env.PAYPAL_CLIENT_ID || 
      process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
      process.env.paypal_client_id || // lowercase
      process.env.PAYPAL_CLIENTID || // no underscore
    
    // Get all PayPal-related environment variables for debugging
    const paypalEnvVars = Object.keys(process.env)
      .filter(key => key.toUpperCase().includes('PAYPAL'))
      .reduce((acc: any, key) => {
        const value = process.env[key]
        // Don't expose full values in response, just show if they exist and first few chars
        acc[key] = value ? `${value.substring(0, 10)}... (length: ${value.length})` : 'NOT SET'
        return acc
      }, {})
    
    // Log for debugging (in production, check server logs)
    if (!clientId) {
      console.error('PayPal client ID not found in environment variables')
      console.error('Checked variables: PAYPAL_CLIENT_ID, NEXT_PUBLIC_PAYPAL_CLIENT_ID, paypal_client_id, PAYPAL_CLIENTID')
      console.error('All PayPal-related env vars:', paypalEnvVars)
      console.error('Total env vars count:', Object.keys(process.env).length)
      
      // Also check if any PayPal vars exist at all
      const hasAnyPaypalVars = Object.keys(process.env).some(key => 
        key.toUpperCase().includes('PAYPAL')
      )
      console.error('Has any PayPal-related env vars:', hasAnyPaypalVars)
      
      return NextResponse.json(
        { 
          error: 'PayPal client ID is not configured',
          message: 'Please set PAYPAL_CLIENT_ID in your Hostinger hosting environment variables. After setting, restart the application with: pm2 restart scorched-v2',
          checkedVariables: ['PAYPAL_CLIENT_ID', 'NEXT_PUBLIC_PAYPAL_CLIENT_ID', 'paypal_client_id', 'PAYPAL_CLIENTID'],
          debug: {
            hasAnyPaypalVars: hasAnyPaypalVars,
            paypalEnvVars: Object.keys(paypalEnvVars),
            nodeEnv: process.env.NODE_ENV,
            // In development, show more details
            ...(process.env.NODE_ENV !== 'production' && { paypalEnvVarKeys: Object.keys(paypalEnvVars) })
          },
          troubleshooting: [
            '1. Verify the variable name is exactly: PAYPAL_CLIENT_ID (case-sensitive)',
            '2. Check that the variable is set in Hostinger hosting environment variables (not in .env files)',
            '3. After setting, restart the application: pm2 restart scorched-v2',
            '4. Variables are read at runtime, so a restart is required after changes',
            '5. Ensure there are no extra spaces or quotes around the variable value'
          ]
        },
        { status: 500 }
      )
    }

    // Determine if we're in sandbox or live mode
    const environment = 
      process.env.PAYPAL_ENVIRONMENT || 
      process.env.paypal_environment ||
      'sandbox'

    console.log('PayPal config loaded successfully:', {
      hasClientId: !!clientId,
      clientIdLength: clientId?.length,
      environment: environment
    })

    return NextResponse.json({
      clientId,
      environment,
    })
  } catch (error: any) {
    console.error('Error getting PayPal config:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get PayPal configuration' },
      { status: 500 }
    )
  }
}
