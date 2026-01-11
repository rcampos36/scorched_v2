import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const subscriptionsFilePath = path.join(process.cwd(), 'data', 'newsletter-subscriptions.json')

// Email sending function - supports multiple email services
async function sendEmail(to: string, subject: string, html: string) {
  // Try Resend first (recommended - easy setup)
  const resendApiKey = process.env.RESEND_API_KEY
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  
  if (resendApiKey) {
    try {
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

      if (!response.ok) {
        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: responseText || 'Unknown error' }
        }
        throw new Error(`Resend API error (${response.status}): ${errorData.message || errorData.error || JSON.stringify(errorData)}`)
      }

      const data = JSON.parse(responseText)
      return { success: true, provider: 'resend', id: data.id }
    } catch (error: any) {
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

      return { success: true, provider: 'sendgrid' }
    } catch (error: any) {
      throw error
    }
  }

  // If no email service configured, log and return success (for development)
  console.warn('=== EMAIL SERVICE NOT CONFIGURED ===')
  console.log('To:', to)
  console.log('Subject:', subject)
  console.log('HTML preview:', html.substring(0, 200) + '...')
  
  return { success: true, provider: 'console-log', note: 'Email service not configured' }
}

function generateNewsletterEmail(subject: string, content: string) {
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
        .message { background-color: white; padding: 20px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        a { color: #ec4899; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Newsletter Update</h1>
        </div>
        <div class="content">
          <div class="message">
            ${content.replace(/\n/g, '<br>')}
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            You're receiving this email because you subscribed to our newsletter.
          </p>
        </div>
        <div class="footer">
          <p>Thank you for being part of our community!</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subject, content } = body

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      )
    }

    // Read subscriptions
    let subscriptions = []
    try {
      const fileContents = await fs.readFile(subscriptionsFilePath, 'utf8')
      subscriptions = JSON.parse(fileContents)
    } catch (error) {
      return NextResponse.json(
        { error: 'No newsletter subscriptions found' },
        { status: 404 }
      )
    }

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No newsletter subscriptions found' },
        { status: 404 }
      )
    }

    // Generate email HTML
    const html = generateNewsletterEmail(subject, content)

    // Send emails to all subscribers
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      provider: ''
    }

    for (const subscription of subscriptions) {
      try {
        const result = await sendEmail(subscription.email, subject, html)
        results.success++
        if (!results.provider) {
          results.provider = result.provider
        }
      } catch (error: any) {
        results.failed++
        results.errors.push(`${subscription.email}: ${error.message || 'Failed to send'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Group email sent to ${results.success} subscribers${results.failed > 0 ? `, ${results.failed} failed` : ''}`,
      results: {
        total: subscriptions.length,
        success: results.success,
        failed: results.failed,
        errors: results.errors,
        provider: results.provider
      }
    })
  } catch (error: any) {
    console.error('Group email sending error:', error.message || error)
    return NextResponse.json(
      { 
        error: 'Failed to send group email',
        details: error.message || 'Unknown error',
        suggestion: 'Check server logs for more details. Verify RESEND_API_KEY and RESEND_FROM_EMAIL in .env.local'
      },
      { status: 500 }
    )
  }
}
