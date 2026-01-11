import { NextRequest, NextResponse } from 'next/server'

// Test endpoint to verify email configuration
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authCookie = request.cookies.get('admin-auth')
    if (!authCookie || authCookie.value !== 'authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resendApiKey = process.env.RESEND_API_KEY
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const sendgridApiKey = process.env.SENDGRID_API_KEY
    const sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL

    // Get test email from query parameter
    const testEmail = request.nextUrl.searchParams.get('email') || 'test@example.com'

    const config = {
      resend: {
        configured: !!resendApiKey,
        apiKeyLength: resendApiKey?.length || 0,
        fromEmail: resendFromEmail,
        apiKeyPrefix: resendApiKey?.substring(0, 10) + '...' || 'not set'
      },
      sendgrid: {
        configured: !!sendgridApiKey,
        apiKeyLength: sendgridApiKey?.length || 0,
        fromEmail: sendgridFromEmail || 'not set',
        apiKeyPrefix: sendgridApiKey?.substring(0, 10) + '...' || 'not set'
      }
    }

    // Try sending a test email if Resend is configured
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
            to: testEmail,
            subject: 'Test Email from Scorched Fabrics',
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #ec4899;">Test Email</h1>
                <p>This is a test email from your Scorched Fabrics application.</p>
                <p>If you received this email, your email configuration is working correctly! ✅</p>
                <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
              </div>
            `,
          }),
        })

        const responseText = await response.text()
        let responseData

        try {
          responseData = JSON.parse(responseText)
        } catch {
          responseData = { raw: responseText }
        }

        if (!response.ok) {
          return NextResponse.json({
            config,
            testResult: {
              success: false,
              error: responseData.message || responseData.error || responseText,
              status: response.status,
              details: responseData
            },
            suggestion: 'Check your RESEND_API_KEY and RESEND_FROM_EMAIL. Make sure the API key is valid and the from email is verified in Resend.'
          })
        }

        return NextResponse.json({
          config,
          testResult: {
            success: true,
            message: `Test email sent successfully to ${testEmail}`,
            emailId: responseData.id,
            details: responseData
          }
        })
      } catch (error: any) {
        return NextResponse.json({
          config,
          testResult: {
            success: false,
            error: error.message || 'Failed to send test email',
            details: error.toString()
          }
        })
      }
    }

    return NextResponse.json({
      config,
      testResult: {
        success: false,
        message: 'No email service configured',
        suggestion: 'Add RESEND_API_KEY and RESEND_FROM_EMAIL to your .env.local file and restart the server.'
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error.message || error.toString()
      },
      { status: 500 }
    )
  }
}
