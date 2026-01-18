import { NextRequest, NextResponse } from 'next/server'

/**
 * Create a PayPal order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency = 'USD', items, orderId } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Check PayPal configuration - all variables are server-side only
    const clientId = process.env.PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET || process.env.paypal_client_secret
    const environment = process.env.PAYPAL_ENVIRONMENT || 'sandbox'

    if (!clientId || !clientSecret) {
      console.error('PayPal configuration missing:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        environment: environment,
        envVars: Object.keys(process.env).filter(key => key.includes('PAYPAL'))
      })
      return NextResponse.json(
        { 
          error: 'PayPal is not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET (both server-side only) in your environment variables.',
          debug: {
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret,
            environment: environment
          }
        },
        { status: 500 }
      )
    }

    // Get PayPal access token
    const baseUrl = environment === 'production' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com'

    // Set Authorization header for basic auth
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('PayPal token error:', errorText)
      let errorMessage = 'Failed to authenticate with PayPal'
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error_description) {
          errorMessage = `PayPal authentication failed: ${errorData.error_description}`
        } else if (errorData.message) {
          errorMessage = `PayPal authentication failed: ${errorData.message}`
        }
      } catch (e) {
        // Use default error message if parsing fails
      }
      return NextResponse.json(
        { error: errorMessage, details: errorText },
        { status: 500 }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Prepare purchase unit - start simple with just the amount
    const purchaseUnit: any = {
      amount: {
        currency_code: currency,
        value: amount.toFixed(2),
      },
    }

    // Try to include items if provided and valid
    // PayPal allows orders with or without items - we'll include items if they're valid
    if (items && Array.isArray(items) && items.length > 0) {
      // Filter and validate items
      const validItems = items
        .filter(item => {
          if (!item) return false
          const hasName = !!(item.title || item.name)
          const hasValidPrice = typeof item.price === 'number' && item.price >= 0 && !isNaN(item.price)
          const hasValidQuantity = typeof item.quantity === 'number' && item.quantity > 0 && !isNaN(item.quantity)
          return hasName && hasValidPrice && hasValidQuantity
        })
        .map((item: any) => {
          const itemName = String(item.title || item.name || 'Item').trim().substring(0, 127)
          const itemPrice = Math.max(0, parseFloat(Number(item.price).toFixed(2)))
          const itemQuantity = Math.max(1, parseInt(Number(item.quantity).toString(), 10))
          
          return {
            name: itemName || 'Item',
            quantity: itemQuantity.toString(),
            unit_amount: {
              currency_code: currency,
              value: itemPrice.toFixed(2),
            },
          }
        })

      // Only add items if we have valid ones
      if (validItems.length > 0) {
        // Calculate total from items
        const itemTotal = validItems.reduce((sum, item) => {
          const price = parseFloat(item.unit_amount.value)
          const qty = parseInt(item.quantity, 10)
          return sum + (price * qty)
        }, 0)

        const calculatedItemTotal = parseFloat(itemTotal.toFixed(2))
        const orderTotal = parseFloat(amount.toFixed(2))
        const difference = Math.abs(orderTotal - calculatedItemTotal)

        // PayPal REQUIRES: If items are included, breakdown.item_total MUST be present
        purchaseUnit.items = validItems
        
        // Always include breakdown.item_total when items are present
        purchaseUnit.amount.breakdown = {
          item_total: {
            currency_code: currency,
            value: calculatedItemTotal.toFixed(2),
          },
        }

        // If totals don't match, add handling for the difference
        if (difference > 0.01 && orderTotal > calculatedItemTotal) {
          const handlingAmount = (orderTotal - calculatedItemTotal).toFixed(2)
          purchaseUnit.amount.breakdown.handling = {
            currency_code: currency,
            value: handlingAmount,
          }
          
          // Final amount must equal sum of breakdown components
          const finalTotal = (calculatedItemTotal + parseFloat(handlingAmount)).toFixed(2)
          purchaseUnit.amount.value = finalTotal
        } else {
          // Totals match - use item_total as the amount
          // PayPal requires: amount.value = sum of breakdown components
          purchaseUnit.amount.value = calculatedItemTotal.toFixed(2)
        }
      }
      // If no valid items, fall through to simple amount-only structure
    }

    if (orderId) {
      purchaseUnit.custom_id = orderId
    }

    // Log the order structure for debugging (remove in production or add auth)
    console.log('PayPal order payload:', JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [purchaseUnit],
    }, null, 2))

    // Create PayPal order
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `order-${Date.now()}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [purchaseUnit],
      }),
    })

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text()
      console.error('PayPal order creation error:', errorText)
      console.error('Order payload that failed:', JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [purchaseUnit],
      }, null, 2))
      
      let errorMessage = 'Failed to create PayPal order'
      let errorDetails = []
      
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.message) {
          errorMessage = `PayPal order creation failed: ${errorData.message}`
        }
        
        if (errorData.details && Array.isArray(errorData.details)) {
          errorDetails = errorData.details.map((detail: any) => ({
            field: detail.field,
            issue: detail.issue,
            description: detail.description,
          }))
          
          if (errorData.details.length > 0) {
            const firstDetail = errorData.details[0]
            errorMessage = `PayPal validation error: ${firstDetail.description || firstDetail.issue}${firstDetail.field ? ` (field: ${firstDetail.field})` : ''}`
          }
        }
      } catch (e) {
        console.error('Failed to parse PayPal error:', e)
      }
      
      return NextResponse.json(
        { 
          error: errorMessage, 
          details: errorText,
          validationErrors: errorDetails,
          payload: purchaseUnit, // Include payload for debugging
        },
        { status: 500 }
      )
    }

    const orderData = await orderResponse.json()

    return NextResponse.json({
      orderId: orderData.id,
      status: orderData.status,
    })
  } catch (error: any) {
    console.error('Error creating PayPal order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create PayPal order' },
      { status: 500 }
    )
  }
}
