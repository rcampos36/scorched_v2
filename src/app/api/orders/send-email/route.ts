import { NextRequest, NextResponse } from 'next/server'

// Email sending function - supports multiple email services
async function sendEmail(to: string, subject: string, html: string) {
  // Try Resend first (recommended - easy setup)
  const resendApiKey = process.env.RESEND_API_KEY
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  
  if (resendApiKey) {
    try {
      console.log('Attempting to send email via Resend...')
      console.log('From:', resendFromEmail)
      console.log('To:', to)
      console.log('Subject:', subject)
      console.log('API Key present:', !!resendApiKey, 'Length:', resendApiKey?.length)
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: resendFromEmail,
          to,
          subject,
          html,
        }),
      })

      const responseText = await response.text()
      console.log('Resend API Response Status:', response.status)
      console.log('Resend API Response:', responseText)

      if (!response.ok) {
        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: responseText || 'Unknown error' }
        }
        console.error('Resend API Error:', errorData)
        throw new Error(`Resend API error (${response.status}): ${errorData.message || errorData.error || JSON.stringify(errorData)}`)
      }

      const data = JSON.parse(responseText)
      console.log('✅ Email sent successfully via Resend. Email ID:', data.id)
      return { success: true, provider: 'resend', id: data.id }
    } catch (error: any) {
      console.error('❌ Resend email error:', error.message || error)
      throw error
    }
  }

  // Fallback to SendGrid if configured
  if (process.env.SENDGRID_API_KEY) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com' },
          subject,
          content: [{ type: 'text/html', value: html }],
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`SendGrid API error: ${error}`)
      }

      console.log('Email sent via SendGrid')
      return { success: true, provider: 'sendgrid' }
    } catch (error: any) {
      console.error('SendGrid email error:', error)
      throw error
    }
  }

  // If no email service configured, log and return success (for development)
  console.warn('=== EMAIL SERVICE NOT CONFIGURED ===')
  console.log('To:', to)
  console.log('Subject:', subject)
  console.log('HTML preview:', html.substring(0, 200) + '...')
  console.log('=====================================')
  console.log('To enable email sending, configure one of:')
  console.log('1. Resend: Set RESEND_API_KEY and RESEND_FROM_EMAIL in .env.local')
  console.log('2. SendGrid: Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL in .env.local')
  console.log('See EMAIL_SETUP.md for instructions')
  
  // Return success so order creation doesn't fail
  return { success: true, provider: 'console-log', note: 'Email service not configured' }
}

// Color mapping for email display
const COLOR_MAP: Record<string, { label: string; hex: string }> = {
  black: { label: "Black", hex: "#000000" },
  white: { label: "White", hex: "#FFFFFF" },
  navy: { label: "Navy", hex: "#1E3A5F" },
  gray: { label: "Gray", hex: "#808080" },
  red: { label: "Red", hex: "#DC2626" },
  blue: { label: "Blue", hex: "#2563EB" },
  green: { label: "Green", hex: "#16A34A" },
  yellow: { label: "Yellow", hex: "#EAB308" },
  orange: { label: "Orange", hex: "#EA580C" },
  purple: { label: "Purple", hex: "#9333EA" },
  pink: { label: "Pink", hex: "#EC4899" },
  brown: { label: "Brown", hex: "#92400E" },
}

function generateOrderConfirmationEmail(order: any, baseUrl: string = '') {
  const { orderId, items, customer, total, orderDate } = order
  
  // Helper function to get absolute image URL
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return ''
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }
    // If baseUrl is provided, use it; otherwise use the path as-is (may not work in emails)
    return baseUrl ? `${baseUrl}${imagePath}` : imagePath
  }
  
  // Helper function to format color for display
  const formatColor = (color?: string) => {
    if (!color) return ''
    const colorInfo = COLOR_MAP[color.toLowerCase()]
    if (colorInfo) {
      return `<span style="display: inline-block; width: 16px; height: 16px; background-color: ${colorInfo.hex}; border: 1px solid #ddd; border-radius: 3px; vertical-align: middle; margin-right: 6px;"></span><span>${colorInfo.label}</span>`
    }
    // Fallback for unknown colors
    return `<span>${color.charAt(0).toUpperCase() + color.slice(1)}</span>`
  }
  
  const itemsHtml = items.map((item: any) => {
    const imageUrl = getImageUrl(item.image)
    const colorDisplay = item.color ? formatColor(item.color) : ''
    const sizeDisplay = item.size ? `<strong>Size:</strong> ${item.size}` : ''
    
    return `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #eee; vertical-align: top;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            ${imageUrl ? `
            <td style="padding-right: 15px; width: 100px; vertical-align: top;">
              <img src="${imageUrl}" alt="${item.title}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;" />
            </td>
            ` : ''}
            <td style="vertical-align: top;">
              <strong style="font-size: 16px; display: block; margin-bottom: 5px;">${item.title}</strong>
              <small style="color: #666; display: block; margin-bottom: 8px;">${item.description}</small>
              ${sizeDisplay ? `<div style="margin-bottom: 5px; font-size: 14px;">${sizeDisplay}</div>` : ''}
              ${colorDisplay ? `<div style="margin-bottom: 5px; font-size: 14px;"><strong>Color:</strong> ${colorDisplay}</div>` : ''}
            </td>
          </tr>
        </table>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: center; vertical-align: top;">
        <strong>${item.quantity}</strong>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right; vertical-align: top;">
        <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
      </td>
    </tr>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ec4899; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; }
        .order-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .total { font-size: 18px; font-weight: bold; text-align: right; padding-top: 10px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmation</h1>
        </div>
        <div class="content">
          <p>Dear ${customer.firstName} ${customer.lastName},</p>
          <p>Thank you for your order! We've received your order and will begin processing it shortly.</p>
          
          <div class="order-info">
            <h2>Order Details</h2>
            <p><strong>Order Number:</strong> ${orderId}</p>
            <p><strong>Order Date:</strong> ${new Date(orderDate).toLocaleDateString()}</p>
            
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd; width: 80px;">Quantity</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd; width: 100px;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div class="total">
              Total: $${total.toFixed(2)}
            </div>
          </div>
          
          <div class="order-info">
            <h2>Shipping Address</h2>
            <p>
              ${customer.firstName} ${customer.lastName}<br>
              ${customer.address}<br>
              ${customer.city}, ${customer.state} ${customer.zipCode}<br>
              ${customer.country}
            </p>
          </div>
          
          <p>We'll send you another email with tracking information once your order ships.</p>
          <p>If you have any questions, please contact us at 1-866-440-8237.</p>
        </div>
        <div class="footer">
          <p>Thank you for shopping with us!</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateShippingEmail(order: any) {
  const { orderId, items, customer, total, trackingNumber, carrier, shippedDate } = order
  
  // Generate tracking link based on carrier
  const getTrackingLink = (tracking: string, carrierName?: string) => {
    if (!carrierName) return `#`
    
    const trackingUpper = tracking.toUpperCase()
    switch (carrierName.toUpperCase()) {
      case 'USPS':
        return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`
      case 'UPS':
        return `https://www.ups.com/track?tracknum=${tracking}`
      case 'FEDEX':
        return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`
      case 'DHL':
        return `https://www.dhl.com/en/express/tracking.html?AWB=${tracking}`
      default:
        return `#`
    }
  }
  
  const trackingLink = getTrackingLink(trackingNumber || '', carrier)
  
  const itemsHtml = items.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.title}</strong> x ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; }
        .tracking-box { background-color: white; padding: 20px; margin: 15px 0; border-radius: 5px; border: 2px solid #10b981; text-align: center; }
        .tracking-number { font-size: 24px; font-weight: bold; color: #10b981; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Order Has Shipped! 🚀</h1>
        </div>
        <div class="content">
          <p>Dear ${customer.firstName} ${customer.lastName},</p>
          <p>Great news! Your order has been shipped and is on its way to you.</p>
          
          <div class="tracking-box">
            <h2>Tracking Information</h2>
            <p><strong>Order Number:</strong> ${orderId}</p>
            <p><strong>Shipped Date:</strong> ${new Date(shippedDate || new Date()).toLocaleDateString()}</p>
            ${carrier ? `<p style="margin-bottom: 10px;"><strong>Carrier:</strong> ${carrier}</p>` : ''}
            <div class="tracking-number">${trackingNumber || 'TRACK-' + orderId}</div>
            ${trackingNumber && trackingLink !== '#' ? `
              <p style="margin-top: 15px;">
                <a href="${trackingLink}" target="_blank" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Track Package${carrier ? ` on ${carrier}` : ''}
                </a>
              </p>
            ` : ''}
            <p style="margin-top: 10px; font-size: 14px; color: #666;">
              ${carrier ? `Track your package using the tracking number above on ${carrier}'s website.` : 'You can track your package using the tracking number above on the carrier\'s website.'}
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px;">
            <h2>Order Summary</h2>
            <table>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <p style="text-align: right; font-weight: bold; margin-top: 10px;">
              Total: $${total.toFixed(2)}
            </p>
          </div>
          
          <p>Your order is expected to arrive within 5-7 business days.</p>
          <p>If you have any questions, please contact us at 1-866-440-8237.</p>
        </div>
        <div class="footer">
          <p>Thank you for shopping with us!</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, order } = body

    if (!type || !order) {
      return NextResponse.json(
        { error: 'Type and order are required' },
        { status: 400 }
      )
    }

    let subject: string
    let html: string

    if (type === 'order-confirmation') {
      subject = `Order Confirmation - ${order.orderId}`
      // Get base URL from request for absolute image URLs in emails
      const baseUrl = request.nextUrl.origin
      html = generateOrderConfirmationEmail(order, baseUrl)
    } else if (type === 'shipping-notification') {
      subject = `Your Order Has Shipped - ${order.orderId}`
      html = generateShippingEmail(order)
    } else {
      return NextResponse.json(
        { error: 'Invalid email type' },
        { status: 400 }
      )
    }

    const result = await sendEmail(order.customer.email, subject, html)

    return NextResponse.json({ 
      success: true,
      provider: result.provider,
      emailId: result.id,
      message: `Email sent successfully via ${result.provider}`
    })
  } catch (error: any) {
    console.error('❌ Email sending error:', error.message || error)
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error.message || 'Unknown error',
        suggestion: 'Check server logs for more details. Verify RESEND_API_KEY and RESEND_FROM_EMAIL in .env.local'
      },
      { status: 500 }
    )
  }
}
